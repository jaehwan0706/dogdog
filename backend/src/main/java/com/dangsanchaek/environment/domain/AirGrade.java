package com.dangsanchaek.environment.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * 미세먼지 등급 (환경부 기준).
 * PM10(㎍/㎥): 0~30 좋음, 31~80 보통, 81~150 나쁨, 151~ 매우나쁨
 * PM2.5(㎍/㎥): 0~15 좋음, 16~35 보통, 36~75 나쁨, 76~ 매우나쁨
 */
@Getter
@RequiredArgsConstructor
public enum AirGrade {
    GOOD("좋음"),
    MODERATE("보통"),
    BAD("나쁨"),
    VERY_BAD("매우나쁨");

    private final String label;

    public static AirGrade ofPm10(Integer value) {
        if (value == null) return null;
        if (value <= 30) return GOOD;
        if (value <= 80) return MODERATE;
        if (value <= 150) return BAD;
        return VERY_BAD;
    }

    public static AirGrade ofPm25(Integer value) {
        if (value == null) return null;
        if (value <= 15) return GOOD;
        if (value <= 35) return MODERATE;
        if (value <= 75) return BAD;
        return VERY_BAD;
    }

    /** 에어코리아 예보 문구("좋음", "보통", "나쁨", "매우나쁨") */
    public static AirGrade fromLabel(String label) {
        if (label == null) return null;
        String trimmed = label.replace(" ", "");
        for (AirGrade grade : values()) {
            if (grade.label.equals(trimmed)) return grade;
        }
        return null;
    }

    /** 둘 중 나쁜 등급. 한쪽이 없으면 다른 쪽 */
    public static AirGrade worse(AirGrade a, AirGrade b) {
        if (a == null) return b;
        if (b == null) return a;
        return a.ordinal() >= b.ordinal() ? a : b;
    }

    public boolean isBadOrWorse() {
        return this == BAD || this == VERY_BAD;
    }
}
