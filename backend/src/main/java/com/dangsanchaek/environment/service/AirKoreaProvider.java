package com.dangsanchaek.environment.service;

import com.dangsanchaek.environment.domain.AirGrade;
import com.dangsanchaek.environment.domain.AirQuality;
import lombok.extern.slf4j.Slf4j;
import tools.jackson.databind.JsonNode;

import java.time.Clock;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * 한국환경공단 에어코리아 (공공데이터포털).
 * - 측정소정보(getMsrstnList): 전국 측정소 위치. 하루 한 번 받아 두고 가장 가까운 측정소를 고른다
 * - 대기오염정보(getMsrstnAcctoRltmMesureDnsty): 측정소별 실시간 PM10·PM2.5 (1시간 단위)
 * - 대기오염정보(getMinuDustFrcstDspth): 미세먼지 예보 (지역별 오늘·내일 등급)
 */
@Slf4j
public class AirKoreaProvider implements AirQualityProvider {

    private static final String STATION_URL = "https://apis.data.go.kr/B552584/MsrstnInfoInqireSvc/getMsrstnList";
    private static final String AIR_URL = "https://apis.data.go.kr/B552584/ArpltnInforInqireSvc";
    /** 가장 가까운 측정소가 점검 중이면 그다음 측정소 값을 쓴다 */
    private static final int STATION_CANDIDATES = 3;
    /** 실시간 측정은 최근 몇 시간치를 받아 값이 있는 가장 최근 시각을 쓴다 */
    private static final int RECENT_MEASUREMENTS = 4;
    private static final DateTimeFormatter MEASURED_AT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    // 예보 지역 중 경기·강원은 남북/영서영동으로 나뉜다 (에어코리아 예보 권역)
    private static final Set<String> GYEONGGI_NORTH = Set.of("고양시", "구리시", "남양주시", "동두천시", "양주시",
            "의정부시", "파주시", "포천시", "가평군", "연천군");
    private static final Set<String> GANGWON_EAST = Set.of("강릉시", "동해시", "속초시", "삼척시", "태백시", "고성군", "양양군");

    record Station(String name, String address, double latitude, double longitude) {
    }

    private final PublicDataHttp http;
    private final Clock clock;
    private final TtlCache<String, List<Station>> stationCache;
    private final TtlCache<String, AirQuality> measureCache;
    private final TtlCache<LocalDate, Map<LocalDate, Map<String, AirGrade>>> forecastCache;

    public AirKoreaProvider(String serviceKey, Clock clock) {
        this.http = new PublicDataHttp(serviceKey);
        this.clock = clock;
        this.stationCache = new TtlCache<>(Duration.ofDays(1), clock);
        this.measureCache = new TtlCache<>(Duration.ofMinutes(20), clock);
        this.forecastCache = new TtlCache<>(Duration.ofHours(1), clock);
    }

    @Override
    public boolean isSample() {
        return false;
    }

    @Override
    public AirQuality airQuality(double latitude, double longitude) {
        List<Station> nearest = stationCache.get("all", this::fetchStations).stream()
                .sorted(Comparator.comparingDouble(s -> squaredDistance(s, latitude, longitude)))
                .limit(STATION_CANDIDATES)
                .toList();
        if (nearest.isEmpty()) throw new PublicDataHttp.PublicDataException("측정소 목록이 비어 있음");

        Map<LocalDate, AirGrade> forecast = forecastFor(nearest.get(0));
        for (Station station : nearest) {
            AirQuality measured = measureCache.get(station.name(), () -> fetchMeasurement(station));
            if (measured.pm10() != null || measured.pm25() != null) {
                return new AirQuality(measured.stationName(), measured.pm10(), measured.pm25(), measured.measuredAt(), forecast);
            }
        }
        // 가까운 측정소가 모두 점검 중이면 예보 등급만
        return new AirQuality(nearest.get(0).name(), null, null, null, forecast);
    }

