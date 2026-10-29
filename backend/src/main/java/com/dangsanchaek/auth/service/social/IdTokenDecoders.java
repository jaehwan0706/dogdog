package com.dangsanchaek.auth.service.social;

import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.jwt.JwtClaimNames;
import org.springframework.security.oauth2.jwt.JwtClaimValidator;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtTimestampValidator;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;

import java.util.Collection;
import java.util.List;
import java.util.Set;

/**
 * OpenID Connect ID 토큰(Google, Apple) 검증용 디코더 생성.
 * 공개키(JWKS)로 서명을 검증하고, 만료·발급자(iss)·대상(aud)을 확인한다.
 * <p>
 * 주의: 이 디코더는 Spring Bean 으로 등록하지 않는다. (자체 Access Token 용 JwtDecoder 와 충돌 방지)
 */
final class IdTokenDecoders {

    private IdTokenDecoders() {
    }

    static JwtDecoder create(String jwkSetUri, Set<String> issuers, List<String> audiences) {
        NimbusJwtDecoder decoder = NimbusJwtDecoder.withJwkSetUri(jwkSetUri).build();
        decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(
                new JwtTimestampValidator(),
                new JwtClaimValidator<Object>(JwtClaimNames.ISS, iss -> iss != null && issuers.contains(iss.toString())),
                new JwtClaimValidator<Collection<String>>(JwtClaimNames.AUD,
                        aud -> aud != null && aud.stream().anyMatch(audiences::contains))));
        return decoder;
    }
}
