package com.dangsanchaek.auth.service.social;

import com.dangsanchaek.auth.domain.AuthProvider;
import com.dangsanchaek.common.exception.BusinessException;
import com.dangsanchaek.common.exception.ErrorCode;
import com.dangsanchaek.config.properties.OAuthProperties;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.stereotype.Component;

import java.util.Set;

/**
 * 구글: 앱이 Google Sign-In 으로 받은 ID 토큰을 구글 공개키로 검증한다.
 * app.oauth.google-client-ids 에 앱의 클라이언트 ID 가 등록돼 있어야 통과한다.
 */
@Component
public class GoogleTokenVerifier implements SocialTokenVerifier {

    private final JwtDecoder decoder;

    public GoogleTokenVerifier(OAuthProperties properties) {
        this.decoder = IdTokenDecoders.create("https://www.googleapis.com/oauth2/v3/certs",
                Set.of("https://accounts.google.com", "accounts.google.com"), properties.googleClientIds());
    }

    @Override
    public AuthProvider provider() {
        return AuthProvider.GOOGLE;
    }

    @Override
    public SocialProfile verify(String idToken) {
        Jwt jwt;
        try {
            jwt = decoder.decode(idToken);
        } catch (JwtException e) {
            throw new BusinessException(ErrorCode.INVALID_SOCIAL_TOKEN);
        }
        String email = Boolean.TRUE.equals(jwt.getClaimAsBoolean("email_verified")) ? jwt.getClaimAsString("email") : null;
        return new SocialProfile(jwt.getSubject(), email, jwt.getClaimAsString("name"), jwt.getClaimAsString("picture"));
    }
}
