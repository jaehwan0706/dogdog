package com.dangsanchaek.auth.service.oauth;

import com.dangsanchaek.auth.domain.AuthProvider;
import com.dangsanchaek.common.exception.BusinessException;
import com.dangsanchaek.common.exception.ErrorCode;
import com.dangsanchaek.config.properties.OAuthWebProperties;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.Duration;

/**
 * 구글 로그인 (Google Cloud 의 "웹 애플리케이션" OAuth 클라이언트). 코드를 바꿔 받은 ID 토큰은
 * GoogleTokenVerifier 가 구글 공개키로 검증한다 (이 클라이언트 ID 도 허용 대상에 들어감).
 */
@Component
public class GoogleWebClient implements OAuthWebClient {

    private final OAuthWebProperties.Client client;
    private final RestClient http;

    public GoogleWebClient(OAuthWebProperties properties) {
        this.client = properties.google();
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(3));
        factory.setReadTimeout(Duration.ofSeconds(5));
        this.http = RestClient.builder().baseUrl("https://oauth2.googleapis.com").requestFactory(factory).build();
    }

    @Override
    public AuthProvider provider() {
        return AuthProvider.GOOGLE;
    }

    /** 구글은 웹 클라이언트에 시크릿이 반드시 필요하다 */
    @Override
    public boolean configured() {
        return client.configured() && client.hasSecret();
    }

    @Override
    public String authorizeUrl(String redirectUri, String state) {
        return UriComponentsBuilder.fromUriString("https://accounts.google.com/o/oauth2/v2/auth")
                .queryParam("response_type", "code")
                .queryParam("client_id", client.clientId())
                .queryParam("redirect_uri", redirectUri)
                .queryParam("scope", "openid email profile")
                .queryParam("state", state)
                .queryParam("prompt", "select_account")
                .encode().build().toUriString();
    }

    @Override
    public String exchangeCode(String code, String redirectUri, String state) {
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", "authorization_code");
        form.add("client_id", client.clientId());
        form.add("client_secret", client.clientSecret());
        form.add("redirect_uri", redirectUri);
        form.add("code", code);
        try {
            TokenResponse body = http.post().uri("/token")
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(form)
                    .retrieve()
                    .body(TokenResponse.class);
            if (body == null || body.idToken() == null) throw new BusinessException(ErrorCode.INVALID_SOCIAL_TOKEN);
            return body.idToken();
        } catch (RestClientException e) {
            throw new BusinessException(ErrorCode.INVALID_SOCIAL_TOKEN);
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record TokenResponse(@JsonProperty("id_token") String idToken) {
    }
}
