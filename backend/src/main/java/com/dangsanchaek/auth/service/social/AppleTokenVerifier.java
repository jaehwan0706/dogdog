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
 * Apple: 앱이 Sign in with Apple 로 받은 identity token(JWT)을 애플 공개키로 검증한다.
 * app.oauth.apple-client-ids 에 앱 Bundle ID(또는 Services ID)가 등록돼 있어야 통과한다.
 * 이름은 토큰에 없으므로 앱이 최초 로그인 시 받은 이름을 요청 body 의 nickname 으로 넘긴다.
 */
@Component
public class AppleTokenVerifier implements SocialTokenVerifier {

    private final JwtDecoder decoder;

    public AppleTokenVerifier(OAuthProperties properties) {
        this.decoder = IdTokenDecoders.create("https://appleid.apple.com/auth/keys",
                Set.of("https://appleid.apple.com"), properties.appleClientIds());
    }

    @Override
    public AuthProvider provider() {
        return AuthProvider.APPLE;
    }

    @Override
    public SocialProfile verify(String identityToken) {
        Jwt jwt;
        try {
            jwt = decoder.decode(identityToken);
        } catch (JwtException e) {
            throw new BusinessException(ErrorCode.INVALID_SOCIAL_TOKEN);
        }
        return new SocialProfile(jwt.getSubject(), jwt.getClaimAsString("email"), null, null);
    }
}
