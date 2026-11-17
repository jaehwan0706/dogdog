package com.dangsanchaek.course.service;

import com.dangsanchaek.course.service.WalkTimeScorer.Level;
import com.dangsanchaek.course.service.WalkTimeScorer.ScoredSlot;
import com.dangsanchaek.environment.domain.AirGrade;
import com.dangsanchaek.environment.domain.HourlyWeather;
import com.dangsanchaek.environment.domain.PrecipitationType;
import com.dangsanchaek.environment.domain.SkyCondition;
import com.dangsanchaek.walk.domain.Walk;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class WalkTimeScorerTest {

    private static final LocalDateTime NOW = LocalDateTime.of(2026, 11, 17, 6, 0);
    private static final WalkHabit NO_HABIT = WalkHabit.from(List.of(), NOW);

    private static HourlyWeather weather(LocalDateTime time, double temperature, int pop, PrecipitationType pty) {
        return new HourlyWeather(time, temperature, pop, SkyCondition.CLEAR, pty, 2.0);
    }

    private static Walk walk(LocalDateTime startedAt, int minutes) {
        Walk walk = Walk.start(null, null, startedAt);
        walk.finish(startedAt.plusMinutes(minutes), 1000);
        return walk;
    }

    @Test
    void 쾌적한_날씨는_좋음_비와_미세먼지는_감점() {
        LocalDateTime time = NOW.withHour(10);
        ScoredSlot nice = WalkTimeScorer.score(time, weather(time, 18, 10, PrecipitationType.NONE), AirGrade.GOOD, NO_HABIT, null);
        ScoredSlot rainy = WalkTimeScorer.score(time, weather(time, 18, 80, PrecipitationType.RAIN), AirGrade.GOOD, NO_HABIT, null);
        ScoredSlot dusty = WalkTimeScorer.score(time, weather(time, 18, 10, PrecipitationType.NONE), AirGrade.BAD, NO_HABIT, null);

        assertThat(nice.level()).isEqualTo(Level.GOOD);
        assertThat(nice.reasons()).contains("기온 18°C로 걷기 좋아요", "미세먼지 좋음");
        assertThat(rainy.score()).isLessThan(nice.score() - 40);
        assertThat(rainy.reasons().get(0)).isEqualTo("비 소식이 있어요");
        assertThat(dusty.level()).isNotEqualTo(Level.GOOD);
        assertThat(dusty.reasons().get(0)).startsWith("미세먼지 나쁨");
        // 평소 30분 → 미세먼지 나쁨이면 절반
        assertThat(dusty.suggestedMinutes()).isEqualTo(15);
    }

    @Test
    void 더위와_추위_작은_강아지는_추위에_더_감점() {
        LocalDateTime time = NOW.withHour(14);
        ScoredSlot hot = WalkTimeScorer.score(time, weather(time, 31, 0, PrecipitationType.NONE), null, NO_HABIT, null);
        assertThat(hot.level()).isEqualTo(Level.POOR);
        assertThat(hot.reasons().get(0)).isEqualTo("기온 31°C, 더위와 뜨거운 바닥을 조심하세요");

        ScoredSlot coldBig = WalkTimeScorer.score(time, weather(time, -3, 0, PrecipitationType.NONE), null, NO_HABIT, 20.0);
        ScoredSlot coldSmall = WalkTimeScorer.score(time, weather(time, -3, 0, PrecipitationType.NONE), null, NO_HABIT, 4.0);
        assertThat(coldSmall.score()).isLessThan(coldBig.score());
        assertThat(coldBig.reasons()).contains("기온 -3°C로 추워요");
    }

    @Test
    void 날씨가_같으면_평소_산책하던_시간이_더_높다() {
        // 최근 저녁 7시에 자주 산책
        List<Walk> walks = new ArrayList<>();
        for (int day = 1; day <= 6; day++) walks.add(walk(NOW.minusDays(day).withHour(19), 40));
        walks.add(walk(NOW.minusDays(7).withHour(8), 20));
        WalkHabit habit = WalkHabit.from(walks, NOW);

        assertThat(habit.hasHabit()).isTrue();
        assertThat(habit.favoriteHours()).containsExactly(19);
        assertThat(habit.usualMinutes()).isEqualTo(40);

        LocalDateTime evening = NOW.withHour(19);
        LocalDateTime noon = NOW.withHour(12);
        ScoredSlot atEvening = WalkTimeScorer.score(evening, weather(evening, 15, 0, PrecipitationType.NONE), AirGrade.MODERATE, habit, null);
        ScoredSlot atNoon = WalkTimeScorer.score(noon, weather(noon, 15, 0, PrecipitationType.NONE), AirGrade.MODERATE, habit, null);
        assertThat(atEvening.score()).isGreaterThan(atNoon.score());
        assertThat(atEvening.reasons()).contains("평소 자주 산책하던 시간이에요");
        assertThat(atNoon.reasons()).doesNotContain("평소 자주 산책하던 시간이에요");
    }

    @Test
    void 기록이_적으면_기본_습관() {
        WalkHabit habit = WalkHabit.from(List.of(walk(NOW.minusDays(1).withHour(13), 50)), NOW);
        assertThat(habit.hasHabit()).isFalse();
        assertThat(habit.usualMinutes()).isEqualTo(WalkHabit.DEFAULT_MINUTES);
        assertThat(habit.favoriteHours()).isEmpty();
        // 기본값은 아침·저녁이 높다
        assertThat(habit.affinityAt(19)).isGreaterThan(habit.affinityAt(3));
    }

    @Test
    void 추천_시간은_점수순으로_3시간_이상_떨어지고_나쁜_시간은_빠진다() {
        List<ScoredSlot> slots = new ArrayList<>();
        int[] scores = {90, 88, 85, 70, 40, 80, 30};
        for (int i = 0; i < scores.length; i++) {
            slots.add(new ScoredSlot(NOW.plusHours(i), scores[i], WalkTimeScorer.levelOf(scores[i]), null, null, 30, List.of()));
        }
        List<ScoredSlot> best = WalkTimeScorer.pickBest(slots, 3, 3);
        assertThat(best).extracting(ScoredSlot::score).containsExactly(90, 80);

        List<ScoredSlot> allPoor = List.of(
                new ScoredSlot(NOW, 20, Level.POOR, null, null, 10, List.of()),
                new ScoredSlot(NOW.plusHours(1), 35, Level.POOR, null, null, 10, List.of()));
        assertThat(WalkTimeScorer.pickBest(allPoor, 3, 3)).extracting(ScoredSlot::score).containsExactly(35);
    }
}
