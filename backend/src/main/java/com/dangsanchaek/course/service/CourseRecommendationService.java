package com.dangsanchaek.course.service;

import com.dangsanchaek.common.exception.BusinessException;
import com.dangsanchaek.common.exception.ErrorCode;
import com.dangsanchaek.course.domain.Park;
import com.dangsanchaek.course.dto.CourseDtos.CourseRecommendationResponse;
import com.dangsanchaek.course.dto.CourseDtos.CourseResponse;
import com.dangsanchaek.course.dto.CourseDtos.CourseType;
import com.dangsanchaek.course.dto.CourseDtos.LatLngResponse;
import com.dangsanchaek.course.dto.CourseDtos.NearbyFacilityResponse;
import com.dangsanchaek.course.repository.ParkRepository;
import com.dangsanchaek.facility.domain.Facility;
import com.dangsanchaek.facility.domain.FacilityCategory;
import com.dangsanchaek.facility.repository.FacilityRepository;
import com.dangsanchaek.walk.domain.Walk;
import com.dangsanchaek.walk.domain.WalkPoint;
import com.dangsanchaek.walk.domain.WalkStatus;
import com.dangsanchaek.walk.repository.WalkPointRepository;
import com.dangsanchaek.walk.repository.WalkRepository;
import com.dangsanchaek.walk.service.Distance;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 맞춤 산책 코스: 목표 시간(날씨를 반영한 권장 시간 또는 평소 산책 시간)과 내 걷는 속도로 목표 거리를 정하고,
 * 그 거리에 맞는 주변 공원(공공데이터)과 내가 전에 걸었던 경로를 점수 매겨 추천한다.
 * <p>
 * 점수(0~100) = 기본 30 + 거리 맞음(최대 45) + 공원 크기(최대 12) + 공원 종류 + 화장실·음수대 + 주변 반려동물 시설
 * + 개인화(최근 다녀온 곳이면 익숙함, 아직 안 가본 곳이면 새로움).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CourseRecommendationService {

    /** 실제 걷는 길은 직선거리보다 길다 (골목·횡단보도) */
    static final double DETOUR_FACTOR = 1.3;
    static final double DEFAULT_PACE = 50;
    static final int MAX_PARKS = 3;
    static final int MAX_ROUTES = 2;
    static final int PARK_CANDIDATES = 200;
    static final double FACILITY_NEAR_METERS = 300;
    /** 출발점이 지금 위치에서 이 거리 안인 경로만 '내 경로' 후보 */
    static final double MY_ROUTE_START_METERS = 500;
    /** 같은 길로 볼 출발점·반환점 거리 */
    static final double SAME_ROUTE_METERS = 200;
    /** 고른 공원끼리 이보다 가까우면 하나만 */
    static final double MIN_PARK_GAP_METERS = 250;
    /** 목표 거리 안에 공원이 없을 때 넓혀 찾는 반경 */
    static final double FALLBACK_RADIUS_METERS = 3000;
    static final int RECENT_WALKS = 30;
    static final int PATH_MAX_POINTS = 150;
    private static final double METERS_PER_DEGREE = 111_320;

    private final ParkRepository parkRepository;
    private final FacilityRepository facilityRepository;
    private final WalkRepository walkRepository;
    private final WalkPointRepository walkPointRepository;
    private final Clock clock;

    private record Factor(String text, double impact) {
    }

    private record Scored(CourseResponse course, double score) {
    }

    /** minutes: 목표 산책 시간 (앱은 추천 시간대의 권장 시간을 넘긴다). 없으면 평소 산책 시간 */
    public CourseRecommendationResponse recommend(Long userId, double latitude, double longitude, Integer minutes) {
        if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180
                || (minutes != null && (minutes < 5 || minutes > 180))) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }
        LocalDateTime now = LocalDateTime.now(clock);
        // 최신순
        List<Walk> walks = walkRepository.findAllInRange(userId, WalkStatus.FINISHED,
                now.minusDays(WalkHabit.LOOKBACK_DAYS), now.plusDays(1));
        WalkHabit habit = WalkHabit.from(walks, now);
        int targetMinutes = minutes != null ? minutes : habit.usualMinutes();
        double pace = pace(walks);
        double targetMeters = targetMinutes * pace;

        List<Walk> recent = walks.stream().limit(RECENT_WALKS).toList();
        Map<Long, List<WalkPoint>> routes = recent.isEmpty() ? Map.of()
                : walkPointRepository.findAllByWalkIdInOrderByWalkIdAscSeqAsc(recent.stream().map(Walk::getId).toList())
                .stream().collect(Collectors.groupingBy(WalkPoint::getWalkId));

        List<Scored> scored = new ArrayList<>();
        scored.addAll(parkCourses(latitude, longitude, targetMeters, pace, habit, routes));
        scored.addAll(myRouteCourses(latitude, longitude, targetMeters, pace, recent, routes));
        List<CourseResponse> courses = scored.stream()
                .sorted(Comparator.comparingDouble(Scored::score).reversed())
                .map(Scored::course)
                .toList();
        return new CourseRecommendationResponse(targetMinutes, (int) Math.round(targetMeters), (int) Math.round(pace), courses);
    }

    // ------------------------------------------------------------------ 공원

    /**
     * 목표 거리 안팎(최대 1.8배)의 공원. 그런 공원이 하나도 없으면(공원이 드문 동네·짧은 목표 시간)
     * 반경 FALLBACK_RADIUS_METERS 까지 넓혀 가까운 공원을 '목표보다 먼 코스'로 표시해 준다.
     */
    private List<Scored> parkCourses(double lat, double lng, double targetMeters, double pace, WalkHabit habit,
                                     Map<Long, List<WalkPoint>> routes) {
        // 왕복이므로 편도 직선거리는 목표의 절반을 우회 계수로 나눈 정도까지
        double reach = targetMeters / 2 / DETOUR_FACTOR;
        List<Scored> picked = scanParks(lat, lng, Math.clamp(reach * 1.3, 400, 4000), targetMeters, pace, habit, routes, false);
        return picked.isEmpty()
                ? scanParks(lat, lng, FALLBACK_RADIUS_METERS, targetMeters, pace, habit, routes, true)
                : picked;
    }

    private List<Scored> scanParks(double lat, double lng, double radius, double targetMeters, double pace,
                                   WalkHabit habit, Map<Long, List<WalkPoint>> routes, boolean beyondTarget) {
        double lngScale = Math.pow(Math.cos(Math.toRadians(lat)), 2);
        double dLat = radius / METERS_PER_DEGREE;
        double dLng = radius / (METERS_PER_DEGREE * Math.cos(Math.toRadians(lat)));
        List<Park> parks = parkRepository.findInBounds(lat - dLat, lat + dLat, lng - dLng, lng + dLng,
                lat, lng, lngScale, PageRequest.of(0, PARK_CANDIDATES));
        if (parks.isEmpty()) return List.of();

        double near = FACILITY_NEAR_METERS / METERS_PER_DEGREE;
        List<Facility> facilities = facilityRepository.findInBounds(lat - dLat - near, lat + dLat + near,
                lng - dLng - near * 1.3, lng + dLng + near * 1.3, EnumSet.allOf(FacilityCategory.class),
                lat, lng, lngScale, PageRequest.of(0, 1000));

        List<Scored> candidates = new ArrayList<>();
        for (Park park : parks) {
            double straight = Distance.meters(lat, lng, park.getLatitude(), park.getLongitude());
            double parkRadius = park.getAreaSquareMeters() == null ? 30 : Math.sqrt(park.getAreaSquareMeters() / Math.PI);
            // 공원 안에서 걷는 거리: 지름 정도, 최대 1.5km
            double inside = Math.min(1500, parkRadius * 2);
            double total = 2 * Math.max(0, straight - parkRadius) * DETOUR_FACTOR + inside;
            if (!beyondTarget && total > targetMeters * 1.8) continue;
            candidates.add(scorePark(park, straight, parkRadius, total, targetMeters, pace, habit, routes, facilities,
                    beyondTarget && total > targetMeters * 1.8));
        }

        List<Scored> picked = new ArrayList<>();
        candidates.sort(Comparator.comparingDouble(Scored::score).reversed());
        for (Scored candidate : candidates) {
            if (picked.size() >= MAX_PARKS) break;
            boolean farEnough = picked.stream().allMatch(p -> Distance.meters(p.course().latitude(), p.course().longitude(),
                    candidate.course().latitude(), candidate.course().longitude()) >= MIN_PARK_GAP_METERS);
            if (farEnough) picked.add(candidate);
        }
        return picked;
    }

    private Scored scorePark(Park park, double straight, double parkRadius, double total, double targetMeters,
                             double pace, WalkHabit habit, Map<Long, List<WalkPoint>> routes, List<Facility> facilities,
                             boolean tooFar) {
        List<Factor> factors = new ArrayList<>();
        factors.add(distanceFactor(total, targetMeters));

        Double area = park.getAreaSquareMeters();
        if (area != null) {
            double sizeScore = 12 * Math.clamp((Math.log10(area) - 3) / 2, 0, 1);
            String text = area >= 30_000 ? "넓은 공원이에요 (약 " + formatTenThousand(area) + "㎡)" : null;
            factors.add(new Factor(text, sizeScore));
        }

        switch (park.getParkType()) {
            case "수변공원" -> factors.add(new Factor("물가를 따라 걸을 수 있어요", 8));
            case "근린공원", "체육공원", "문화공원", "역사공원", "도시농업공원" -> factors.add(new Factor(null, 5));
            case "어린이공원" -> factors.add(new Factor(null, -3));
            case "소공원" -> factors.add(new Factor(null, 0));
            default -> factors.add(new Factor(null, 2));
        }

        String convenience = park.getConvenience() == null ? "" : park.getConvenience();
        boolean toilet = convenience.contains("화장실");
        boolean water = convenience.contains("음수");
        if (toilet || water) {
            factors.add(new Factor(toilet && water ? "화장실·음수대가 있어요" : toilet ? "화장실이 있어요" : "음수대가 있어요", 4));
        }

        List<NearbyFacilityResponse> nearby = facilities.stream()
                .map(f -> new NearbyFacilityResponse(f.getId(), f.getName(), f.getCategory(), f.getCategory().getLabel(),
                        (int) Math.round(Distance.meters(park.getLatitude(), park.getLongitude(), f.getLatitude(), f.getLongitude()))))
                .filter(f -> f.distanceMeters() <= parkRadius + FACILITY_NEAR_METERS)
                .sorted(Comparator.comparingInt(NearbyFacilityResponse::distanceMeters))
                .toList();
        if (!nearby.isEmpty()) {
            factors.add(new Factor("주변에 반려동물 동반 시설 " + nearby.size() + "곳", Math.min(nearby.size(), 4) * 1.5));
        }

        long visits = routes.values().stream()
                .filter(points -> points.stream().anyMatch(p ->
                        Distance.meters(p.getLatitude(), p.getLongitude(), park.getLatitude(), park.getLongitude()) <= parkRadius + 60))
                .count();
        if (visits > 0) {
            factors.add(new Factor("최근 " + visits + "번 다녀온 곳이에요", Math.min(visits, 3) * 2));
        } else if (habit.hasHabit()) {
            factors.add(new Factor("아직 안 가본 곳이에요", 3));
        }

        double score = score(factors);
        List<String> reasons = new ArrayList<>(reasons(factors));
        if (tooFar) {
            // 주의 문구는 맨 앞에, 이유는 3개까지
            reasons.addFirst("목표(" + formatMeters(targetMeters) + ")보다 먼 코스예요. 가까운 공원이 없어요");
            if (reasons.size() > 3) reasons.removeLast();
        }
        CourseResponse course = new CourseResponse("park-" + park.getId(), CourseType.PARK, park.getName(),
                park.getParkType() + " · 직선 " + formatMeters(straight),
                park.getLatitude(), park.getLongitude(), roundTo10(total), minutes(total, pace), (int) Math.round(score),
                List.copyOf(reasons), park.getId(), null, park.getAddress(), area, park.getConvenience(),
                nearby.stream().limit(3).toList(), List.of());
        return new Scored(course, score);
    }

    // ------------------------------------------------------------------ 내 경로

    private List<Scored> myRouteCourses(double lat, double lng, double targetMeters, double pace, List<Walk> recent,
                                        Map<Long, List<WalkPoint>> routes) {
        record Route(Walk walk, List<WalkPoint> points, WalkPoint far) {
        }
        List<Route> candidates = new ArrayList<>();
        for (Walk walk : recent) {
            List<WalkPoint> points = routes.getOrDefault(walk.getId(), List.of());
            if (walk.getDistanceMeters() < 300 || points.size() < 5) continue;
            WalkPoint start = points.get(0);
            if (Distance.meters(lat, lng, start.getLatitude(), start.getLongitude()) > MY_ROUTE_START_METERS) continue;
            WalkPoint far = points.stream().max(Comparator.comparingDouble(p ->
                    Distance.meters(start.getLatitude(), start.getLongitude(), p.getLatitude(), p.getLongitude()))).orElseThrow();
            candidates.add(new Route(walk, points, far));
        }

        // 같은 길(출발점·반환점이 가깝고 거리가 비슷)은 가장 최근 것 하나로 묶고 몇 번 걸었는지 센다
        List<Route> unique = new ArrayList<>();
        List<Integer> counts = new ArrayList<>();
        for (Route route : candidates) {
            int same = -1;
            for (int i = 0; i < unique.size(); i++) {
                Route u = unique.get(i);
                boolean similar = Math.abs(u.walk().getDistanceMeters() - route.walk().getDistanceMeters())
                        <= 0.15 * Math.max(u.walk().getDistanceMeters(), route.walk().getDistanceMeters())
                        && near(u.points().get(0), route.points().get(0)) && near(u.far(), route.far());
                if (similar) {
                    same = i;
                    break;
                }
            }
            if (same >= 0) {
                counts.set(same, counts.get(same) + 1);
            } else {
                unique.add(route);
                counts.add(1);
            }
        }

        List<Scored> scored = new ArrayList<>();
        for (int i = 0; i < unique.size(); i++) {
            Route route = unique.get(i);
            int count = counts.get(i);
            Walk walk = route.walk();
            List<Factor> factors = new ArrayList<>();
            factors.add(distanceFactor(walk.getDistanceMeters(), targetMeters));
            String date = walk.getStartedAt().getMonthValue() + "월 " + walk.getStartedAt().getDayOfMonth() + "일";
            factors.add(count > 1 ? new Factor(count + "번 걸은 익숙한 길이에요", 10 + Math.min(count - 1, 3) * 2)
                    : new Factor(date + "에 걸었던 길이에요", 10));
            double score = score(factors);
            CourseResponse course = new CourseResponse("walk-" + walk.getId(), CourseType.MY_ROUTE, "내가 걸었던 길",
                    date + " · " + formatMeters(walk.getDistanceMeters()),
                    route.far().getLatitude(), route.far().getLongitude(), walk.getDistanceMeters(),
                    minutes(walk.getDistanceMeters(), pace), (int) Math.round(score), reasons(factors), null, walk.getId(),
                    null, null, null, List.of(), downsample(route.points()));
            scored.add(new Scored(course, score));
        }
        return scored.stream().sorted(Comparator.comparingDouble(Scored::score).reversed()).limit(MAX_ROUTES).toList();
    }

    // ------------------------------------------------------------------ 공통

    /** 목표 거리와 얼마나 가까운지 (가우시안, ±30% 에서 약 0.37) → 최대 45점 */
    private static Factor distanceFactor(double meters, double targetMeters) {
        double fit = Math.exp(-Math.pow((meters - targetMeters) / (0.3 * targetMeters), 2));
        String text = fit >= 0.75 ? "평소 산책 거리와 비슷해요"
                : meters < targetMeters * 0.6 ? "가볍게 다녀오기 좋아요" : null;
        return new Factor(text, 45 * fit);
    }

    private static double score(List<Factor> factors) {
        return Math.clamp(30 + factors.stream().mapToDouble(Factor::impact).sum(), 0, 100);
    }

    /** 점수에 많이 보탠 순으로 최대 3개 */
    private static List<String> reasons(List<Factor> factors) {
        return factors.stream()
                .filter(f -> f.text() != null && f.impact() > 0)
                .sorted(Comparator.comparingDouble(Factor::impact).reversed())
                .map(Factor::text)
                .limit(3)
                .toList();
    }

    /** 내 평소 속도 (분당 m): 300m·5분 이상 산책 3회 이상이면 중앙값, 아니면 50 */
    static double pace(List<Walk> walks) {
        List<Double> paces = walks.stream()
                .filter(w -> w.getDistanceMeters() >= 300 && w.getDurationSeconds() >= 300)
                .map(w -> w.getDistanceMeters() / (w.getDurationSeconds() / 60.0))
                .sorted()
                .toList();
        if (paces.size() < 3) return DEFAULT_PACE;
        return Math.clamp(paces.get(paces.size() / 2), 30, 100);
    }

    private static boolean near(WalkPoint a, WalkPoint b) {
        return Distance.meters(a.getLatitude(), a.getLongitude(), b.getLatitude(), b.getLongitude()) <= SAME_ROUTE_METERS;
    }

    private static List<LatLngResponse> downsample(List<WalkPoint> points) {
        int step = Math.max(1, (int) Math.ceil(points.size() / (double) PATH_MAX_POINTS));
        List<LatLngResponse> path = new ArrayList<>();
        for (int i = 0; i < points.size(); i += step) {
            path.add(new LatLngResponse(points.get(i).getLatitude(), points.get(i).getLongitude()));
        }
        WalkPoint last = points.get(points.size() - 1);
        if ((points.size() - 1) % step != 0) path.add(new LatLngResponse(last.getLatitude(), last.getLongitude()));
        return path;
    }

    private static int minutes(double meters, double pace) {
        return Math.max(1, (int) Math.round(meters / pace));
    }

    private static int roundTo10(double meters) {
        return (int) Math.round(meters / 10) * 10;
    }

    private static String formatMeters(double meters) {
        return meters < 1000 ? Math.round(meters / 10) * 10 + "m" : String.format("%.1fkm", meters / 1000);
    }

    /** 32000 → "3.2만" */
    private static String formatTenThousand(double value) {
        double tenThousands = Math.round(value / 1000) / 10.0;
        return (tenThousands == Math.rint(tenThousands) ? String.valueOf((long) tenThousands) : String.valueOf(tenThousands)) + "만";
    }
}
