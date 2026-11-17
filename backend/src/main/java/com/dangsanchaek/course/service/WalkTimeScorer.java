package com.dangsanchaek.course.service;

import com.dangsanchaek.environment.domain.AirGrade;
import com.dangsanchaek.environment.domain.HourlyWeather;
import com.dangsanchaek.environment.domain.PrecipitationType;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * 한 시간 단위로 '산책하기 좋은 정도'(0~100)를 매긴다.
 * 기본 80점에서 기온·비·바람·미세먼지·늦은 시간은 빼고, 좋은 날씨와 평소 산책하던 시간(최대 +12)은 더한다.
 * 점수에 영향을 준 요인은 사람이 읽는 이유 문장으로 함께 돌려준다.
 */
public final class WalkTimeScorer {

    public enum Level { GOOD, FAIR, POOR }

    /**
     * @param weather          그 시간 날씨 (없으면 null)
     * @param airGrade         그 시간 미세먼지 등급 (없으면 null)
     * @param suggestedMinutes 추천 산책 시간: 평소 산책 시간을 날씨에 맞춰 줄인 값
     * @param reasons          나쁜 요인 먼저, 최대 3개
     */
    public record ScoredSlot(LocalDateTime time, int score, Level level, HourlyWeather weather, AirGrade airGrade,
                             int suggestedMinutes, List<String> reasons) {
    }

    /** text 가 null 이면 점수에만 반영하고 이유로는 보여 주지 않는다 */
    private record Factor(String text, double impact) {
    }

    static final int BASE_SCORE = 80;
    static final int GOOD_SCORE = 75;
    static final int FAIR_SCORE = 50;
    static final double HABIT_BONUS = 12;
    private static final double SMALL_DOG_KG = 10;
    private static final int MAX_REASONS = 3;
    private static final int MIN_SUGGESTED_MINUTES = 10;

    private WalkTimeScorer() {
    }

    public static ScoredSlot score(LocalDateTime time, HourlyWeather weather, AirGrade airGrade, WalkHabit habit,
                                   Double dogWeightKg) {
        List<Factor> factors = new ArrayList<>();
        double durationFactor = 1.0;

        if (weather != null) {
            Double t = weather.temperature();
            if (t != null) {
                String temp = "기온 " + formatNumber(t) + "°C";
                if (t >= 28) {
                    factors.add(new Factor(temp + ", 더위와 뜨거운 바닥을 조심하세요", -((t - 22) * 3 + (t - 28) * 5)));
                    durationFactor = Math.min(durationFactor, 0.6);
                } else if (t > 22) {
                    factors.add(new Factor(temp + "로 조금 더워요", -(t - 22) * 3));
                } else if (t >= 8) {
                    factors.add(new Factor(temp + "로 걷기 좋아요", 4));
                } else {
                    // 작은 강아지는 추위를 더 탄다
                    double coldWeight = dogWeightKg != null && dogWeightKg < SMALL_DOG_KG ? 2.6 : 2.0;
                    factors.add(new Factor(temp + (t < 0 ? "로 추워요" : "로 쌀쌀해요"), -(8 - t) * coldWeight));
                    if (t <= -5) durationFactor = Math.min(durationFactor, 0.6);
                }
            }

            PrecipitationType precipitation = weather.precipitation();
            Integer pop = weather.precipitationProbability();
            if (precipitation != null && precipitation.isFalling()) {
                factors.add(new Factor(precipitation.getLabel() + " 소식이 있어요", -55));
                durationFactor = Math.min(durationFactor, 0.5);
            } else if (pop != null && pop >= 30) {
                factors.add(new Factor("강수확률 " + pop + "%", -(pop - 20) * 0.5));
            } else if (pop != null) {
                factors.add(new Factor("비 소식이 없어요", 2));
            }

            Double wind = weather.windSpeed();
            if (wind != null && wind >= 7) {
                factors.add(new Factor("바람이 강해요 (" + formatNumber(wind) + "m/s)", -(wind - 6) * 4));
            }
        }

        if (airGrade != null) {
            switch (airGrade) {
                case GOOD -> factors.add(new Factor("미세먼지 좋음", 3));
                case MODERATE -> factors.add(new Factor(null, -3));
                case BAD -> {
                    factors.add(new Factor("미세먼지 나쁨, 짧게 다녀오세요", -30));
                    durationFactor = Math.min(durationFactor, 0.5);
                }
                case VERY_BAD -> {
                    factors.add(new Factor("미세먼지 매우 나쁨, 실외 산책을 줄여요", -50));
                    durationFactor = Math.min(durationFactor, 0.3);
                }
            }
        }

        int hour = time.getHour();
        if (hour < 5) {
            factors.add(new Factor("늦은 밤이에요", -20));
        } else if (hour >= 22 || hour == 5) {
            factors.add(new Factor("어두운 시간이에요, 밝은 길로 다녀요", -8));
        }

        double affinity = habit.affinityAt(hour);
        boolean usualTime = habit.hasHabit() && affinity >= 0.6;
        factors.add(new Factor(usualTime ? "평소 자주 산책하던 시간이에요" : null, HABIT_BONUS * affinity));

        double total = BASE_SCORE + factors.stream().mapToDouble(Factor::impact).sum();
        int score = (int) Math.clamp(Math.round(total), 0, 100);
        int minutes = Math.max(MIN_SUGGESTED_MINUTES, Math.round(habit.usualMinutes() * (float) durationFactor / 5) * 5);
        return new ScoredSlot(time, score, levelOf(score), weather, airGrade, minutes, reasons(factors));
    }