    private List<Station> fetchStations() {
        List<Station> stations = new ArrayList<>();
        for (int page = 1; page <= 5; page++) {
            Map<String, String> params = new LinkedHashMap<>();
            params.put("returnType", "json");
            params.put("numOfRows", "1000");
            params.put("pageNo", String.valueOf(page));
            JsonNode body = http.get(STATION_URL, params);
            for (JsonNode item : body.path("items")) {
                Double a = parseDouble(item.path("dmX").asString(""));
                Double b = parseDouble(item.path("dmY").asString(""));
                if (a == null || b == null) continue;
                // dmX·dmY 중 위도(33~39)인 쪽을 위도로 본다
                double lat = a < 60 ? a : b;
                double lng = a < 60 ? b : a;
                stations.add(new Station(item.path("stationName").asString(""), item.path("addr").asString(""), lat, lng));
            }
            if (stations.size() >= body.path("totalCount").asInt(0)) break;
        }
        log.info("에어코리아 측정소 {}곳을 불러왔습니다.", stations.size());
        return List.copyOf(stations);
    }

    private AirQuality fetchMeasurement(Station station) {
        Map<String, String> params = new LinkedHashMap<>();
        params.put("returnType", "json");
        params.put("numOfRows", String.valueOf(RECENT_MEASUREMENTS));
        params.put("pageNo", "1");
        params.put("stationName", station.name());
        params.put("dataTerm", "DAILY");
        params.put("ver", "1.3");
        // 최신순. 가장 최근 시각은 아직 집계 전이라 "-" 인 경우가 많아 값이 있는 첫 행을 쓴다
        for (JsonNode item : http.get(AIR_URL + "/getMsrstnAcctoRltmMesureDnsty", params).path("items")) {
            Integer pm10 = parseInt(item.path("pm10Value").asString(""));
            Integer pm25 = parseInt(item.path("pm25Value").asString(""));
            if (pm10 != null || pm25 != null) {
                return new AirQuality(station.name(), pm10, pm25, parseMeasuredAt(item.path("dataTime").asString("")), Map.of());
            }
        }
        return new AirQuality(station.name(), null, null, null, Map.of());
    }

    /** 측정소 주소로 예보 지역을 정해 날짜별 등급을 고른다. 실패하면 빈 값 */
    private Map<LocalDate, AirGrade> forecastFor(Station station) {
        String region = forecastRegion(station.address());
        if (region == null) return Map.of();
        try {
            LocalDate today = LocalDate.now(clock);
            Map<LocalDate, Map<String, AirGrade>> all = forecastCache.get(today, () -> fetchForecast(today));
            Map<LocalDate, AirGrade> result = new HashMap<>();
            all.forEach((date, grades) -> {
                AirGrade grade = grades.get(region);
                if (grade != null) result.put(date, grade);
            });
            return result;
        } catch (RuntimeException e) {
            log.warn("에어코리아 미세먼지 예보 조회 실패: {}", e.getMessage());
            return Map.of();
        }
    }

    /** 날짜 → (지역 → PM10·PM2.5 중 나쁜 등급). 새벽에 오늘 발표분이 아직 없으면 어제 발표분을 쓴다 */
    private Map<LocalDate, Map<String, AirGrade>> fetchForecast(LocalDate today) {
        Map<LocalDate, Map<String, AirGrade>> merged = new HashMap<>();
        for (String code : List.of("PM10", "PM25")) {
            List<JsonNode> items = forecastItems(today, code);
            if (items.isEmpty()) items = forecastItems(today.minusDays(1), code);
            // 같은 날짜에 대한 예보가 여러 번 발표되면 가장 최근 발표(dataTime 이 큰 것)를 쓴다
            Map<LocalDate, JsonNode> latestByDate = new HashMap<>();
            for (JsonNode item : items) {
                LocalDate date = parseDate(item.path("informData").asString(""));
                if (date == null) continue;
                JsonNode previous = latestByDate.get(date);
                if (previous == null || item.path("dataTime").asString("")
                        .compareTo(previous.path("dataTime").asString("")) > 0) {
                    latestByDate.put(date, item);
                }
            }
            latestByDate.forEach((date, item) -> parseGrades(item.path("informGrade").asString(""))
                    .forEach((region, grade) -> merged.computeIfAbsent(date, d -> new HashMap<>())
                            .merge(region, grade, AirGrade::worse)));
        }
        return merged;
    }

