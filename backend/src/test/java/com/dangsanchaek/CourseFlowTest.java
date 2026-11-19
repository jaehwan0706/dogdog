package com.dangsanchaek;

import com.dangsanchaek.course.repository.ParkRepository;
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
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.allOf;
import static org.hamcrest.Matchers.everyItem;
import static org.hamcrest.Matchers.greaterThan;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.lessThan;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * 맞춤 산책 코스: 테스트용 공원 CSV(src/test/resources/data/city_parks_test.csv)와 시설 CSV 로 계산한다.
 * 공원 7행 중 중복 1행, 묘지공원 1행, 좌표 오류 1행이 빠져 4곳이 들어간다.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CourseFlowTest {

    private static final String HERE = "lat=37.5&lng=127.0";
    private static final String MY_ROUTES = "$.courses[?(@.type == 'MY_ROUTE')]";

    @Autowired
    MockMvc mvc;

    @Autowired
    ParkRepository parkRepository;

    @Test
    void 공원_데이터는_중복_묘지공원_좌표오류를_빼고_들어간다() {
        assertThat(parkRepository.findAll()).extracting("name")
                .containsExactlyInAnyOrder("강변수변공원", "꼬마어린이공원", "먼근린공원", "바로옆소공원");
    }

    @Test
    void 목표_시간에_맞는_주변_공원() throws Exception {
        String user = signup();
        // 30분 × 기본 속도 분당 50m = 1.5km
        mvc.perform(get("/recommendations/courses?" + HERE + "&minutes=30").header(HttpHeaders.AUTHORIZATION, "Bearer " + user))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.targetMinutes").value(30))
                .andExpect(jsonPath("$.targetMeters").value(1500))
                .andExpect(jsonPath("$.paceMetersPerMinute").value(50))
                // 약 670m 떨어진 수변공원이 왕복 1.5km 안팎이라 가장 위
                .andExpect(jsonPath("$.courses[0].type").value("PARK"))
                .andExpect(jsonPath("$.courses[0].title").value("강변수변공원"))
                .andExpect(jsonPath("$.courses[0].distanceMeters", allOf(greaterThan(1300), lessThan(1900))))
                .andExpect(jsonPath("$.courses[0].reasons", hasItem("평소 산책 거리와 비슷해요")))
                .andExpect(jsonPath("$.courses[0].reasons", hasItem("물가를 따라 걸을 수 있어요")))
                .andExpect(jsonPath("$.courses[0].convenience").value("화장실, 음수대"))
                .andExpect(jsonPath("$.courses[0].address").value("테스트시 강변로 1"))
                // 멀리 있는 공원은 후보가 아니고, 바로 붙은 두 공원 중에는 하나만
                .andExpect(jsonPath("$.courses[*].title", not(hasItem("먼근린공원"))))
                .andExpect(jsonPath("$.courses", hasSize(2)));

        // 10분(500m)이면 가까운 작은 공원이 위로, 주변 반려동물 시설도 함께
        mvc.perform(get("/recommendations/courses?" + HERE + "&minutes=10").header(HttpHeaders.AUTHORIZATION, "Bearer " + user))
                .andExpect(jsonPath("$.courses[0].title", not("강변수변공원")))
                .andExpect(jsonPath("$.courses[0].nearbyFacilities[0].category").exists());
    }

    @Test
    void 목표_거리_안에_공원이_없으면_넓혀서_먼_공원을_표시() throws Exception {
        String user = signup();
        // 37.53 에서 가장 가까운 공원은 약 2.7km 떨어진 강변수변공원 (10분 목표 500m 로는 닿지 않음)
        mvc.perform(get("/recommendations/courses?lat=37.53&lng=127.0&minutes=10").header(HttpHeaders.AUTHORIZATION, "Bearer " + user))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.courses[0].title").value("강변수변공원"))
                .andExpect(jsonPath("$.courses[0].reasons[0]").value("목표(500m)보다 먼 코스예요. 가까운 공원이 없어요"))
                .andExpect(jsonPath("$.courses[0].reasons", hasSize(lessThan(4))));
    }

    @Test
    void 전에_걸었던_길도_추천() throws Exception {
        String user = signup();
        // 지금 위치에서 북쪽으로 약 700m 갔다가 돌아온 산책 (약 1.4km)
        String started = mvc.perform(post("/walks/start").header(HttpHeaders.AUTHORIZATION, "Bearer " + user))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        int walkId = JsonPath.read(started, "$.id");
        String points = IntStream.rangeClosed(0, 12)
                .mapToObj(i -> "{\"seq\":%d,\"latitude\":%s,\"longitude\":127.0}".formatted(i, 37.5 + Math.min(i, 12 - i) * 0.00105))
                .collect(Collectors.joining(",", "{\"points\":[", "]}"));
        mvc.perform(patch("/walks/" + walkId + "/end").header(HttpHeaders.AUTHORIZATION, "Bearer " + user)
                .contentType(MediaType.APPLICATION_JSON).content(points)).andExpect(status().isOk());

        mvc.perform(get("/recommendations/courses?" + HERE + "&minutes=30").header(HttpHeaders.AUTHORIZATION, "Bearer " + user))
                .andExpect(status().isOk())
                .andExpect(jsonPath(MY_ROUTES + ".walkId", hasItem(walkId)))
                .andExpect(jsonPath(MY_ROUTES + ".path", everyItem(hasSize(13))));

        // 출발점에서 멀리 떨어진 곳에서는 내 경로를 추천하지 않는다
        mvc.perform(get("/recommendations/courses?lat=37.52&lng=127.0&minutes=30").header(HttpHeaders.AUTHORIZATION, "Bearer " + user))
                .andExpect(jsonPath(MY_ROUTES, hasSize(0)));
    }

    @Test
    void 로그인_필요_잘못된_값은_400() throws Exception {
        mvc.perform(get("/recommendations/courses?" + HERE)).andExpect(status().isUnauthorized());
        String user = signup();
        mvc.perform(get("/recommendations/courses?" + HERE + "&minutes=0").header(HttpHeaders.AUTHORIZATION, "Bearer " + user))
                .andExpect(status().isBadRequest());
        mvc.perform(get("/recommendations/courses?lat=100&lng=127.0").header(HttpHeaders.AUTHORIZATION, "Bearer " + user))
                .andExpect(status().isBadRequest());
        // 공원이 없는 곳이면 빈 목록, minutes 를 안 주면 평소 산책 시간(기록 없으면 30분)
        mvc.perform(get("/recommendations/courses?lat=35.1&lng=129.0").header(HttpHeaders.AUTHORIZATION, "Bearer " + user))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.targetMinutes").value(30))
                .andExpect(jsonPath("$.courses", hasSize(0)));
    }

    private String signup() throws Exception {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String res = mvc.perform(post("/auth/signup").contentType(MediaType.APPLICATION_JSON).content("""
                        {"email":"c%s@test.dev","password":"walk1234","nickname":"c%s"}""".formatted(suffix, suffix)))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return JsonPath.read(res, "$.accessToken");
    }
}
