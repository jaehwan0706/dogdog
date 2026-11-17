package com.dangsanchaek.environment.domain;

import java.time.LocalDateTime;

/**
 * 한 시간 단위 날씨 (한국 시각). 원본에 없는 값은 null.
 *
 * @param time                     해당 시간의 시작 시각 (정시)
 * @param temperature              기온 (℃)
 * @param precipitationProbability 강수확률 (%), 실황에는 없음
 * @param sky                      하늘상태, 실황에는 없음
 * @param precipitation            강수형태
 * @param windSpeed                풍속 (m/s)
 */
public record HourlyWeather(
        LocalDateTime time,
        Double temperature,
        Integer precipitationProbability,
        SkyCondition sky,
        PrecipitationType precipitation,
        Double windSpeed
) {

    /** 실황(now)에 비어 있는 하늘상태·강수확률을 예보(forecast)로 채운다 */
    public HourlyWeather fillFrom(HourlyWeather forecast) {
        if (forecast == null) return this;
        return new HourlyWeather(time,
                temperature != null ? temperature : forecast.temperature,
                precipitationProbability != null ? precipitationProbability : forecast.precipitationProbability,
                sky != null ? sky : forecast.sky,
                precipitation != null ? precipitation : forecast.precipitation,
                windSpeed != null ? windSpeed : forecast.windSpeed);
    }

    /** 화면 표시용 한 단어: 비·눈이 오면 강수형태, 아니면 하늘상태 */
    public String conditionLabel() {
        if (precipitation != null && precipitation.isFalling()) return precipitation.getLabel();
        return sky == null ? null : sky.getLabel();
    }
}
