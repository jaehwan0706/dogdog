package com.dangsanchaek.config.properties;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

/**
 * @param mockEnabled      true 이면 "mock:{providerId}:{email}" 형식의 토큰을 실제 검증 없이 통과시킨다. (로컬/Postman 테스트 전용, 운영에서 절대 true 금지)
 * @param googleClientIds  Google ID 토큰의 aud 로 허용할 클라이언트 ID 목록 (iOS/Android/Web)
 * @param appleClientIds   Apple identity token 의 aud 로 허용할 값 목록 (앱 Bundle ID, Services ID)
 */
@ConfigurationProperties("app.oauth")
public record OAuthProperties(boolean mockEnabled, List<String> googleClientIds, List<String> appleClientIds) {

    public OAuthProperties {
        googleClientIds = googleClientIds == null ? List.of() : List.copyOf(googleClientIds);
        appleClientIds = appleClientIds == null ? List.of() : List.copyOf(appleClientIds);
    }
}
