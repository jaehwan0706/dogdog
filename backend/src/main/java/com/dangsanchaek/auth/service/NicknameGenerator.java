package com.dangsanchaek.auth.service;

import com.dangsanchaek.auth.repository.UserRepository;
import com.dangsanchaek.common.exception.BusinessException;
import com.dangsanchaek.common.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.concurrent.ThreadLocalRandom;

/**
 * 소셜 가입 시 닉네임 자동 생성. 원하는 닉네임이 비었거나 이미 있으면 "{접두어}_{6자리 숫자}" 로 만든다.
 */
@Component
@RequiredArgsConstructor
public class NicknameGenerator {

    private static final int MAX_LENGTH = 20;
    private static final int PREFIX_MAX = MAX_LENGTH - 7;
    private static final String DEFAULT_PREFIX = "산책러";

    private final UserRepository userRepository;

    public String generate(String preferred) {
        String base = preferred == null ? "" : preferred.strip();
        if (base.length() > MAX_LENGTH) {
            base = base.substring(0, MAX_LENGTH);
        }
        if (base.length() >= 2 && !userRepository.existsByNickname(base)) {
            return base;
        }
        String prefix = base.length() >= 2 ? base.substring(0, Math.min(base.length(), PREFIX_MAX)) : DEFAULT_PREFIX;
        for (int i = 0; i < 10; i++) {
            String candidate = prefix + "_" + ThreadLocalRandom.current().nextInt(100_000, 1_000_000);
            if (!userRepository.existsByNickname(candidate)) {
                return candidate;
            }
        }
        throw new BusinessException(ErrorCode.NICKNAME_ALREADY_EXISTS);
    }
}
