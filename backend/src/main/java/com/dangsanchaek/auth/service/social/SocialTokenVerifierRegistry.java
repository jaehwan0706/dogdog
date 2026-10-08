package com.dangsanchaek.auth.service.social;

import com.dangsanchaek.auth.domain.AuthProvider;
import com.dangsanchaek.common.exception.BusinessException;
import com.dangsanchaek.common.exception.ErrorCode;
import com.dangsanchaek.config.properties.OAuthProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;

/**
 * Provider 별 검증기 선택.
 * <p>
 * app.oauth.mock-enabled=true 일 때는 "mock:{providerId}" 또는 "mock:{providerId}:{email}" 토큰을
 * 실제 소셜 서버 호출 없이 통과시킨다. (로컬/Postman 테스트 전용)
 */
@Slf4j
@Component
public class SocialTokenVerifierRegistry {

    private static final String MOCK_PREFIX = "mock:";

    private final Map<AuthProvider, SocialTokenVerifier> verifiers = new EnumMap<>(AuthProvider.class);
    private final boolean mockEnabled;

    public SocialTokenVerifierRegistry(List<SocialTokenVerifier> verifierList, OAuthProperties properties) {
        verifierList.forEach(v -> verifiers.put(v.provider(), v));
        this.mockEnabled = properties.mockEnabled();
        if (mockEnabled) {
            log.warn("app.oauth.mock-enabled=true : 소셜 로그인 mock 토큰이 허용됩니다. 운영 환경에서는 반드시 끄세요.");
        }
    }

    public SocialProfile verify(AuthProvider provider, String token) {
        if (mockEnabled && token.startsWith(MOCK_PREFIX)) {
            return mockProfile(token);
        }
        SocialTokenVerifier verifier = verifiers.get(provider);
        if (verifier == null) {
            throw new BusinessException(ErrorCode.UNSUPPORTED_PROVIDER);
        }
        return verifier.verify(token);
    }

    private static SocialProfile mockProfile(String token) {
        String[] parts = token.substring(MOCK_PREFIX.length()).split(":", 2);
        if (parts[0].isBlank()) {
            throw new BusinessException(ErrorCode.INVALID_SOCIAL_TOKEN);
        }
        String email = parts.length > 1 && !parts[1].isBlank() ? parts[1] : null;
        return new SocialProfile(parts[0], email, null, null);
    }
}
