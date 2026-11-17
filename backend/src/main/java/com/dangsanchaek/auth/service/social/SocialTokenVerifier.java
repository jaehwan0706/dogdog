package com.dangsanchaek.auth.service.social;

import com.dangsanchaek.auth.domain.AuthProvider;

/**
 * 앱(클라이언트)이 각 소셜 SDK 로 받은 토큰을 서버에서 다시 검증한다.
 * 실패 시 BusinessException(INVALID_SOCIAL_TOKEN) 을 던진다.
 */
public interface SocialTokenVerifier {

    AuthProvider provider();

    SocialProfile verify(String token);
}
