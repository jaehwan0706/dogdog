package com.dangsanchaek.course.service.route;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;
import tools.jackson.databind.JsonNode;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * TMAP 보행자 경로안내 (SK open API). 응답은 GeoJSON: 첫 Feature 의 totalDistance(m),
 * LineString Feature 들의 좌표([경도, 위도])를 이으면 전체 경로.
 * 같은 출발(약 10m 단위로 반올림)·도착은 하루 동안 캐시해 무료 호출 한도를 아낀다.
 */
@Slf4j
public class TmapWalkingRouter implements WalkingRouter {

    private static final String URL = "https://apis.openapi.sk.com/tmap/routes/pedestrian?version=1";
    private static final Duration CACHE_TTL = Duration.ofDays(1);
    private static final int MAX_CACHE = 5_000;

    private record CacheEntry(Optional<WalkingRoute> route, Instant expiresAt) {
    }

    private final RestClient client;
    private final String appKey;
    private final Clock clock;
    private final Map<String, CacheEntry> cache = new ConcurrentHashMap<>();

    public TmapWalkingRouter(String appKey, Clock clock) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(3));
        factory.setReadTimeout(Duration.ofSeconds(5));
        this.client = RestClient.builder().requestFactory(factory).build();
        this.appKey = appKey;
        this.clock = clock;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }

    @Override
    public Optional<WalkingRoute> route(double fromLat, double fromLng, double toLat, double toLng) {
        double lat = round4(fromLat);
        double lng = round4(fromLng);
        String key = lat + "," + lng + ">" + toLat + "," + toLng;
        Instant now = clock.instant();
        CacheEntry cached = cache.get(key);
        if (cached != null && cached.expiresAt().isAfter(now)) return cached.route();

        Optional<WalkingRoute> route;
        try {
            route = fetch(lat, lng, toLat, toLng);
        } catch (RuntimeException e) {
            // 실패는 캐시하지 않는다 (다음 요청에서 다시 시도)
            log.warn("TMAP 보행자 경로 조회 실패: {}", e.toString());
            return Optional.empty();
        }
        if (cache.size() >= MAX_CACHE) cache.clear();
        cache.put(key, new CacheEntry(route, now.plus(CACHE_TTL)));
        return route;
    }

    private Optional<WalkingRoute> fetch(double fromLat, double fromLng, double toLat, double toLng) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("startX", fromLng);
        body.put("startY", fromLat);
        body.put("endX", toLng);
        body.put("endY", toLat);
        body.put("reqCoordType", "WGS84GEO");
        body.put("resCoordType", "WGS84GEO");
        // 이름은 필수이고 URL 인코딩해서 보내야 한다
        body.put("startName", URLEncoder.encode("출발", StandardCharsets.UTF_8));
        body.put("endName", URLEncoder.encode("도착", StandardCharsets.UTF_8));

        JsonNode root = client.post().uri(URL)
                .header("appKey", appKey)
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .body(JsonNode.class);
        JsonNode features = root == null ? null : root.path("features");
        if (features == null || features.isEmpty()) return Optional.empty();

        int distance = features.get(0).path("properties").path("totalDistance").asInt(0);
        List<double[]> path = new ArrayList<>();
        for (JsonNode feature : features) {
            JsonNode geometry = feature.path("geometry");
            if (!"LineString".equals(geometry.path("type").asString(""))) continue;
            for (JsonNode coordinate : geometry.path("coordinates")) {
                double[] point = {coordinate.get(1).asDouble(), coordinate.get(0).asDouble()};
                // 이어지는 선의 첫 좌표는 앞 선의 끝 좌표와 같다
                if (!path.isEmpty() && samePoint(path.getLast(), point)) continue;
                path.add(point);
            }
        }
        if (distance <= 0 || path.size() < 2) return Optional.empty();
        return Optional.of(new WalkingRoute(distance, List.copyOf(path)));
    }

    private static boolean samePoint(double[] a, double[] b) {
        return Math.abs(a[0] - b[0]) < 1e-7 && Math.abs(a[1] - b[1]) < 1e-7;
    }

    private static double round4(double value) {
        return Math.round(value * 10_000) / 10_000.0;
    }
}
