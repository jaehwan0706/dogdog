package com.dangsanchaek.config;

import com.dangsanchaek.config.properties.PublicDataProperties;
import com.dangsanchaek.environment.service.AirKoreaProvider;
import com.dangsanchaek.environment.service.AirQualityProvider;
import com.dangsanchaek.environment.service.KmaWeatherProvider;
import com.dangsanchaek.environment.service.SampleAirQualityProvider;
import com.dangsanchaek.environment.service.SampleWeatherProvider;
import com.dangsanchaek.environment.service.WeatherProvider;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Clock;
import java.time.ZoneId;

/** 날씨·미세먼지: 공공데이터 인증키가 있으면 실제 API, 없으면 예시 데이터 */
@Slf4j
@Configuration
public class EnvironmentConfig {

    /** 날씨·추천 시간대는 한국 시각 기준 */
    public static final ZoneId SEOUL = ZoneId.of("Asia/Seoul");

    @Bean
    public Clock seoulClock() {
        return Clock.system(SEOUL);
    }

    @Bean
    public WeatherProvider weatherProvider(PublicDataProperties properties, Clock clock) {
        if (properties.hasServiceKey()) return new KmaWeatherProvider(properties.serviceKey().trim(), clock);
        log.warn("app.public-data.service-key 가 없어 예시 날씨를 사용합니다.");
        return new SampleWeatherProvider(clock);
    }

    @Bean
    public AirQualityProvider airQualityProvider(PublicDataProperties properties, Clock clock) {
        if (properties.hasServiceKey()) return new AirKoreaProvider(properties.serviceKey().trim(), clock);
        log.warn("app.public-data.service-key 가 없어 예시 미세먼지를 사용합니다.");
        return new SampleAirQualityProvider(clock);
    }
}
