package com.dangsanchaek.environment.service;

import com.dangsanchaek.environment.domain.HourlyWeather;
import com.dangsanchaek.environment.domain.PrecipitationType;
import com.dangsanchaek.environment.domain.SkyCondition;
import com.dangsanchaek.environment.domain.WeatherForecast;
import lombok.extern.slf4j.Slf4j;
import tools.jackson.databind.JsonNode;

import java.time.Clock;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

/**
 * 기상청 단기예보 조회서비스 (공공데이터포털 15084084).
 * - 단기예보(getVilageFcst): 02·05·08·11·14·17·20·23시 발표, 발표 10분 뒤부터 조회 가능. 1시간 단위 약 3일치
 * - 초단기실황(getUltraSrtNcst): 매시 정시 관측, 40분쯤부터 조회 가능
 * 같은 격자·발표시각은 캐시해서 일일 호출 제한을 아낀다.
 */
@Slf4j
public class KmaWeatherProvider implements WeatherProvider {

    private static final String BASE_URL = "https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0";
    private static final int[] FORECAST_BASE_HOURS = {2, 5, 8, 11, 14, 17, 20, 23};
    private static final Duration FORECAST_DELAY = Duration.ofMinutes(15);
    private static final Duration NOWCAST_DELAY = Duration.ofMinutes(45);
    // 단기예보는 한 시간에 12개 안팎 항목 → 약 30시간치
    private static final int FORECAST_ROWS = 400;
    private static final DateTimeFormatter DATE = DateTimeFormatter.BASIC_ISO_DATE;
    private static final DateTimeFormatter TIME = DateTimeFormatter.ofPattern("HHmm");

    private final PublicDataHttp http;
    private final Clock clock;
    private final TtlCache<String, List<HourlyWeather>> forecastCache;
    private final TtlCache<String, HourlyWeather> nowcastCache;

    public KmaWeatherProvider(String serviceKey, Clock clock) {
        this.http = new PublicDataHttp(serviceKey);
        this.clock = clock;
        this.forecastCache = new TtlCache<>(Duration.ofHours(3), clock);
        this.nowcastCache = new TtlCache<>(Duration.ofHours(1), clock);
    }

    @Override
    public boolean isSample() {
        return false;
    }

    @Override
    public WeatherForecast forecast(double latitude, double longitude) {
        KmaGrid.Point grid = KmaGrid.toGrid(latitude, longitude);
        LocalDateTime now = LocalDateTime.now(clock);

        LocalDateTime forecastBase = forecastBase(now);
        List<HourlyWeather> hourly = forecastCache.get(cacheKey(grid, forecastBase),
                () -> fetchForecast(grid, forecastBase));

        // 실황은 없어도 예보만으로 동작하므로 실패해도 넘어간다
        HourlyWeather nowcast = null;
        LocalDateTime nowcastBase = now.minus(NOWCAST_DELAY).truncatedTo(java.time.temporal.ChronoUnit.HOURS);
        try {
            nowcast = nowcastCache.get(cacheKey(grid, nowcastBase), () -> fetchNowcast(grid, nowcastBase));
        } catch (RuntimeException e) {
            log.warn("기상청 초단기실황 조회 실패 (격자 {}): {}", grid, e.getMessage());
        }
        return new WeatherForecast(nowcast, hourly);
    }

    /** 지금 조회할 수 있는 가장 최근 단기예보 발표 시각 */
    static LocalDateTime forecastBase(LocalDateTime now) {
        LocalDateTime available = now.minus(FORECAST_DELAY);
        LocalDate date = available.toLocalDate();
        int hour = available.getHour();
        for (int i = FORECAST_BASE_HOURS.length - 1; i >= 0; i--) {
            if (FORECAST_BASE_HOURS[i] <= hour) return date.atTime(FORECAST_BASE_HOURS[i], 0);
        }
        return date.minusDays(1).atTime(23, 0);
    }

    private List<HourlyWeather> fetchForecast(KmaGrid.Point grid, LocalDateTime base) {
        JsonNode body = http.get(BASE_URL + "/getVilageFcst", params(grid, base, FORECAST_ROWS));
        // 시각별로 항목(TMP, POP, SKY, PTY, WSD ...)을 모은다
        Map<LocalDateTime, Map<String, String>> byTime = new TreeMap<>();
        for (JsonNode item : body.path("items").path("item")) {
            LocalDateTime time = LocalDateTime.of(
                    LocalDate.parse(item.path("fcstDate").asString(), DATE),
                    LocalTime.parse(item.path("fcstTime").asString(), TIME));
            byTime.computeIfAbsent(time, t -> new HashMap<>())
                    .put(item.path("category").asString(), item.path("fcstValue").asString());
        }
        List<HourlyWeather> hourly = new ArrayList<>();
        byTime.forEach((time, values) -> hourly.add(new HourlyWeather(time,
                parseDouble(values.get("TMP")),
                parseInt(values.get("POP")),
                SkyCondition.fromKmaCode(parseInt(values.get("SKY"))),
                PrecipitationType.fromKmaCode(parseInt(values.get("PTY"))),
                parseDouble(values.get("WSD")))));
        return List.copyOf(hourly);
    }

    private HourlyWeather fetchNowcast(KmaGrid.Point grid, LocalDateTime base) {
        JsonNode body = http.get(BASE_URL + "/getUltraSrtNcst", params(grid, base, 20));
        Map<String, String> values = new HashMap<>();
        for (JsonNode item : body.path("items").path("item")) {
            values.put(item.path("category").asString(), item.path("obsrValue").asString());
        }
        return new HourlyWeather(base,
                parseDouble(values.get("T1H")),
                null,
                null,
                PrecipitationType.fromKmaCode(parseInt(values.get("PTY"))),
                parseDouble(values.get("WSD")));
    }

    private static Map<String, String> params(KmaGrid.Point grid, LocalDateTime base, int rows) {
        Map<String, String> params = new LinkedHashMap<>();
        params.put("pageNo", "1");
        params.put("numOfRows", String.valueOf(rows));
        params.put("dataType", "JSON");
        params.put("base_date", base.format(DATE));
        params.put("base_time", base.format(TIME));
        params.put("nx", String.valueOf(grid.nx()));
        params.put("ny", String.valueOf(grid.ny()));
        return params;
    }

    private static String cacheKey(KmaGrid.Point grid, LocalDateTime base) {
        return grid.nx() + "," + grid.ny() + "@" + base;
    }

    // 결측값은 -999 이상의 큰 음수/양수(예: -999, 900 이상)로 온다
    private static Double parseDouble(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            double parsed = Double.parseDouble(value.trim());
            return parsed <= -900 || parsed >= 900 ? null : parsed;
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private static Integer parseInt(String value) {
        Double parsed = parseDouble(value);
        return parsed == null ? null : (int) Math.round(parsed);
    }
}
