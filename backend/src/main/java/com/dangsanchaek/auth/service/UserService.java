package com.dangsanchaek.auth.service;

import com.dangsanchaek.auth.domain.User;
import com.dangsanchaek.auth.domain.UserWithdrawnEvent;
import com.dangsanchaek.auth.dto.AuthDtos.ChangePasswordRequest;
import com.dangsanchaek.auth.dto.AuthDtos.UpdateProfileRequest;
import com.dangsanchaek.auth.dto.AuthDtos.UserResponse;
import com.dangsanchaek.auth.repository.UserRepository;
import com.dangsanchaek.common.exception.BusinessException;
import com.dangsanchaek.common.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserReader userReader;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final TokenService tokenService;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional(readOnly = true)
    public UserResponse getMe(Long userId) {
        return UserResponse.from(userReader.getActiveUser(userId));
    }

    @Transactional
    public UserResponse updateProfile(Long userId, UpdateProfileRequest request) {
        User user = userReader.getActiveUser(userId);
        if (request.nickname() != null) {
            String nickname = request.nickname().strip();
            if (!nickname.equals(user.getNickname()) && userRepository.existsByNickname(nickname)) {
                throw new BusinessException(ErrorCode.NICKNAME_ALREADY_EXISTS);
            }
            user.changeNickname(nickname);
        }
        if (request.profileImageUrl() != null) {
            user.changeProfileImage(request.profileImageUrl().isBlank() ? null : request.profileImageUrl());
        }
        userRepository.flush();
        return UserResponse.from(user);
    }

    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        User user = userReader.getActiveUser(userId);
        if (!user.isLocal()) {
            throw new BusinessException(ErrorCode.PASSWORD_LOGIN_NOT_AVAILABLE);
        }
        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new BusinessException(ErrorCode.INVALID_CURRENT_PASSWORD);
        }
        user.changePassword(passwordEncoder.encode(request.newPassword()));
        tokenService.revokeAll(userId);
    }

    /** 회원 탈퇴 (앱스토어 심사 필수 요건). */
    @Transactional
    public void withdraw(Long userId) {
        User user = userReader.getActiveUser(userId);
        user.withdraw();
        tokenService.revokeAll(userId);
        eventPublisher.publishEvent(new UserWithdrawnEvent(userId));
    }
}
