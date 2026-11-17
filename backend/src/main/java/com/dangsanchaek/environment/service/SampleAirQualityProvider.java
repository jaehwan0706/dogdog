package com.dangsanchaek.environment.service;

import com.dangsanchaek.environment.domain.AirQuality;

import java.time.Clock;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Map;

/** 공공데이터 인증키가 없을 때 쓰는 예시 미세먼지 (로컬 개발·테스트용): 항상 '좋음' */
public class SampleAirQualityProvider implements AirQualityProvider {

    private final Clock clock;

    public SampleAirQualityProvider(Clock clock) {
        this.clock = clock;
    }

    @Override
    public boolean isSample() {
        return true;
    }

    @Override
    public AirQuality airQuality(double latitude, double longitude) {
        LocalDateTime measuredAt = LocalDateTime.now(clock).truncatedTo(ChronoUnit.HOURS);
        return new AirQuality("예시 측정소", 25, 12, measuredAt, Map.of());
    }
}
