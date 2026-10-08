package com.dangsanchaek.auth.service;

import com.dangsanchaek.auth.domain.User;
import com.dangsanchaek.auth.repository.UserRepository;
import com.dangsanchaek.common.exception.BusinessException;
import com.dangsanchaek.common.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * 다른 도메인에서 "현재 로그인한 활성 회원"을 조회할 때 사용한다. 탈퇴 회원의 남은 토큰은 여기서 걸러진다.
 */
@Component
@RequiredArgsConstructor
public class UserReader {

    private final UserRepository userRepository;

    public User getActiveUser(Long userId) {
        return userRepository.findById(userId)
                .filter(User::isActive)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
    }
}
