package com.dangsanchaek.auth.service.social;

/**
 * 소셜 서비스에서 검증을 마친 회원 정보.
 *
 * @param providerId 소셜 서비스의 회원 고유 ID (필수)
 * @param email      제공/검증된 경우에만 값이 있음
 */
public record SocialProfile(String providerId, String email, String nickname, String profileImageUrl) {
}
