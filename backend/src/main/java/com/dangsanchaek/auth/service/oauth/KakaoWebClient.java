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

/** 카카오 로그인 (REST API 키). 받은 액세스 토큰은 KakaoTokenVerifier 가 사용자 정보로 검증한다. */
@Component
public class KakaoWebClient implements OAuthWebClient {

    private final OAuthWebProperties.Client client;
    private final RestClient http;

    public KakaoWebClient(OAuthWebProperties properties) {
        this.client = properties.kakao();
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(3));
        factory.setReadTimeout(Duration.ofSeconds(5));
        this.http = RestClient.builder().baseUrl("https://kauth.kakao.com").requestFactory(factory).build();
    }

    @Override
    public AuthProvider provider() {
        return AuthProvider.KAKAO;
    }

    @Override
    public boolean configured() {
        return client.configured();
    }

    @Override
    public String authorizeUrl(String redirectUri, String state) {
        return UriComponentsBuilder.fromUriString("https://kauth.kakao.com/oauth/authorize")
                .queryParam("response_type", "code")
                .queryParam("client_id", client.clientId())
                .queryParam("redirect_uri", redirectUri)
                .queryParam("state", state)
                .encode().build().toUriString();
    }

    @Override
    public String exchangeCode(String code, String redirectUri, String state) {
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", "authorization_code");
        form.add("client_id", client.clientId());
        form.add("redirect_uri", redirectUri);
        form.add("code", code);
        if (client.hasSecret()) form.add("client_secret", client.clientSecret());
        try {
            TokenResponse body = http.post().uri("/oauth/token")
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(form)
                    .retrieve()
                    .body(TokenResponse.class);
            if (body == null || body.accessToken() == null) throw new BusinessException(ErrorCode.INVALID_SOCIAL_TOKEN);
            return body.accessToken();
        } catch (RestClientException e) {
            throw new BusinessException(ErrorCode.INVALID_SOCIAL_TOKEN);
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record TokenResponse(@JsonProperty("access_token") String accessToken) {
    }
}
