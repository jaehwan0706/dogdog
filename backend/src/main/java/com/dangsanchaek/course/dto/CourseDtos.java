package com.dangsanchaek.course.dto;

import com.dangsanchaek.facility.domain.FacilityCategory;

import java.util.List;

public final class CourseDtos {

    private CourseDtos() {
    }

    public enum CourseType {
        /** 공원까지 다녀오기 (공공데이터 도시공원) */
        PARK,
        /** 내가 전에 걸었던 경로 */
        MY_ROUTE
    }

    /**
     * 맞춤 산책 코스.
     *
     * @param targetMinutes       목표 산책 시간 (요청 minutes, 없으면 평소 산책 시간)
     * @param targetMeters        목표 거리 = 목표 시간 × 걷는 속도
     * @param paceMetersPerMinute 내 평소 걷는 속도 (기록이 3회 미만이면 분당 50m)
     * @param courses             점수 높은 순 (공원 최대 3개 + 내 경로 최대 2개)
     */
    public record CourseRecommendationResponse(
            int targetMinutes,
            int targetMeters,
            int paceMetersPerMinute,
            List<CourseResponse> courses
    ) {
    }

    /**
     * @param id               목록 안에서 구분하는 값 ("park-12", "walk-34")
     * @param latitude         목적지 (공원 위치 / 내 경로에서 출발점과 가장 먼 지점)
     * @param distanceMeters   왕복 예상 거리 (공원: TMAP 걷는 길 × 2, 경로를 못 받으면 직선거리 × 1.3 왕복 + 공원 안 걷기 / 내 경로: 실제 기록)
     * @param estimatedMinutes 내 걷는 속도로 계산한 예상 시간
     * @param reasons          추천 이유 (최대 3개)
     * @param path             내 경로: 걸었던 좌표 / 공원: 지금 위치에서 공원까지 걷는 길(편도, TMAP), 못 받으면 빈 목록. 최대 약 150개
     */
    public record CourseResponse(
            String id,
            CourseType type,
            String title,
            String subtitle,
            double latitude,
            double longitude,
            int distanceMeters,
            int estimatedMinutes,
            int score,
            List<String> reasons,
            Long parkId,
            Long walkId,
            String address,
            Double areaSquareMeters,
            String convenience,
            List<NearbyFacilityResponse> nearbyFacilities,
            List<LatLngResponse> path
    ) {
    }

    /** 공원 주변(300m) 반려동물 동반 시설. 가까운 순 최대 3개 */
    public record NearbyFacilityResponse(Long id, String name, FacilityCategory category, String categoryLabel,
                                         int distanceMeters) {
    }

    public record LatLngResponse(double latitude, double longitude) {
    }
}
