package com.dangsanchaek.environment.service;

import com.dangsanchaek.environment.domain.WeatherForecast;

/** 위치의 현재 날씨와 시간별 예보. 실패하면 RuntimeException */
public interface WeatherProvider {

    WeatherForecast forecast(double latitude, double longitude);

    /** 실제 API 가 아닌 예시 데이터인지 (공공데이터 인증키가 없을 때) */
    boolean isSample();
}
