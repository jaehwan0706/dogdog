package com.dangsanchaek.course.service.route;

import com.dangsanchaek.course.service.route.WalkingRouter.WalkingRoute;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;

import java.time.Clock;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * 실제 TMAP 보행자 경로 확인용. 환경변수 TMAP_APP_KEY 가 있을 때만 실행된다 (평소 테스트·CI 에서는 건너뜀).
 */
@EnabledIfEnvironmentVariable(named = "TMAP_APP_KEY", matches = ".+")
class TmapLiveTest {

    @Test
    void 서울시청에서_덕수궁까지_걷는_길() {
        TmapWalkingRouter router = new TmapWalkingRouter(System.getenv("TMAP_APP_KEY"), Clock.systemUTC());
        WalkingRoute route = router.route(37.5666, 126.9784, 37.5658, 126.9752).orElseThrow();
        System.out.println("[live] 거리 " + route.distanceMeters() + "m, 좌표 " + route.path().size() + "개");
        assertThat(route.distanceMeters()).isBetween(200, 1500);
        assertThat(route.path().size()).isGreaterThan(2);
        // 두 번째 호출은 캐시
        assertThat(router.route(37.5666, 126.9784, 37.5658, 126.9752)).contains(route);
    }
}
