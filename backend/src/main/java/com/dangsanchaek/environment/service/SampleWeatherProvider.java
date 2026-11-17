package com.dangsanchaek.environment.service;

import com.dangsanchaek.environment.domain.HourlyWeather;
import com.dangsanchaek.environment.domain.PrecipitationType;
import com.dangsanchaek.environment.domain.SkyCondition;
import com.dangsanchaek.environment.domain.WeatherForecast;

import java.time.Clock;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

/**
 * 공공데이터 인증키가 없을 때 쓰는 예시 날씨 (로컬 개발·테스트용).
 * 달마다의 평년 기온 근처에서 오후 3시가 가장 따뜻한 하루 곡선을 만든다. 비는 오지 않는다.
 */
public class SampleWeatherProvider implements WeatherProvider {

    // 1월 ~ 12월 서울 평균 기온 (대략)
    private static final double[] MONTHLY_MEAN = {-2, 1, 6, 13, 18, 23, 25, 26, 22, 15, 7, 0};
    private static final double DAILY_AMPLITUDE = 5;

    private final Clock clock;

    public SampleWeatherProvider(Clock clock) {
        this.clock = clock;
    }

    @Override
    public boolean isSample() {
        return true;
    }

    @Override
    public WeatherForecast forecast(double latitude, double longitude) {
        LocalDateTime hour = LocalDateTime.now(clock).truncatedTo(ChronoUnit.HOURS);
        List<HourlyWeather> hourly = new ArrayList<>();
        for (int i = 0; i < 30; i++) {
            hourly.add(at(hour.plusHours(i)));
        }
        return new WeatherForecast(at(hour), hourly);
    }

    private static HourlyWeather at(LocalDateTime time) {
        double mean = MONTHLY_MEAN[time.getMonthValue() - 1];
        double temperature = mean + DAILY_AMPLITUDE * Math.cos((time.getHour() - 15) / 24.0 * 2 * Math.PI);
        SkyCondition sky = time.getHour() >= 12 && time.getHour() < 18 ? SkyCondition.CLOUDY : SkyCondition.CLEAR;
        return new HourlyWeather(time, Math.round(temperature * 10) / 10.0, 10, sky, PrecipitationType.NONE, 2.0);
    }
}
