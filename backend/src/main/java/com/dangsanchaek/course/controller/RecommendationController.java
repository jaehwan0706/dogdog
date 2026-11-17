package com.dangsanchaek.course.controller;

import com.dangsanchaek.common.security.LoginUser;
import com.dangsanchaek.course.dto.CourseDtos.CourseRecommendationResponse;
import com.dangsanchaek.course.dto.RecommendationDtos.WalkTimeRecommendationResponse;
import com.dangsanchaek.course.service.CourseRecommendationService;
import com.dangsanchaek.course.service.WalkRecommendationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** 맞춤 산책 추천 (회원의 산책 기록을 쓰므로 로그인 필요) */
@RestController
@RequiredArgsConstructor
public class RecommendationController {

    private final WalkRecommendationService recommendationService;
    private final CourseRecommendationService courseRecommendationService;

    /** 지금부터 24시간 중 산책하기 좋은 시간. dogId 를 주면 그 반려견 체중(작은 강아지 추위)을 반영 */
    @GetMapping("/recommendations/walk-times")
    public WalkTimeRecommendationResponse walkTimes(@LoginUser Long userId,
                                                    @RequestParam double lat,
                                                    @RequestParam double lng,
                                                    @RequestParam(required = false) Long dogId) {
        return recommendationService.recommendTimes(userId, lat, lng, dogId);
    }

    /** 주변 공원·내가 걸었던 길 중 목표 시간(minutes, 없으면 평소 산책 시간)에 맞는 코스 */
    @GetMapping("/recommendations/courses")
    public CourseRecommendationResponse courses(@LoginUser Long userId,
                                                @RequestParam double lat,
                                                @RequestParam double lng,
                                                @RequestParam(required = false) Integer minutes) {
        return courseRecommendationService.recommend(userId, lat, lng, minutes);
    }
}
