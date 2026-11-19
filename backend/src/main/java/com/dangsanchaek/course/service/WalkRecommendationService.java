package com.dangsanchaek.course.service;

import com.dangsanchaek.common.exception.BusinessException;
import com.dangsanchaek.common.exception.ErrorCode;
import com.dangsanchaek.course.dto.RecommendationDtos.CurrentConditionResponse;
import com.dangsanchaek.course.dto.RecommendationDtos.WalkHabitResponse;
import com.dangsanchaek.course.dto.RecommendationDtos.WalkTimeRecommendationResponse;
import com.dangsanchaek.course.dto.RecommendationDtos.WalkTimeSlotResponse;
import com.dangsanchaek.course.service.WalkTimeScorer.ScoredSlot;
import com.dangsanchaek.dog.domain.Dog;
import com.dangsanchaek.dog.repository.DogRepository;
import com.dangsanchaek.environment.domain.AirGrade;
import com.dangsanchaek.environment.domain.AirQuality;
import com.dangsanchaek.environment.domain.HourlyWeather;
import com.dangsanchaek.environment.domain.PrecipitationType;
import com.dangsanchaek.environment.domain.WeatherForecast;
import com.dangsanchaek.environment.service.AirQualityProvider;
import com.dangsanchaek.environment.service.KmaGrid;
import com.dangsanchaek.environment.service.WeatherProvider;
import com.dangsanchaek.walk.domain.Walk;
import com.dangsanchaek.walk.domain.WalkStatus;
import com.dangsanchaek.walk.repository.WalkRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.function.Supplier;

/**
 * 맞춤 산책 시간 추천: 앞으로 24시간을 1시간 단위로 날씨(기상청)·미세먼지(에어코리아)·회원의 산책 습관으로 점수 매긴다.
 * 날씨·미세먼지를 못 받아도 습관과 시간대만으로 추천은 돌려준다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class WalkRecommendationService {

    static final int HOURS = 24;
    static final int BEST_SLOTS = 3;
    static final int BEST_SLOT_GAP_HOURS = 3;

    private final WalkRepository walkRepository;
    private final DogRepository dogRepository;
    private final WeatherProvider weatherProvider;
    private final AirQualityProvider airQualityProvider;
    private final Clock clock;

    @Transactional(readOnly = true)
    public WalkTimeRecommendationResponse recommendTimes(Long userId, double latitude, double longitude, Long dogId) {
        if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }
        LocalDateTime now = LocalDateTime.now(clock);
        Double dogWeightKg = dogWeight(userId, dogId);
        List<Walk> walks = walkRepository.findAllInRange(userId, WalkStatus.FINISHED,
                now.minusDays(WalkHabit.LOOKBACK_DAYS), now.plusDays(1));
        WalkHabit habit = WalkHabit.from(walks, now);

        // 기상청·에어코리아는 국내만 제공
        boolean covered = KmaGrid.covers(latitude, longitude);
        WeatherForecast weather = covered ? load("날씨", () -> weatherProvider.forecast(latitude, longitude)) : null;
        AirQuality air = covered ? load("미세먼지", () -> airQualityProvider.airQuality(latitude, longitude)) : null;

        LocalDateTime firstHour = now.truncatedTo(ChronoUnit.HOURS);
        List<ScoredSlot> slots = new ArrayList<>();
        for (int i = 0; i < HOURS; i++) {
            LocalDateTime time = firstHour.plusHours(i);
            HourlyWeather hourWeather = weatherAt(weather, time, i == 0);
            AirGrade airGrade = air == null ? null : air.gradeAt(time, now);
            slots.add(WalkTimeScorer.score(time, hourWeather, airGrade, habit, dogWeightKg));
        }

        ScoredSlot current = slots.get(0);
        boolean airAvailable = air != null && (air.grade() != null || !air.forecast().isEmpty());
        return new WalkTimeRecommendationResponse(
                now,
                weatherProvider.isSample() || airQualityProvider.isSample(),
                weather != null,
                airAvailable,
                CurrentConditionResponse.of(headline(current, weather != null), current, air),
                WalkTimeScorer.pickBest(slots, BEST_SLOTS, BEST_SLOT_GAP_HOURS).stream()
                        .map(WalkTimeSlotResponse::from).toList(),
                slots.stream().map(WalkTimeSlotResponse::from).toList(),
                WalkHabitResponse.from(habit));
    }

    /** 지금 시간은 실황(관측값)을 우선하고, 비어 있는 하늘상태·강수확률은 예보로 채운다 */
    private static HourlyWeather weatherAt(WeatherForecast weather, LocalDateTime time, boolean isNow) {
        if (weather == null) return null;
        HourlyWeather forecast = weather.at(time);
        if (!isNow) return forecast;
        // 발표 직후에는 이번 시간 예보가 없어서 다음 시간 예보로 대신한다
        if (forecast == null) forecast = weather.at(time.plusHours(1));
        return weather.now() == null ? forecast : weather.now().fillFrom(forecast);
    }

    static String headline(ScoredSlot current, boolean weatherAvailable) {
        if (!weatherAvailable) return "날씨 정보를 불러오지 못했어요";
        HourlyWeather w = current.weather();
        PrecipitationType precipitation = w == null ? null : w.precipitation();
        Double temperature = w == null ? null : w.temperature();
        if (precipitation != null && precipitation.isFalling()) {
            return "지금은 " + precipitation.getLabel() + " 소식이 있어요. 그친 뒤에 나가요";
        }
        if (current.airGrade() != null && current.airGrade().isBadOrWorse()) {
            return (current.airGrade() == AirGrade.VERY_BAD ? "미세먼지가 매우 나빠요" : "미세먼지가 나빠요") + ". 짧게 다녀와요";
        }
        if (temperature != null && temperature >= 28) return "더운 날이에요. 그늘길로 짧게 걸어요";
        if (temperature != null && temperature <= -5) return "추운 날이에요. 따뜻하게 입고 짧게 걸어요";
        return switch (current.level()) {
            case GOOD -> "오늘은 산책하기 좋은 날이에요";
            case FAIR -> "산책하기 무난한 날이에요";
            case POOR -> "오늘은 짧은 산책을 추천해요";
        };
    }

    private Double dogWeight(Long userId, Long dogId) {
        if (dogId == null) return null;
        Dog dog = dogRepository.findById(dogId)
                .filter(d -> d.isOwnedBy(userId))
                .orElseThrow(() -> new BusinessException(ErrorCode.DOG_NOT_FOUND));
        return dog.getWeightKg() == null ? null : dog.getWeightKg().doubleValue();
    }

    private static <T> T load(String what, Supplier<T> loader) {
        try {
            return loader.get();
        } catch (RuntimeException e) {
            log.warn("{} 조회 실패: {}", what, e.toString());
            return null;
        }
    }
}
