package com.dangsanchaek.environment.service;

import com.dangsanchaek.environment.domain.AirGrade;
import com.dangsanchaek.environment.domain.AirQuality;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class EnvironmentParsingTest {

    @Test
    void 위경도를_기상청_격자로_변환() {
        // 활용가이드 예시: 서울 종로구(60, 127), 부산 중구(97, 74), 제주시(53, 38)
        assertThat(KmaGrid.toGrid(37.5729, 126.9794)).isEqualTo(new KmaGrid.Point(60, 127));
        assertThat(KmaGrid.toGrid(35.1063, 129.0323)).isEqualTo(new KmaGrid.Point(97, 74));
        assertThat(KmaGrid.toGrid(33.4996, 126.5312)).isEqualTo(new KmaGrid.Point(53, 38));
        assertThat(KmaGrid.covers(37.5, 127.0)).isTrue();
        assertThat(KmaGrid.covers(37.4, -122.1)).isFalse();
    }

    @Test
    void 단기예보_발표시각() {
        LocalDateTime day = LocalDateTime.of(2026, 11, 17, 0, 0);
        // 발표 15분 뒤부터 조회
        assertThat(KmaWeatherProvider.forecastBase(day.withHour(14).withMinute(14))).isEqualTo(day.withHour(11));
        assertThat(KmaWeatherProvider.forecastBase(day.withHour(14).withMinute(15))).isEqualTo(day.withHour(14));
        assertThat(KmaWeatherProvider.forecastBase(day.withHour(23).withMinute(59))).isEqualTo(day.withHour(23));
        // 자정 ~ 02:15 는 전날 23시 발표
        assertThat(KmaWeatherProvider.forecastBase(day.withHour(1))).isEqualTo(day.minusDays(1).withHour(23));
    }

    @Test
    void 미세먼지_예보_문구와_지역() {
        assertThat(AirKoreaProvider.parseGrades("서울 : 보통,제주 : 좋음,경기북부 : 나쁨,강원영동 : 매우나쁨"))
                .containsEntry("서울", AirGrade.MODERATE)
                .containsEntry("제주", AirGrade.GOOD)
                .containsEntry("경기북부", AirGrade.BAD)
                .containsEntry("강원영동", AirGrade.VERY_BAD);

        assertThat(AirKoreaProvider.forecastRegion("서울 중구 덕수궁길 15")).isEqualTo("서울");
        assertThat(AirKoreaProvider.forecastRegion("경기 고양시 일산동구 ...")).isEqualTo("경기북부");
        assertThat(AirKoreaProvider.forecastRegion("경기도 수원시 장안구 ...")).isEqualTo("경기남부");
        assertThat(AirKoreaProvider.forecastRegion("강원특별자치도 강릉시 ...")).isEqualTo("강원영동");
        assertThat(AirKoreaProvider.forecastRegion("충청남도 천안시 동남구 ...")).isEqualTo("충남");
        assertThat(AirKoreaProvider.forecastRegion("전북특별자치도 전주시 ...")).isEqualTo("전북");
    }

    @Test
    void 미세먼지_등급은_PM10_PM25_중_나쁜_쪽_가까운_시간은_실측_먼_시간은_예보() {
        LocalDateTime now = LocalDateTime.of(2026, 11, 17, 10, 0);
        LocalDate tomorrow = now.toLocalDate().plusDays(1);
        AirQuality air = new AirQuality("중구", 25, 40, now, Map.of(tomorrow, AirGrade.GOOD));

        assertThat(air.grade()).isEqualTo(AirGrade.BAD);
        assertThat(air.gradeAt(now.plusHours(2), now)).isEqualTo(AirGrade.BAD);
        assertThat(air.gradeAt(tomorrow.atTime(8, 0), now)).isEqualTo(AirGrade.GOOD);
        // 예보가 없는 날(오늘 저녁)은 실측값
        assertThat(air.gradeAt(now.plusHours(8), now)).isEqualTo(AirGrade.BAD);
    }
}
