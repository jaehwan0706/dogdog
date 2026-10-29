package com.dangsanchaek.config.properties;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.nio.charset.StandardCharsets;
import java.time.Duration;

@ConfigurationProperties("app.jwt")
public record JwtProperties(String secret, String issuer, Duration accessTokenTtl, Duration refreshTokenTtl) {

    public JwtProperties {
        if (secret == null || secret.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalStateException("app.jwt.secret 은 32바이트 이상이어야 합니다. (환경변수 JWT_SECRET)");
        }
        if (issuer == null) issuer = "dangsanchaek";
        if (accessTokenTtl == null) accessTokenTtl = Duration.ofMinutes(30);
        if (refreshTokenTtl == null) refreshTokenTtl = Duration.ofDays(14);
    }
}
