package com.dangsanchaek.course.service;

import com.dangsanchaek.walk.domain.Walk;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.stream.IntStream;

/**
 * 회원의 산책 습관 (최근 산책 기록으로 계산).
 * - 시간대 선호(hourAffinity): 산책을 시작한 시각의 분포. 최근 기록일수록 무겁게(반감기 30일) 세고,
 *   앞뒤 시간으로 조금씩 번지게(가우시안) 한 뒤 가장 높은 시간을 1 로 맞춘다.
 *   기록이 적을 때 한쪽으로 치우치지 않도록 아침(7~8시)·저녁(18~20시)에 기본값(산책 2회분)을 깔아 둔다.
 * - 평소 산책 시간(usualMinutes): 최근 20회 산책 시간의 중앙값
 *
 * @param walkCount      계산에 쓴 산책 수
 * @param usualMinutes   평소 산책 시간 (분, 5분 단위)
 * @param hourAffinity   0~23시 선호도 (0~1)
 * @param favoriteHours  가장 자주 산책을 시작한 시각 (최대 2개, 기록이 3회 미만이면 빈 목록)
 */
public record WalkHabit(int walkCount, int usualMinutes, double[] hourAffinity, List<Integer> favoriteHours) {

    public static final int LOOKBACK_DAYS = 90;
    static final int MIN_WALKS_FOR_HABIT = 3;
    static final int DEFAULT_MINUTES = 30;
    private static final double HALF_LIFE_DAYS = 30;
    private static final double PRIOR_WEIGHT = 2.0;
    private static final int[] PRIOR_HOURS = {7, 8, 18, 19, 20};
    private static final double SMOOTHING_SIGMA_HOURS = 1.0;
    private static final int RECENT_WALKS_FOR_DURATION = 20;

    /** walks: 종료된 산책 (순서 무관) */
    public static WalkHabit from(List<Walk> walks, LocalDateTime now) {
        double[] observed = new double[24];
        for (Walk walk : walks) {
            double ageDays = Math.max(0, Duration.between(walk.getStartedAt(), now).toMinutes() / 1440.0);
            observed[walk.getStartedAt().getHour()] += Math.pow(0.5, ageDays / HALF_LIFE_DAYS);
        }
        double[] raw = observed.clone();
        for (int hour : PRIOR_HOURS) raw[hour] += PRIOR_WEIGHT / PRIOR_HOURS.length;

        double[] smoothed = smooth(raw);
        double max = IntStream.range(0, 24).mapToDouble(h -> smoothed[h]).max().orElse(1);
        double[] affinity = IntStream.range(0, 24).mapToDouble(h -> smoothed[h] / max).toArray();

        boolean enough = walks.size() >= MIN_WALKS_FOR_HABIT;
        return new WalkHabit(walks.size(), usualMinutes(walks, enough), affinity,
                enough ? favoriteHours(observed) : List.of());
    }

    public boolean hasHabit() {
        return walkCount >= MIN_WALKS_FOR_HABIT;
    }

    public double affinityAt(int hour) {
        return hourAffinity[hour];
    }

    /** 자정을 넘어 이어지는(23시 ↔ 0시) 원형 가우시안 */
    private static double[] smooth(double[] values) {
        double[] result = new double[24];
        for (int hour = 0; hour < 24; hour++) {
            for (int offset = -3; offset <= 3; offset++) {
                double weight = Math.exp(-(offset * offset) / (2 * SMOOTHING_SIGMA_HOURS * SMOOTHING_SIGMA_HOURS));
                result[hour] += values[Math.floorMod(hour + offset, 24)] * weight;
            }
        }
        return result;
    }

    /** 가장 많은 시각, 그리고 그 절반 이상인 두 번째 시각 */
    private static List<Integer> favoriteHours(double[] observed) {
        List<Integer> ranked = IntStream.range(0, 24).boxed()
                .filter(h -> observed[h] > 0)
                .sorted(Comparator.comparingDouble((Integer h) -> observed[h]).reversed())
                .toList();
        if (ranked.isEmpty()) return List.of();
        int first = ranked.get(0);
        if (ranked.size() > 1 && observed[ranked.get(1)] >= observed[first] * 0.5) {
            return List.of(first, ranked.get(1)).stream().sorted().toList();
        }
        return List.of(first);
    }

    private static int usualMinutes(List<Walk> walks, boolean enough) {
        if (!enough) return DEFAULT_MINUTES;
        List<Integer> minutes = walks.stream()
                .sorted(Comparator.comparing(Walk::getStartedAt).reversed())
                .limit(RECENT_WALKS_FOR_DURATION)
                .map(Walk::getDurationSeconds)
                .filter(seconds -> seconds >= 60)
                .map(seconds -> seconds / 60)
                .sorted()
                .toList();
        if (minutes.isEmpty()) return DEFAULT_MINUTES;
        int median = minutes.get(minutes.size() / 2);
        int rounded = Math.round(median / 5f) * 5;
        return Math.clamp(rounded, 10, 120);
    }
}
