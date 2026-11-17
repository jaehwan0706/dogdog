package com.dangsanchaek.auth.service.oauth;

import com.dangsanchaek.auth.domain.AuthProvider;

/**
 * 소셜 서비스별 웹 로그인(Authorization Code) 처리. 받은 토큰은 기존 SocialTokenVerifier 로 검증한다.
 */
public interface OAuthWebClient {

    AuthProvider provider();

    /** 콘솔 키가 설정돼 있는지 */
    boolean configured();

    /** 사용자를 보낼 소셜 로그인 화면 주소 */
    String authorizeUrl(String redirectUri, String state);

    /** 콜백으로 받은 code 를 SocialTokenVerifier 가 검증할 토큰(액세스 토큰 또는 ID 토큰)으로 바꾼다 */
    String exchangeCode(String code, String redirectUri, String state);
}
