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
 * 카카오: 앱이 카카오 SDK 로 받은 access token 으로 사용자 정보 API 를 호출해 검증한다.
 */
@Component
public class KakaoTokenVerifier implements SocialTokenVerifier {

    private final RestClient client = SocialHttp.client("https://kapi.kakao.com");

    @Override
    public AuthProvider provider() {
        return AuthProvider.KAKAO;
    }

    @Override
    public SocialProfile verify(String accessToken) {
        KakaoUser user;
        try {
            user = client.get().uri("/v2/user/me")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                    .retrieve()
                    .body(KakaoUser.class);
        } catch (RestClientException e) {
            throw new BusinessException(ErrorCode.INVALID_SOCIAL_TOKEN);
        }
        if (user == null || user.id() == null) {
            throw new BusinessException(ErrorCode.INVALID_SOCIAL_TOKEN);
        }
        Account account = user.account();
        String email = account != null && Boolean.TRUE.equals(account.emailVerified()) ? account.email() : null;
        Profile profile = account == null ? null : account.profile();
        return new SocialProfile(String.valueOf(user.id()), email,
                profile == null ? null : profile.nickname(),
                profile == null ? null : profile.profileImageUrl());
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record KakaoUser(Long id, @JsonProperty("kakao_account") Account account) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record Account(String email, @JsonProperty("is_email_verified") Boolean emailVerified, Profile profile) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record Profile(String nickname, @JsonProperty("profile_image_url") String profileImageUrl) {
    }
}
