package com.dangsanchaek;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.hamcrest.Matchers.allOf;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.lessThanOrEqualTo;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * 추천 산책 시간: 테스트에는 공공데이터 인증키가 없어 예시 날씨·미세먼지로 계산된다.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class RecommendationFlowTest {

    @Autowired
    MockMvc mvc;

    @Test
    void 지금부터_24시간_추천() throws Exception {
        String user = signup();
        int dogId = createDog(user);

        mvc.perform(get("/recommendations/walk-times?lat=37.5665&lng=126.978&dogId=" + dogId).header(HttpHeaders.AUTHORIZATION, "Bearer " + user))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sample").value(true))
                .andExpect(jsonPath("$.weatherAvailable").value(true))
                .andExpect(jsonPath("$.airAvailable").value(true))
                .andExpect(jsonPath("$.hourly", hasSize(24)))
                .andExpect(jsonPath("$.bestSlots", hasSize(allOf(greaterThanOrEqualTo(1), lessThanOrEqualTo(3)))))
                .andExpect(jsonPath("$.bestSlots[0].reasons").isArray())
                .andExpect(jsonPath("$.current.headline", notNullValue()))
                .andExpect(jsonPath("$.current.temperature", notNullValue()))
                .andExpect(jsonPath("$.current.airGrade").value("GOOD"))
                .andExpect(jsonPath("$.current.airGradeLabel").value("좋음"))
                .andExpect(jsonPath("$.current.stationName").value("예시 측정소"))
                // 기록이 없으면 기본 30분
                .andExpect(jsonPath("$.habit.walkCount").value(0))
                .andExpect(jsonPath("$.habit.usualMinutes").value(30))
                .andExpect(jsonPath("$.habit.favoriteHours", hasSize(0)));
    }

    @Test
    void 해외_위치는_날씨_없이_시간대만() throws Exception {
        String user = signup();
        mvc.perform(get("/recommendations/walk-times?lat=37.42&lng=-122.08").header(HttpHeaders.AUTHORIZATION, "Bearer " + user))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.weatherAvailable").value(false))
                .andExpect(jsonPath("$.airAvailable").value(false))
                .andExpect(jsonPath("$.current.headline").value("날씨 정보를 불러오지 못했어요"))
                .andExpect(jsonPath("$.hourly", hasSize(24)));
    }

    @Test
    void 로그인_필요_잘못된_값과_남의_반려견은_거절() throws Exception {
        mvc.perform(get("/recommendations/walk-times?lat=37.5&lng=127.0")).andExpect(status().isUnauthorized());

        String user = signup();
        mvc.perform(get("/recommendations/walk-times?lat=95&lng=127.0").header(HttpHeaders.AUTHORIZATION, "Bearer " + user))
                .andExpect(status().isBadRequest());
        mvc.perform(get("/recommendations/walk-times?lat=37.5").header(HttpHeaders.AUTHORIZATION, "Bearer " + user))
                .andExpect(status().isBadRequest());

        int otherDog = createDog(signup());
        mvc.perform(get("/recommendations/walk-times?lat=37.5&lng=127.0&dogId=" + otherDog).header(HttpHeaders.AUTHORIZATION, "Bearer " + user))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("DOG_NOT_FOUND"));
    }

    private int createDog(String token) throws Exception {
        String res = mvc.perform(post("/dogs").header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"콩이\",\"weightKg\":4.5}"))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return JsonPath.read(res, "$.id");
    }

    private String signup() throws Exception {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String res = mvc.perform(post("/auth/signup").contentType(MediaType.APPLICATION_JSON).content("""
                        {"email":"r%s@test.dev","password":"walk1234","nickname":"r%s"}""".formatted(suffix, suffix)))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return JsonPath.read(res, "$.accessToken");
    }
}
