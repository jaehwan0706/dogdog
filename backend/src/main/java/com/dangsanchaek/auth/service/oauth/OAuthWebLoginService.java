package com.dangsanchaek.auth.service.oauth;

import com.dangsanchaek.auth.domain.AuthProvider;
import com.dangsanchaek.auth.dto.AuthDtos.TokenResponse;
import com.dangsanchaek.auth.service.AuthService;
import com.dangsanchaek.common.exception.BusinessException;
import com.dangsanchaek.common.exception.ErrorCode;
import com.dangsanchaek.config.properties.OAuthProperties;
import com.dangsanchaek.config.properties.OAuthWebProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 서버 웹 로그인 흐름.
 * <ol>
 *   <li>앱이 브라우저로 /auth/oauth/{provider}/start?redirect={앱 주소} 를 연다 → 소셜 로그인 화면으로 이동</li>
 *   <li>소셜 서비스가 /auth/oauth/{provider}/callback 으로 code 를 보낸다 → 서버가 로그인 처리 후 1회용 ticket 을 붙여 앱 주소로 이동</li>
 *   <li>앱이 POST /auth/oauth/exchange 로 ticket 을 토큰으로 바꾼다 (토큰을 URL 에 싣지 않기 위해)</li>
 * </ol>
 * state·ticket 은 메모리에 둔다. 서버를 여러 대로 늘리면 Redis 등 공용 저장소로 옮겨야 한다.
 */
@Slf4j
@Service
public class OAuthWebLoginService {

    private static final Duration STATE_TTL = Duration.ofMinutes(10);
    private static final Duration TICKET_TTL = Duration.ofSeconds(60);
    private static final SecureRandom RANDOM = new SecureRandom();

    private final Map<AuthProvider, OAuthWebClient> clients = new EnumMap<>(AuthProvider.class);
    private final Map<String, PendingLogin> states = new ConcurrentHashMap<>();
    private final Map<String, IssuedTicket> tickets = new ConcurrentHashMap<>();
    private final OAuthWebProperties properties;
    private final boolean mockEnabled;
    private final AuthService authService;

    public OAuthWebLoginService(List<OAuthWebClient> clientList, OAuthWebProperties properties,
                                OAuthProperties oauthProperties, AuthService authService) {
        clientList.forEach(c -> clients.put(c.provider(), c));
        this.properties = properties;
        this.mockEnabled = oauthProperties.mockEnabled();
        this.authService = authService;
    }

    /** 로그인 시작: 소셜 로그인 화면 주소를 돌려준다. 키가 없고 mock 이 켜져 있으면 바로 콜백으로 보낸다 (로컬 테스트용) */
    public URI start(String providerPath, String appRedirect) {
        removeExpired();
        AuthProvider provider = AuthProvider.fromSocialPath(providerPath);
        if (!isAllowedRedirect(appRedirect)) {
            throw new BusinessException(ErrorCode.INVALID_REDIRECT_URI);
        }
        OAuthWebClient client = clients.get(provider);
        String state = randomToken();
        states.put(state, new PendingLogin(provider, appRedirect, Instant.now().plus(STATE_TTL)));
        String callback = callbackUrl(provider);

        if (client != null && client.configured()) {
            return URI.create(client.authorizeUrl(callback, state));
        }
        if (mockEnabled) {
            String id = "dev-" + provider.name().toLowerCase();
            return UriComponentsBuilder.fromUriString(callback)
                    .queryParam("code", "mock:" + id + ":" + id + "@dangsanchaek.dev")
                    .queryParam("state", state)
                    .encode().build().toUri();
        }
        states.remove(state);
        throw new BusinessException(ErrorCode.SOCIAL_LOGIN_NOT_CONFIGURED);
    }