    private List<JsonNode> forecastItems(LocalDate searchDate, String informCode) {
        Map<String, String> params = new LinkedHashMap<>();
        params.put("returnType", "json");
        params.put("numOfRows", "100");
        params.put("pageNo", "1");
        params.put("searchDate", searchDate.toString());
        params.put("InformCode", informCode);
        List<JsonNode> items = new ArrayList<>();
        try {
            http.get(AIR_URL + "/getMinuDustFrcstDspth", params).path("items").forEach(items::add);
        } catch (PublicDataHttp.PublicDataException e) {
            // 발표 전이면 '데이터 없음' 코드가 온다
            log.debug("미세먼지 예보 없음 ({} {}): {}", searchDate, informCode, e.getMessage());
        }
        return items;
    }

    /** "서울 : 보통,제주 : 좋음,..." → {서울=MODERATE, 제주=GOOD} */
    static Map<String, AirGrade> parseGrades(String informGrade) {
        Map<String, AirGrade> grades = new HashMap<>();
        for (String part : informGrade.split(",")) {
            String[] pair = part.split(":");
            if (pair.length != 2) continue;
            AirGrade grade = AirGrade.fromLabel(pair[1].trim());
            if (grade != null) grades.put(pair[0].trim(), grade);
        }
        return grades;
    }

    /** 측정소 주소(예: "서울 중구 덕수궁길 15", "경기도 고양시 ...") → 예보 지역 이름 */
    static String forecastRegion(String address) {
        if (address == null || address.isBlank()) return null;
        String[] words = address.trim().split("\\s+");
        String first = words[0];
        String second = words.length > 1 ? words[1] : "";
        if (first.startsWith("서울")) return "서울";
        if (first.startsWith("부산")) return "부산";
        if (first.startsWith("대구")) return "대구";
        if (first.startsWith("인천")) return "인천";
        if (first.startsWith("광주")) return "광주";
        if (first.startsWith("대전")) return "대전";
        if (first.startsWith("울산")) return "울산";
        if (first.startsWith("세종")) return "세종";
        if (first.startsWith("경기")) return GYEONGGI_NORTH.contains(second) ? "경기북부" : "경기남부";
        if (first.startsWith("강원")) return GANGWON_EAST.contains(second) ? "강원영동" : "강원영서";
        if (first.startsWith("충청북") || first.startsWith("충북")) return "충북";
        if (first.startsWith("충청남") || first.startsWith("충남")) return "충남";
        if (first.startsWith("전라북") || first.startsWith("전북")) return "전북";
        if (first.startsWith("전라남") || first.startsWith("전남")) return "전남";
        if (first.startsWith("경상북") || first.startsWith("경북")) return "경북";
        if (first.startsWith("경상남") || first.startsWith("경남")) return "경남";
        if (first.startsWith("제주")) return "제주";
        return null;
    }

    private static double squaredDistance(Station station, double latitude, double longitude) {
        double dLat = station.latitude() - latitude;
        double dLng = (station.longitude() - longitude) * Math.cos(Math.toRadians(latitude));
        return dLat * dLat + dLng * dLng;
    }

    /** "2026-11-17 14:00", 자정은 "2026-11-17 24:00" 으로 온다 */
    private static LocalDateTime parseMeasuredAt(String value) {
        try {
            if (value.endsWith("24:00")) {
                return LocalDate.parse(value.substring(0, 10)).plusDays(1).atStartOfDay();
            }
            return LocalDateTime.parse(value, MEASURED_AT);
        } catch (RuntimeException e) {
            return null;
        }
    }

    private static LocalDate parseDate(String value) {
        try {
            return LocalDate.parse(value.trim());
        } catch (RuntimeException e) {
            return null;
        }
    }

    // 점검·통신장애 때는 "-" 나 빈 값이 온다
    private static Double parseDouble(String value) {
        if (value == null || value.isBlank() || "-".equals(value.trim())) return null;
        try {
            return Double.parseDouble(value.trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private static Integer parseInt(String value) {
        Double parsed = parseDouble(value);
        return parsed == null || parsed < 0 ? null : (int) Math.round(parsed);
    }
}
