package com.dangsanchaek.environment.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * 기상청 강수형태(PTY) 코드.
 * 단기예보: 0 없음, 1 비, 2 비/눈, 3 눈, 4 소나기 / 초단기실황: 0 없음, 1 비, 2 비/눈, 3 눈, 5 빗방울, 6 빗방울눈날림, 7 눈날림
 */
@Getter
@RequiredArgsConstructor
public enum PrecipitationType {
    NONE("없음"),
    RAIN("비"),
    RAIN_SNOW("비/눈"),
    SNOW("눈"),
    SHOWER("소나기");

    private final String label;

    public static PrecipitationType fromKmaCode(Integer code) {
        if (code == null) return null;
        return switch (code) {
            case 0 -> NONE;
            case 1, 5 -> RAIN;
            case 2, 6 -> RAIN_SNOW;
            case 3, 7 -> SNOW;
            case 4 -> SHOWER;
            default -> null;
        };
    }

    public boolean isFalling() {
        return this != NONE;
    }
}
