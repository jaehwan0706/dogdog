package com.dangsanchaek.config.properties;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

/**
 * 서버 웹 로그인(브라우저로 소셜 로그인 → 서버 콜백) 설정.
 *
 * @param callbackBaseUrl  소셜 서비스가 로그인 후 돌아올 이 서버의 주소 (예: http://localhost:8090). 각 개발자 콘솔에
 *                         {callbackBaseUrl}/auth/oauth/{provider}/callback 을 Redirect URI 로 등록해야 한다.
 * @param allowedRedirects 로그인 결과를 돌려보낼 수 있는 앱 주소. "dangsanchaek://" 처럼 :// 로 끝나면 스킴만,
 *                         "http://localhost:8082" 처럼 쓰면 스킴·호스트·포트가 모두 같아야 허용한다.
 */
@ConfigurationProperties("app.oauth.web")
public record OAuthWebProperties(String callbackBaseUrl, List<String> allowedRedirects, Client kakao, Client naver,
                                 Client google) {

    public OAuthWebProperties {
        callbackBaseUrl = callbackBaseUrl == null ? "" : callbackBaseUrl.replaceAll("/+$", "");
        allowedRedirects = allowedRedirects == null ? List.of() : List.copyOf(allowedRedirects);
        kakao = kakao == null ? Client.EMPTY : kakao;
        naver = naver == null ? Client.EMPTY : naver;
        google = google == null ? Client.EMPTY : google;
    }

    /** 카카오는 REST API 키가 clientId, 클라이언트 시크릿은 콘솔에서 켰을 때만 필요 */
    public record Client(String clientId, String clientSecret) {
        static final Client EMPTY = new Client(null, null);

        public boolean configured() {
            return clientId != null && !clientId.isBlank();
        }

        public boolean hasSecret() {
            return clientSecret != null && !clientSecret.isBlank();
        }
    }
}
