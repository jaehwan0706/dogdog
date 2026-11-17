package com.dangsanchaek.environment.domain;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;

/**
 * 가까운 측정소의 실시간 미세먼지와 지역 예보 등급.
 *
 * @param stationName 측정소 이름
 * @param pm10        PM10 (㎍/㎥), 측정 안 됨이면 null
 * @param pm25        PM2.5 (㎍/㎥), 측정 안 됨이면 null
 * @param measuredAt  측정 시각
 * @param forecast    날짜별 예보 등급 (PM10·PM2.5 중 나쁜 쪽)
 */
public record AirQuality(
        String stationName,
        Integer pm10,
        Integer pm25,
        LocalDateTime measuredAt,
        Map<LocalDate, AirGrade> forecast
) {

    /** 실측값이 몇 시간 뒤까지 유효하다고 볼지. 그 뒤는 예보 등급을 쓴다 */
    private static final Duration MEASURED_VALID_FOR = Duration.ofHours(6);

    public AirGrade grade() {
        return AirGrade.worse(AirGrade.ofPm10(pm10), AirGrade.ofPm25(pm25));
    }

    /** time 시각의 등급: 가까운 시간은 실측, 그 뒤는 그 날의 예보 (없으면 실측) */
    public AirGrade gradeAt(LocalDateTime time, LocalDateTime now) {
        AirGrade measured = grade();
        if (measured != null && time.isBefore(now.plus(MEASURED_VALID_FOR))) return measured;
        AirGrade forecasted = forecast == null ? null : forecast.get(time.toLocalDate());
        return forecasted != null ? forecasted : measured;
    }
}
