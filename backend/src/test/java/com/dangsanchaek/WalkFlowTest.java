package com.dangsanchaek;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.time.LocalDate;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import static org.hamcrest.Matchers.allOf;
import static org.hamcrest.Matchers.greaterThan;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.lessThan;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * 산책 기록: 시작 → 좌표 묶음 전송(재전송 포함) → 종료 → 목록/상세 → 삭제, 사진 핀 연결, 탈퇴 정리.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class WalkFlowTest {

    @Autowired
    MockMvc mvc;

    @Test
    void 산책_시작_좌표전송_종료_조회() throws Exception {
        String user = signup();
        int dogId = createDog(user, "콩이");

        String started = json(post("/walks/start"), user, "{\"dogId\":%d}".formatted(dogId))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("IN_PROGRESS"))
                .andExpect(jsonPath("$.dogName").value("콩이"))
                .andExpect(jsonPath("$.distanceMeters").value(0))
                .andReturn().getResponse().getContentAsString();
        int walkId = JsonPath.read(started, "$.id");

        // 진행 중에는 새로 시작할 수 없고, current 로 이어받는다
        call(post("/walks/start"), user).andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("WALK_ALREADY_IN_PROGRESS"));

        // 위도 0.001도 ≈ 111m. 같은 묶음 재전송·순서 뒤섞임은 한 번만 저장된다
        String batch1 = points(point(0, 37.5000), point(1, 37.5010));
        json(post("/walks/" + walkId + "/points"), user, batch1).andExpect(status().isOk())
                .andExpect(jsonPath("$.lastSeq").value(1));
        json(post("/walks/" + walkId + "/points"), user, batch1).andExpect(jsonPath("$.lastSeq").value(1));
        json(post("/walks/" + walkId + "/points"), user, points(point(3, 37.5030), point(2, 37.5020)))
                .andExpect(jsonPath("$.lastSeq").value(3));

        call(get("/walks/current"), user).andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(walkId))
                .andExpect(jsonPath("$.points", hasSize(4)));

        // 종료 시 남은 좌표를 함께 보낸다 → 총 5개, 약 444m
        json(patch("/walks/" + walkId + "/end"), user, points(point(4, 37.5040)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("FINISHED"))
                .andExpect(jsonPath("$.endedAt").exists())
                .andExpect(jsonPath("$.distanceMeters", allOf(greaterThan(440), lessThan(450))))
                .andExpect(jsonPath("$.points", hasSize(5)))
                .andExpect(jsonPath("$.points[2].seq").value(2));

        // 종료 후에는 좌표 추가·재종료 불가, 진행 중 산책 없음
        json(post("/walks/" + walkId + "/points"), user, points(point(5, 37.5050)))
                .andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("WALK_ALREADY_FINISHED"));
        call(patch("/walks/" + walkId + "/end"), user).andExpect(status().isConflict());
        call(get("/walks/current"), user).andExpect(status().isNoContent());

        // 목록 (기본 최근 30일 / 기간 지정)
        call(get("/users/me/walks"), user).andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id").value(walkId))
                .andExpect(jsonPath("$[0].points").doesNotExist());
        String today = LocalDate.now().toString();
        String yesterday = LocalDate.now().minusDays(1).toString();
        call(get("/users/me/walks?from=" + today + "&to=" + today), user).andExpect(jsonPath("$", hasSize(1)));
        call(get("/users/me/walks?from=" + yesterday + "&to=" + yesterday), user).andExpect(jsonPath("$", hasSize(0)));
        call(get("/users/me/walks?from=" + today + "&to=" + yesterday), user).andExpect(status().isBadRequest());

        call(get("/walks/" + walkId), user).andExpect(status().isOk()).andExpect(jsonPath("$.points", hasSize(5)));

        // 다음 산책은 새로 시작할 수 있다
        call(post("/walks/start"), user).andExpect(status().isCreated()).andExpect(jsonPath("$.dogId").doesNotExist());
    }

    @Test
    void 다른_사람의_산책과_반려견은_접근할_수_없다() throws Exception {
        String owner = signup();
        String other = signup();
        int otherDog = createDog(other, "남의개");

        json(post("/walks/start"), owner, "{\"dogId\":%d}".formatted(otherDog))
                .andExpect(status().isNotFound()).andExpect(jsonPath("$.code").value("DOG_NOT_FOUND"));

        int walkId = JsonPath.read(call(post("/walks/start"), owner).andReturn().getResponse().getContentAsString(), "$.id");
        json(post("/walks/" + walkId + "/points"), other, points(point(0, 37.5)))
                .andExpect(status().isNotFound()).andExpect(jsonPath("$.code").value("WALK_NOT_FOUND"));
        call(patch("/walks/" + walkId + "/end"), other).andExpect(status().isNotFound());
        call(get("/walks/" + walkId), other).andExpect(status().isNotFound());
        call(delete("/walks/" + walkId), other).andExpect(status().isNotFound());
        call(get("/users/me/walks"), null).andExpect(status().isUnauthorized());
    }

    @Test
    void 좌표_입력값_검증() throws Exception {
        String user = signup();
        int walkId = JsonPath.read(call(post("/walks/start"), user).andReturn().getResponse().getContentAsString(), "$.id");

        json(post("/walks/" + walkId + "/points"), user, "{\"points\":[{\"seq\":0,\"latitude\":91,\"longitude\":127}]}")
                .andExpect(status().isBadRequest());
        json(post("/walks/" + walkId + "/points"), user, "{\"points\":[{\"seq\":-1,\"latitude\":37,\"longitude\":127}]}")
                .andExpect(status().isBadRequest());
        json(post("/walks/" + walkId + "/points"), user, "{}").andExpect(status().isBadRequest());
        String tooMany = IntStream.range(0, 501).mapToObj(i -> point(i, 37.5)).collect(Collectors.joining(","));
        json(post("/walks/" + walkId + "/points"), user, "{\"points\":[" + tooMany + "]}")
                .andExpect(status().isBadRequest());

        // 좌표가 하나도 없어도 종료는 된다 (거리 0)
        call(patch("/walks/" + walkId + "/end"), user).andExpect(status().isOk())
                .andExpect(jsonPath("$.distanceMeters").value(0));
    }

    @Test
    void 산책_중_사진핀_연결과_산책_삭제() throws Exception {
        String user = signup();
        String other = signup();
        int walkId = JsonPath.read(call(post("/walks/start"), user).andReturn().getResponse().getContentAsString(), "$.id");

        uploadPin(user, walkId).andExpect(status().isCreated()).andExpect(jsonPath("$.walkId").value(walkId));
        // 남의 산책 / 없는 산책에는 핀을 연결할 수 없다
        uploadPin(other, walkId).andExpect(status().isNotFound()).andExpect(jsonPath("$.code").value("WALK_NOT_FOUND"));
        uploadPin(user, 999_999).andExpect(status().isNotFound());

        // 산책을 지워도(진행 중 취소 포함) 사진 핀은 남고 연결만 끊긴다
        call(delete("/walks/" + walkId), user).andExpect(status().isNoContent());
        call(get("/walks/" + walkId), user).andExpect(status().isNotFound());
        call(get("/photo-pins"), user).andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].walkId").doesNotExist());
        call(post("/walks/start"), user).andExpect(status().isCreated());
    }

    @Test
    void 탈퇴하면_산책_기록이_정리된다() throws Exception {
        String user = signup();
        int walkId = JsonPath.read(call(post("/walks/start"), user).andReturn().getResponse().getContentAsString(), "$.id");
        json(post("/walks/" + walkId + "/points"), user, points(point(0, 37.5), point(1, 37.501)))
                .andExpect(status().isOk());
        uploadPin(user, walkId).andExpect(status().isCreated());

        call(delete("/users/me"), user).andExpect(status().isNoContent());
    }

    // ======================== helpers ========================

    private static String point(int seq, double lat) {
        return "{\"seq\":%d,\"latitude\":%s,\"longitude\":127.0}".formatted(seq, lat);
    }

    private static String points(String... points) {
        return "{\"points\":[" + String.join(",", points) + "]}";
    }

    private ResultActions uploadPin(String token, int walkId) throws Exception {
        MockMultipartFile image = new MockMultipartFile("image", "photo", "image/jpeg",
                new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 1});
        return mvc.perform(multipart("/photo-pins").file(image)
                .param("latitude", "37.5").param("longitude", "127.0").param("walkId", String.valueOf(walkId))
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token));
    }

    private ResultActions json(MockHttpServletRequestBuilder req, String token, String body) throws Exception {
        return call(req.contentType(MediaType.APPLICATION_JSON).content(body), token);
    }

    private ResultActions call(MockHttpServletRequestBuilder req, String token) throws Exception {
        if (token != null) req.header(HttpHeaders.AUTHORIZATION, "Bearer " + token);
        return mvc.perform(req);
    }

    private int createDog(String token, String name) throws Exception {
        String res = json(post("/dogs"), token, "{\"name\":\"%s\"}".formatted(name))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return JsonPath.read(res, "$.id");
    }

    private String signup() throws Exception {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String res = mvc.perform(post("/auth/signup").contentType(MediaType.APPLICATION_JSON).content("""
                        {"email":"w%s@test.dev","password":"walk1234","nickname":"w%s"}""".formatted(suffix, suffix)))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return JsonPath.read(res, "$.accessToken");
    }
}
