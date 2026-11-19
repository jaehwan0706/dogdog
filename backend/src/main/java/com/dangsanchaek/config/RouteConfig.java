package com.dangsanchaek.config;

import com.dangsanchaek.config.properties.TmapProperties;
import com.dangsanchaek.course.service.route.TmapWalkingRouter;
import com.dangsanchaek.course.service.route.WalkingRouter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Clock;

/** 코스 경로: TMAP 앱 키가 있으면 보행자 경로, 없으면 직선거리 추정 */
@Slf4j
@Configuration
public class RouteConfig {

    @Bean
    public WalkingRouter walkingRouter(TmapProperties properties, Clock clock) {
        if (properties.hasAppKey()) return new TmapWalkingRouter(properties.appKey().trim(), clock);
        log.warn("app.tmap.app-key 가 없어 코스 거리를 직선거리로 추정합니다.");
        return WalkingRouter.NONE;
    }
}
