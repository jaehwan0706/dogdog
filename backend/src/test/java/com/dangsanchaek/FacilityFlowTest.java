package com.dangsanchaek;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * 친화시설: 테스트용 CSV(src/test/resources/data/pet_facilities_test.csv) 가 시작 시 들어가고,
 * 로그인 없이 지도 범위·분류·검색·상세를 조회한다.
 * CSV 8행 중 중복 1행, 동반 불가(N) 1행, 모르는 분류 1행은 빠져서 5곳이 들어간다.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class FacilityFlowTest {

    // 테스트 데이터가 모여 있는 곳 (37.50, 127.00) 주변 약 2km
    private static final String NEAR = "swLat=37.49&swLng=126.99&neLat=37.51&neLng=127.01";

    @Autowired
    MockMvc mvc;

    @Test
    void 지도_범위_안의_시설을_가까운_순으로_조회() throws Exception {
        mvc.perform(get("/facilities?" + NEAR))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.truncated").value(false))
                // 중복 행은 한 번만, 동반 불가·모르는 분류·범위 밖(먼병원, 부산카페)은 빠진다
                .andExpect(jsonPath("$.facilities[*].name", contains("댕댕카페", "멍멍식당", "튼튼동물병원")))
                .andExpect(jsonPath("$.facilities[0].category").value("CAFE"))
                .andExpect(jsonPath("$.facilities[0].categoryLabel").value("카페"))
                .andExpect(jsonPath("$.facilities[0].address").value("테스트시 카페로 1"))
                // 도로명주소가 없으면 지번주소
                .andExpect(jsonPath("$.facilities[1].address").value("테스트시 지번 1"));

        mvc.perform(get("/facilities?" + NEAR + "&categories=HOSPITAL,RESTAURANT"))
                .andExpect(jsonPath("$.facilities[*].name", contains("멍멍식당", "튼튼동물병원")));

        mvc.perform(get("/facilities?" + NEAR + "&limit=1"))
                .andExpect(jsonPath("$.facilities", hasSize(1)))
                .andExpect(jsonPath("$.truncated").value(true));
    }

    @Test
    void 너무_넓은_범위나_잘못된_값은_400() throws Exception {
        mvc.perform(get("/facilities?swLat=33&swLng=124&neLat=38&neLng=130"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_INPUT"));
        mvc.perform(get("/facilities?swLat=37.51&swLng=126.99&neLat=37.49&neLng=127.01"))
                .andExpect(status().isBadRequest());
        mvc.perform(get("/facilities?" + NEAR + "&categories=UNKNOWN"))
                .andExpect(status().isBadRequest());
        mvc.perform(get("/facilities?swLat=37.49"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void 이름_검색은_기준_위치에서_가까운_순() throws Exception {
        mvc.perform(get("/facilities/search?q=병원&lat=37.5&lng=127.0"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].name", contains("튼튼동물병원", "먼병원")));
        mvc.perform(get("/facilities/search?q=카페&lat=35.1&lng=129.0"))
                .andExpect(jsonPath("$[*].name", contains("부산카페", "댕댕카페")));
        mvc.perform(get("/facilities/search?q=%25&lat=37.5&lng=127.0"))
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void 시설_상세() throws Exception {
        String list = mvc.perform(get("/facilities?" + NEAR + "&categories=CAFE"))
                .andReturn().getResponse().getContentAsString();
        int id = JsonPath.read(list, "$.facilities[0].id");

        mvc.perform(get("/facilities/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("댕댕카페"))
                .andExpect(jsonPath("$.homepage").value("https://example.com/cafe"))
                .andExpect(jsonPath("$.phone").value("02-000-0000"))
                .andExpect(jsonPath("$.openingHours").value("매일 09:00~18:00"))
                .andExpect(jsonPath("$.parking").value(true))
                .andExpect(jsonPath("$.indoor").value(true))
                .andExpect(jsonPath("$.outdoor").value(false))
                .andExpect(jsonPath("$.petSize").value("모두 가능"))
                .andExpect(jsonPath("$.petRestrictions").value("목줄, 배변봉투"))
                .andExpect(jsonPath("$.petExtraFee").value("없음"))
                .andExpect(jsonPath("$.sourceUpdatedAt").value("2025-03-24"));

        // "정보없음" 은 null
        String hospital = mvc.perform(get("/facilities?" + NEAR + "&categories=HOSPITAL"))
                .andReturn().getResponse().getContentAsString();
        int hospitalId = JsonPath.read(hospital, "$.facilities[0].id");
        mvc.perform(get("/facilities/" + hospitalId)).andExpect(jsonPath("$.homepage").doesNotExist());

        mvc.perform(get("/facilities/999999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("FACILITY_NOT_FOUND"));
    }
}
