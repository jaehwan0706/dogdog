package com.dangsanchaek.course.service.route;

import java.util.List;
import java.util.Optional;

/** 두 지점 사이의 걷는 길 (인도·횡단보도·공원 길). 경로를 못 구하면 빈 값 */
public interface WalkingRouter {

    Optional<WalkingRoute> route(double fromLat, double fromLng, double toLat, double toLng);

    /** 실제 경로 API 를 쓰는지 (키가 없으면 false: 항상 빈 값) */
    boolean isEnabled();

    /**
     * @param distanceMeters 편도 거리
     * @param path           [위도, 경도] 좌표 (출발 → 도착)
     */
    record WalkingRoute(int distanceMeters, List<double[]> path) {
    }

    /** 경로 API 키가 없을 때 */
    WalkingRouter NONE = new WalkingRouter() {
        @Override
        public Optional<WalkingRoute> route(double fromLat, double fromLng, double toLat, double toLng) {
            return Optional.empty();
        }

        @Override
        public boolean isEnabled() {
            return false;
        }
    };
}
