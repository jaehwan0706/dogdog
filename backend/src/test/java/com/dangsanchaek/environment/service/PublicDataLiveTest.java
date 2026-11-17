package com.dangsanchaek.environment.service;

import com.dangsanchaek.environment.domain.AirQuality;
import com.dangsanchaek.environment.domain.HourlyWeather;
import com.dangsanchaek.environment.domain.WeatherForecast;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;

import java.time.Clock;
import java.time.ZoneId;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * 실제 공공데이터 API 확인용. 환경변수 PUBLIC_DATA_SERVICE_KEY 가 있을 때만 실행된다 (평소 테스트·CI 에서는 건너뜀).
 * 실행: PUBLIC_DATA_SERVICE_KEY=... ./gradlew test --tests '*PublicDataLiveTest' -i
 */
@EnabledIfEnvironmentVariable(named = "PUBLIC_DATA_SERVICE_KEY", matches = ".+")
class PublicDataLiveTest {

    private static final String KEY = System.getenv("PUBLIC_DATA_SERVICE_KEY");
    private static final Clock CLOCK = Clock.system(ZoneId.of("Asia/Seoul"));

    @Test
    void 기상청_단기예보와_실황() {
        WeatherForecast forecast = new KmaWeatherProvider(KEY, CLOCK).forecast(37.5665, 126.9780);
        System.out.println("[live] 실황 " + forecast.now());
        forecast.hourly().stream().limit(3).forEach(w -> System.out.println("[live] 예보 " + w));
        assertThat(forecast.hourly()).hasSizeGreaterThanOrEqualTo(24);
        HourlyWeather first = forecast.hourly().get(0);
        assertThat(first.temperature()).isNotNull();
        assertThat(first.sky()).isNotNull();
        assertThat(first.precipitation()).isNotNull();
        assertThat(forecast.now()).isNotNull();
        assertThat(forecast.now().temperature()).isNotNull();
    }

    @Test
    void 에어코리아_가까운_측정소와_예보() {
        AirKoreaProvider provider = new AirKoreaProvider(KEY, CLOCK);
        // 서울시청, 천안
        for (double[] p : new double[][]{{37.5665, 126.9780}, {36.8151, 127.1139}}) {
            AirQuality air = provider.airQuality(p[0], p[1]);
            System.out.println("[live] 미세먼지 " + air + " 등급 " + air.grade());
            assertThat(air.stationName()).isNotBlank();
            assertThat(air.grade()).isNotNull();
            assertThat(air.forecast()).isNotEmpty();
        }
    }
}
