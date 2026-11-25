package com.dangsanchaek.auth.service.social;

import com.dangsanchaek.auth.domain.AuthProvider;
import com.dangsanchaek.common.exception.BusinessException;
import com.dangsanchaek.common.exception.ErrorCode;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

/**
 * 네이버: 앱이 네이버 로그인 SDK 로 받은 access token 으로 회원 프로필 API 를 호출해 검증한다.
 */
@Component
public class NaverTokenVerifier implements SocialTokenVerifier {

    private final RestClient client = SocialHttp.client("https://openapi.naver.com");

    @Override
    public AuthProvider provider() {
        return AuthProvider.NAVER;
    }

    @Override
    public SocialProfile verify(String accessToken) {
        NaverResponse body;
        try {
            body = client.get().uri("/v1/nid/me")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                    .retrieve()
                    .body(NaverResponse.class);
        } catch (RestClientException e) {
            throw new BusinessException(ErrorCode.INVALID_SOCIAL_TOKEN);
        }
        if (body == null || !"00".equals(body.resultCode()) || body.response() == null
                || body.response().id() == null) {
            throw new BusinessException(ErrorCode.INVALID_SOCIAL_TOKEN);
        }
        NaverUser user = body.response();
        return new SocialProfile(user.id(), user.email(), user.nickname(), user.profileImage());
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record NaverResponse(@JsonProperty("resultcode") String resultCode, NaverUser response) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record NaverUser(String id, String email, String nickname, @JsonProperty("profile_image") String profileImage) {
    }
}
