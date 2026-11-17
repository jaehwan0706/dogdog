package com.dangsanchaek.auth.service;

import com.dangsanchaek.auth.domain.RefreshToken;
import com.dangsanchaek.auth.domain.User;
import com.dangsanchaek.auth.dto.AuthDtos.TokenResponse;
import com.dangsanchaek.auth.dto.AuthDtos.UserResponse;
import com.dangsanchaek.auth.repository.RefreshTokenRepository;
import com.dangsanchaek.auth.repository.UserRepository;
import com.dangsanchaek.common.exception.BusinessException;
import com.dangsanchaek.common.exception.ErrorCode;
import com.dangsanchaek.config.properties.JwtProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.List;

/**
 * Access Token(JWT) + Refresh Token(불투명 랜덤 문자열, 서버엔 해시 저장, 사용 시 회전) 발급/재발급/폐기.
 */
@Service
@RequiredArgsConstructor
public class TokenService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final JwtEncoder jwtEncoder;
    private final JwtProperties jwtProperties;
    private final RefreshTokenRepository refreshTokenRepository;
    private final UserRepository userRepository;

    @Transactional
    public TokenResponse issue(User user, boolean isNewUser) {
        String accessToken = createAccessToken(user);
        String refreshToken = createRefreshToken();
        refreshTokenRepository.save(new RefreshToken(user.getId(), hash(refreshToken),
                LocalDateTime.now().plus(jwtProperties.refreshTokenTtl())));
        return new TokenResponse("Bearer", accessToken, jwtProperties.accessTokenTtl().toSeconds(), refreshToken,
                isNewUser, UserResponse.from(user));
    }

    @Transactional(noRollbackFor = BusinessException.class)
    public TokenResponse refresh(String rawRefreshToken) {
        RefreshToken stored = refreshTokenRepository.findByTokenHash(hash(rawRefreshToken))
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_REFRESH_TOKEN));
        // 한 번 사용한 리프레시 토큰은 즉시 폐기(회전)
        refreshTokenRepository.delete(stored);
        if (stored.isExpired()) {
            throw new BusinessException(ErrorCode.INVALID_REFRESH_TOKEN);
        }
        User user = userRepository.findById(stored.getUserId())
                .filter(User::isActive)
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_REFRESH_TOKEN));
        return issue(user, false);
    }

    @Transactional
    public void revoke(String rawRefreshToken) {
        refreshTokenRepository.deleteByTokenHash(hash(rawRefreshToken));
    }

    @Transactional
    public void revokeAll(Long userId) {
        refreshTokenRepository.deleteAllByUserId(userId);
    }

    @Scheduled(cron = "0 0 4 * * *")
    @Transactional
    public void purgeExpired() {
        refreshTokenRepository.deleteExpired(LocalDateTime.now());
    }

    private String createAccessToken(User user) {
        Instant now = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer(jwtProperties.issuer())
                .issuedAt(now)
                .expiresAt(now.plus(jwtProperties.accessTokenTtl()))
                .subject(String.valueOf(user.getId()))
                .claim("roles", List.of(user.getRole().name()))
                .build();
        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        return jwtEncoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
    }

    private static String createRefreshToken() {
        byte[] bytes = new byte[48];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private static String hash(String value) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
