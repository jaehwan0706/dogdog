package com.dangsanchaek.environment.service;

import com.dangsanchaek.environment.domain.AirQuality;

/** 위치에서 가까운 측정소의 미세먼지와 예보 등급. 실패하면 RuntimeException */
public interface AirQualityProvider {

    AirQuality airQuality(double latitude, double longitude);

    /** 실제 API 가 아닌 예시 데이터인지 (공공데이터 인증키가 없을 때) */
    boolean isSample();
}
