package com.dangsanchaek.auth.domain;

import com.dangsanchaek.common.entity.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

@Getter
@Entity
@Table(name = "users")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class User extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 이메일 가입은 필수, 소셜 가입은 제공될 때만 저장. 탈퇴 시 null 로 비식별화. */
    @Column(length = 255, unique = true)
    private String email;

    /** 소셜 로그인 계정은 null */
    @Column(name = "password_hash", length = 255)
    private String passwordHash;

    @Column(nullable = false, unique = true, length = 20)
    private String nickname;

    @Column(name = "profile_image_url", length = 500)
    private String profileImageUrl;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 20)
    private AuthProvider provider;

    /** 소셜 서비스의 회원 고유 ID (Kakao id, Google/Apple sub, Naver id). LOCAL 은 null */
    @Column(name = "provider_id", length = 255)
    private String providerId;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 20)
    private UserRole role;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 20)
    private UserStatus status;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    private User(String email, String passwordHash, String nickname, String profileImageUrl,
                 AuthProvider provider, String providerId, UserRole role) {
        this.email = email;
        this.passwordHash = passwordHash;
        this.nickname = nickname;
        this.profileImageUrl = profileImageUrl;
        this.provider = provider;
        this.providerId = providerId;
        this.role = role;
        this.status = UserStatus.ACTIVE;
    }

    public static User createLocal(String email, String passwordHash, String nickname, UserRole role) {
        return new User(email, passwordHash, nickname, null, AuthProvider.LOCAL, null, role);
    }

    public static User createSocial(AuthProvider provider, String providerId, String email, String nickname,
                                    String profileImageUrl) {
        return new User(email, null, nickname, profileImageUrl, provider, providerId, UserRole.USER);
    }

    public boolean isActive() {
        return status == UserStatus.ACTIVE;
    }

    public boolean isLocal() {
        return provider == AuthProvider.LOCAL;
    }

    public void changeNickname(String nickname) {
        this.nickname = nickname;
    }

    public void changeProfileImage(String profileImageUrl) {
        this.profileImageUrl = profileImageUrl;
    }

    public void changePassword(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    /** 회원 탈퇴: 개인정보를 비식별화하고 상태만 남긴다. (게시글/댓글 작성자 표시는 "탈퇴회원_{id}") */
    public void withdraw() {
        this.status = UserStatus.DELETED;
        this.deletedAt = LocalDateTime.now();
        this.email = null;
        this.passwordHash = null;
        this.providerId = null;
        this.profileImageUrl = null;
        this.nickname = "탈퇴회원_" + id;
    }
}
