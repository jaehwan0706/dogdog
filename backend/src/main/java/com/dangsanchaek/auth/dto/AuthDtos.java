package com.dangsanchaek.auth.dto;

import com.dangsanchaek.auth.domain.AuthProvider;
import com.dangsanchaek.auth.domain.User;
import com.dangsanchaek.auth.domain.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

/**
 * 인증/회원 API 요청·응답 DTO 모음.
 */
public final class AuthDtos {

    private AuthDtos() {
    }

    static final String PASSWORD_REGEX = "^(?=.*[A-Za-z])(?=.*\\d)\\S{8,64}$";
    static final String PASSWORD_MESSAGE = "비밀번호는 영문과 숫자를 포함해 공백 없이 8~64자여야 합니다.";

    public record SignupRequest(
            @NotBlank(message = "이메일을 입력해 주세요.")
            @Email(message = "이메일 형식이 올바르지 않습니다.")
            @Size(max = 255)
            String email,

            @NotBlank(message = "비밀번호를 입력해 주세요.")
            @Pattern(regexp = PASSWORD_REGEX, message = PASSWORD_MESSAGE)
            String password,

            @NotBlank(message = "닉네임을 입력해 주세요.")
            @Size(min = 2, max = 20, message = "닉네임은 2~20자여야 합니다.")
            String nickname
    ) {
    }

    public record LoginRequest(
            @NotBlank(message = "이메일을 입력해 주세요.") String email,
            @NotBlank(message = "비밀번호를 입력해 주세요.") String password
    ) {
    }

    /**
     * @param token    kakao/naver: 액세스 토큰, google/apple: ID 토큰(identity token)
     * @param nickname 선택. Apple 은 최초 로그인 때만 이름을 클라이언트에 주므로 앱에서 전달한다.
     */
    public record SocialLoginRequest(
            @NotBlank(message = "소셜 로그인 토큰이 필요합니다.") String token,
            @Size(max = 20) String nickname
    ) {
    }

    public record RefreshRequest(@NotBlank(message = "refreshToken 이 필요합니다.") String refreshToken) {
    }

    public record TokenResponse(
            String tokenType,
            String accessToken,
            long accessTokenExpiresIn,
            String refreshToken,
            boolean isNewUser,
            UserResponse user
    ) {
    }

    public record UserResponse(
            Long id,
            String email,
            String nickname,
            String profileImageUrl,
            AuthProvider provider,
            UserRole role,
            LocalDateTime createdAt
    ) {
        public static UserResponse from(User user) {
            return new UserResponse(user.getId(), user.getEmail(), user.getNickname(), user.getProfileImageUrl(),
                    user.getProvider(), user.getRole(), user.getCreatedAt());
        }
    }

    public record AvailabilityResponse(boolean available) {
    }

    public record UpdateProfileRequest(
            @Size(min = 2, max = 20, message = "닉네임은 2~20자여야 합니다.") String nickname,
            @Size(max = 500) String profileImageUrl
    ) {
    }

    public record ChangePasswordRequest(
            @NotBlank(message = "현재 비밀번호를 입력해 주세요.") String currentPassword,
            @NotBlank(message = "새 비밀번호를 입력해 주세요.")
            @Pattern(regexp = PASSWORD_REGEX, message = PASSWORD_MESSAGE)
            String newPassword
    ) {
    }
}
