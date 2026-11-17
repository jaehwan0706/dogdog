package com.dangsanchaek.course.dto;

import com.dangsanchaek.course.service.WalkHabit;
import com.dangsanchaek.course.service.WalkTimeScorer.Level;
import com.dangsanchaek.course.service.WalkTimeScorer.ScoredSlot;
import com.dangsanchaek.environment.domain.AirGrade;
import com.dangsanchaek.environment.domain.AirQuality;
import com.dangsanchaek.environment.domain.HourlyWeather;
import com.dangsanchaek.environment.domain.PrecipitationType;
import com.dangsanchaek.environment.domain.SkyCondition;

import java.time.LocalDateTime;
import java.util.List;

public final class RecommendationDtos {

    private RecommendationDtos() {
    }

    /**
     * 추천 산책 시간대.
     *
     * @param sample           true 면 공공데이터 인증키가 없어 예시 날씨·미세먼지로 계산한 결과
     * @param weatherAvailable 날씨를 받아 왔는지 (해외 위치거나 API 실패면 false, 이때는 습관·시간만으로 계산)
     * @param airAvailable     미세먼지를 받아 왔는지
     * @param bestSlots        추천 시간 (좋은 순, 최대 3개, 서로 3시간 이상 떨어짐)
     * @param hourly           지금 시각(정시)부터 24시간
     */
    public record WalkTimeRecommendationResponse(
            LocalDateTime generatedAt,
            boolean sample,
            boolean weatherAvailable,
            boolean airAvailable,
            CurrentConditionResponse current,
            List<WalkTimeSlotResponse> bestSlots,
            List<WalkTimeSlotResponse> hourly,
            WalkHabitResponse habit
    ) {
    }

    /**
     * 지금 날씨·미세먼지 (홈 날씨 카드).
     *
     * @param headline 한 줄 요약 (예: "오늘은 산책하기 좋은 날이에요")
     */
    public record CurrentConditionResponse(
            String headline,
            int score,
            Level level,
            Double temperature,
            String conditionLabel,
            SkyCondition sky,
            PrecipitationType precipitation,
            Integer pm10,
            Integer pm25,
            AirGrade airGrade,
            String airGradeLabel,
            String stationName,
            LocalDateTime airMeasuredAt
    ) {
        public static CurrentConditionResponse of(String headline, ScoredSlot slot, AirQuality air) {
            HourlyWeather w = slot.weather();
            AirGrade grade = air == null ? null : air.grade();
            return new CurrentConditionResponse(headline, slot.score(), slot.level(),
                    w == null ? null : w.temperature(),
                    w == null ? null : w.conditionLabel(),
                    w == null ? null : w.sky(),
                    w == null ? null : w.precipitation(),
                    air == null ? null : air.pm10(),
                    air == null ? null : air.pm25(),
                    grade,
                    grade == null ? null : grade.getLabel(),
                    air == null ? null : air.stationName(),
                    air == null ? null : air.measuredAt());
        }
    }

    /**
     * @param time             시간의 시작 시각 (정시, 한국 시각)
     * @param score            0~100
     * @param suggestedMinutes 이 시간에 권하는 산책 시간 (평소 산책 시간을 날씨·미세먼지에 맞춰 줄임)
     * @param reasons          점수의 이유 (나쁜 요인 먼저, 최대 3개)
     */
    public record WalkTimeSlotResponse(
            LocalDateTime time,
            int score,
            Level level,
            Double temperature,
            Integer precipitationProbability,
            SkyCondition sky,
            PrecipitationType precipitation,
            String conditionLabel,
            AirGrade airGrade,
            String airGradeLabel,
            int suggestedMinutes,
            List<String> reasons
    ) {
        public static WalkTimeSlotResponse from(ScoredSlot slot) {
            HourlyWeather w = slot.weather();
            AirGrade grade = slot.airGrade();
            return new WalkTimeSlotResponse(slot.time(), slot.score(), slot.level(),
                    w == null ? null : w.temperature(),
                    w == null ? null : w.precipitationProbability(),
                    w == null ? null : w.sky(),
                    w == null ? null : w.precipitation(),
                    w == null ? null : w.conditionLabel(),
                    grade,
                    grade == null ? null : grade.getLabel(),
                    slot.suggestedMinutes(),
                    slot.reasons());
        }
    }

    /**
     * @param walkCount     최근 90일 산책 수
     * @param usualMinutes  평소 산책 시간 (기록이 3회 미만이면 기본 30분)
     * @param favoriteHours 주로 산책을 시작한 시각 (0~23, 기록이 3회 미만이면 빈 목록)
     */
    public record WalkHabitResponse(int walkCount, int usualMinutes, List<Integer> favoriteHours) {
        public static WalkHabitResponse from(WalkHabit habit) {
            return new WalkHabitResponse(habit.walkCount(), habit.usualMinutes(), habit.favoriteHours());
        }
    }
}
