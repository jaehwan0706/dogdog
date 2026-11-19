package com.dangsanchaek;

import com.dangsanchaek.course.service.route.WalkingRouter;
import com.dangsanchaek.course.service.route.WalkingRouter.WalkingRoute;
import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.IntStream;

import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * 공원 코스 거리를 걷는 길(TMAP)로 다시 잰다. 실제 TMAP 대신 가짜 경로를 돌려준다.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CourseRoutingTest {

    @Autowired
    MockMvc mvc;

    @MockitoBean
    WalkingRouter walkingRouter;

    @Test
    void 걷는_길이_있으면_그_거리와_경로를_쓴다() throws Exception {
        // 강변수변공원(37.506, 127.0)까지 걷는 길 900m (좌표 300개 → 응답에서는 하나 걸러 150개 + 끝점)
        List<double[]> path = IntStream.range(0, 300).mapToObj(i -> new double[]{37.5 + i * 0.00002, 127.0}).toList();
        given(walkingRouter.isEnabled()).willReturn(true);
        given(walkingRouter.route(anyDouble(), anyDouble(), anyDouble(), anyDouble())).willReturn(Optional.empty());
        given(walkingRouter.route(anyDouble(), anyDouble(), eq(37.506), eq(127.0)))
                .willReturn(Optional.of(new WalkingRoute(900, path)));

        String user = signup();
        mvc.perform(get("/recommendations/courses?lat=37.5&lng=127.0&minutes=36").header(HttpHeaders.AUTHORIZATION, "Bearer " + user))
                .andExpect(status().isOk())
                // 36분 × 50m = 1.8km = 걷는 길 900m 왕복
                .andExpect(jsonPath("$.courses[0].title").value("강변수변공원"))
                .andExpect(jsonPath("$.courses[0].distanceMeters").value(1800))
                .andExpect(jsonPath("$.courses[0].estimatedMinutes").value(36))
                .andExpect(jsonPath("$.courses[0].subtitle").value("수변공원 · 길 따라 900m"))
                .andExpect(jsonPath("$.courses[0].path", hasSize(151)))
                .andExpect(jsonPath("$.courses[0].path[0].latitude").value(37.5))
                // 경로를 못 받은 공원은 직선거리 추정 (경로 없음)
                .andExpect(jsonPath("$.courses[1].path", hasSize(0)));
    }

    private String signup() throws Exception {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String res = mvc.perform(post("/auth/signup").contentType(MediaType.APPLICATION_JSON).content("""
                        {"email":"t%s@test.dev","password":"walk1234","nickname":"t%s"}""".formatted(suffix, suffix)))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return JsonPath.read(res, "$.accessToken");
    }
}
