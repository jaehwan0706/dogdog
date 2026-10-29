package com.dangsanchaek.auth.domain;

import com.dangsanchaek.common.exception.BusinessException;
import com.dangsanchaek.common.exception.ErrorCode;

import java.util.Arrays;

public enum AuthProvider {
    LOCAL, KAKAO, GOOGLE, NAVER, APPLE;

    /** URL 경로(/auth/social/{provider})의 소문자 이름을 소셜 Provider 로 변환한다. LOCAL 은 허용하지 않는다. */
    public static AuthProvider fromSocialPath(String value) {
        return Arrays.stream(values())
                .filter(p -> p != LOCAL && p.name().equalsIgnoreCase(value))
                .findFirst()
                .orElseThrow(() -> new BusinessException(ErrorCode.UNSUPPORTED_PROVIDER));
    }
}
