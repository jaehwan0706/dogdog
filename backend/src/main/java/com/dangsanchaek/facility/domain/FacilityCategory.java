package com.dangsanchaek.facility.domain;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

/**
 * 앱에서 쓰는 시설 분류. 원본 데이터의 '카테고리3' 값을 묶어서 만든다.
 */
public enum FacilityCategory {
    HOSPITAL("동물병원", List.of("동물병원")),
    PHARMACY("동물약국", List.of("동물약국")),
    CAFE("카페", List.of("카페")),
    RESTAURANT("식당", List.of("식당")),
    PET_SHOP("반려동물용품", List.of("반려동물용품")),
    GROOMING("미용", List.of("미용")),
    PET_CARE("위탁관리", List.of("위탁관리")),
    STAY("숙소", List.of("펜션", "호텔")),
    TRAVEL("여행지", List.of("여행지")),
    CULTURE("문화시설", List.of("박물관", "미술관", "문예회관"));

    private final String label;
    private final List<String> sourceNames;

    FacilityCategory(String label, List<String> sourceNames) {
        this.label = label;
        this.sourceNames = sourceNames;
    }

    public String getLabel() {
        return label;
    }

    /** 원본 '카테고리3' 값 → 분류. 모르는 값이면 빈 값 (가져오기에서 제외). */
    public static Optional<FacilityCategory> fromSourceName(String name) {
        String trimmed = name == null ? "" : name.trim();
        return Arrays.stream(values()).filter(category -> category.sourceNames.contains(trimmed)).findFirst();
    }
}