    /**
     * 소셜 서비스 콜백: 로그인 처리 후 앱 주소에 ticket(성공) 또는 error(실패)를 붙여 돌려준다.
     * state 가 없거나 만료되면 돌려보낼 앱 주소를 모르므로 예외를 던진다.
     */
    public URI callback(String providerPath, String code, String state, String error) {
        AuthProvider provider = AuthProvider.fromSocialPath(providerPath);
        PendingLogin pending = state == null ? null : states.remove(state);
        if (pending == null || pending.expired() || pending.provider() != provider) {
            throw new BusinessException(ErrorCode.INVALID_OAUTH_STATE);
        }
        if (error != null || code == null || code.isBlank()) {
            // 사용자가 로그인 화면에서 취소한 경우 (카카오·네이버·구글 모두 error=access_denied 등)
            return withParam(pending.appRedirect(), "error", "CANCELLED");
        }
        try {
            String socialToken = mockEnabled && code.startsWith("mock:")
                    ? code
                    : requireClient(provider).exchangeCode(code, callbackUrl(provider), state);
            TokenResponse tokens = authService.loginWithSocialToken(provider, socialToken, null);
            String ticket = randomToken();
            tickets.put(ticket, new IssuedTicket(tokens, Instant.now().plus(TICKET_TTL)));
            return withParam(pending.appRedirect(), "ticket", ticket);
        } catch (BusinessException e) {
            log.info("소셜 웹 로그인 실패 provider={} code={}", provider, e.getErrorCode());
            return withParam(pending.appRedirect(), "error", e.getErrorCode().name());
        }
    }

    /** 1회용 ticket 을 토큰으로 교환 (재사용·만료 시 401) */
    public TokenResponse exchange(String ticket) {
        removeExpired();
        IssuedTicket issued = ticket == null ? null : tickets.remove(ticket);
        if (issued == null || issued.expired()) {
            throw new BusinessException(ErrorCode.INVALID_OAUTH_TICKET);
        }
        return issued.tokens();
    }

    private OAuthWebClient requireClient(AuthProvider provider) {
        OAuthWebClient client = clients.get(provider);
        if (client == null || !client.configured()) throw new BusinessException(ErrorCode.SOCIAL_LOGIN_NOT_CONFIGURED);
        return client;
    }

    private String callbackUrl(AuthProvider provider) {
        return properties.callbackBaseUrl() + "/auth/oauth/" + provider.name().toLowerCase() + "/callback";
    }

    /**
     * 열린 리다이렉트(로그인 결과를 다른 사이트로 빼돌리기) 방지.
     * "dangsanchaek://" 같은 항목은 스킴만, "http://localhost:8082" 같은 항목은 스킴·호스트·포트를 모두 비교한다.
     */
    boolean isAllowedRedirect(String redirect) {
        if (redirect == null || redirect.isBlank()) return false;
        URI target;
        try {
            target = URI.create(redirect);
        } catch (IllegalArgumentException e) {
            return false;
        }
        if (target.getScheme() == null) return false;
        for (String allowed : properties.allowedRedirects()) {
            if (allowed.endsWith("://")) {
                if (target.getScheme().equalsIgnoreCase(allowed.substring(0, allowed.length() - 3))) return true;
                continue;
            }
            URI origin = URI.create(allowed);
            if (target.getScheme().equalsIgnoreCase(origin.getScheme())
                    && Objects.equals(lower(target.getHost()), lower(origin.getHost()))
                    && port(target) == port(origin)) {
                return true;
            }
        }
        return false;
    }

    private static int port(URI uri) {
        if (uri.getPort() != -1) return uri.getPort();
        return "https".equalsIgnoreCase(uri.getScheme()) ? 443 : "http".equalsIgnoreCase(uri.getScheme()) ? 80 : -1;
    }

    private static String lower(String value) {
        return value == null ? null : value.toLowerCase();
    }

    private static URI withParam(String appRedirect, String name, String value) {
        return UriComponentsBuilder.fromUriString(appRedirect).queryParam(name, value).encode().build().toUri();
    }

    private void removeExpired() {
        states.values().removeIf(PendingLogin::expired);
        tickets.values().removeIf(IssuedTicket::expired);
    }

    private static String randomToken() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private record PendingLogin(AuthProvider provider, String appRedirect, Instant expiresAt) {
        boolean expired() {
            return Instant.now().isAfter(expiresAt);
        }
    }

    private record IssuedTicket(TokenResponse tokens, Instant expiresAt) {
        boolean expired() {
            return Instant.now().isAfter(expiresAt);
        }
    }
}
