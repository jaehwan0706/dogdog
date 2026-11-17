package com.dangsanchaek.auth.repository;

import com.dangsanchaek.auth.domain.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findByTokenHash(String tokenHash);

    @Modifying
    @Query("delete from RefreshToken t where t.tokenHash = :tokenHash")
    int deleteByTokenHash(String tokenHash);

    @Modifying
    @Query("delete from RefreshToken t where t.userId = :userId")
    int deleteAllByUserId(Long userId);

    @Modifying
    @Query("delete from RefreshToken t where t.expiresAt < :now")
    int deleteExpired(LocalDateTime now);
}
