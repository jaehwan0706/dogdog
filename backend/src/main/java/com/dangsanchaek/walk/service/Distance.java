package com.dangsanchaek.walk.service;

import com.dangsanchaek.walk.domain.WalkPoint;

import java.util.List;

/** 위경도 좌표 사이 거리 (하버사인 공식, 지구를 구로 근사). 산책 거리 정도에서는 오차가 무시할 만하다. */
final class Distance {

    private static final double EARTH_RADIUS_METERS = 6_371_000;

    private Distance() {
    }

    static double meters(double lat1, double lng1, double lat2, double lng2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(a)));
    }

    /** seq 순으로 정렬된 경로의 총 길이 */
    static double routeMeters(List<WalkPoint> route) {
        double total = 0;
        for (int i = 1; i < route.size(); i++) {
            WalkPoint a = route.get(i - 1);
            WalkPoint b = route.get(i);
            total += meters(a.getLatitude(), a.getLongitude(), b.getLatitude(), b.getLongitude());
        }
        return total;
    }
}
