package com.dangsanchaek.environment.domain;

import java.time.LocalDateTime;
import java.util.List;

/**
 * @param now    초단기실황 (지금 관측값). 못 받으면 null
 * @param hourly 단기예보 (시간 순)
 */
public record WeatherForecast(HourlyWeather now, List<HourlyWeather> hourly) {

    public HourlyWeather at(LocalDateTime hour) {
        return hourly.stream().filter(w -> w.time().equals(hour)).findFirst().orElse(null);
    }
}
