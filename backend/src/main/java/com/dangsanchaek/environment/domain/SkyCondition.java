package com.dangsanchaek.environment.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/** 기상청 단기예보 하늘상태(SKY) 코드: 1 맑음, 3 구름많음, 4 흐림 */
@Getter
@RequiredArgsConstructor
public enum SkyCondition {
    CLEAR("맑음"),
    CLOUDY("구름많음"),
    OVERCAST("흐림");

    private final String label;

    public static SkyCondition fromKmaCode(Integer code) {
        if (code == null) return null;
        return switch (code) {
            case 1 -> CLEAR;
            case 3 -> CLOUDY;
            case 4 -> OVERCAST;
            default -> null;
        };
    }
}