    public static Level levelOf(int score) {
        if (score >= GOOD_SCORE) return Level.GOOD;
        if (score >= FAIR_SCORE) return Level.FAIR;
        return Level.POOR;
    }

    /**
     * 점수 높은 순으로 최대 count 개. 비슷한 시간대만 몰리지 않도록 서로 minGapHours 이상 떨어뜨린다.
     * 'POOR' 시간은 빼되, 모두 POOR 면 가장 나은 하나만 준다.
     */
    public static List<ScoredSlot> pickBest(List<ScoredSlot> slots, int count, int minGapHours) {
        List<ScoredSlot> ranked = slots.stream()
                .sorted(Comparator.comparingInt(ScoredSlot::score).reversed().thenComparing(ScoredSlot::time))
                .toList();
        List<ScoredSlot> picked = new ArrayList<>();
        for (ScoredSlot slot : ranked) {
            if (picked.size() >= count || slot.level() == Level.POOR) break;
            boolean farEnough = picked.stream().allMatch(p ->
                    Math.abs(Duration.between(p.time(), slot.time()).toHours()) >= minGapHours);
            if (farEnough) picked.add(slot);
        }
        if (picked.isEmpty() && !ranked.isEmpty()) picked.add(ranked.get(0));
        return List.copyOf(picked);
    }

    /** 나쁜 요인(감점 5 이상)을 큰 순서로, 그다음 좋은 요인 */
    private static List<String> reasons(List<Factor> factors) {
        List<Factor> visible = factors.stream().filter(f -> f.text() != null).toList();
        List<String> reasons = new ArrayList<>();
        visible.stream().filter(f -> f.impact() <= -5)
                .sorted(Comparator.comparingDouble(Factor::impact))
                .forEach(f -> reasons.add(f.text()));
        visible.stream().filter(f -> f.impact() > 0)
                .sorted(Comparator.comparingDouble(Factor::impact).reversed())
                .forEach(f -> reasons.add(f.text()));
        return reasons.size() > MAX_REASONS ? List.copyOf(reasons.subList(0, MAX_REASONS)) : List.copyOf(reasons);
    }

    private static String formatNumber(double value) {
        double rounded = Math.round(value * 10) / 10.0;
        return rounded == Math.rint(rounded) ? String.valueOf((long) rounded) : String.valueOf(rounded);
    }
}
