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
import org.springframework.test.web.servlet.request.AbstractMockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.request.MockMultipartHttpServletRequestBuilder;

import java.util.UUID;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.startsWith;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * 사진 핀: multipart 업로드 → 서명 URL 로 사진 조회 → 본인만 조회/삭제 → 탈퇴 시 정리.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PhotoPinFlowTest {

    private static final byte[] JPEG = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 1, 2, 3};

    @Autowired
    MockMvc mvc;

    @Test
    void 사진핀_생성_조회_사진다운로드_삭제() throws Exception {
        String owner = signup();
        String other = signup();

        String created = upload(owner, image("image/jpeg"), "37.5446", "127.0378", "  서울숲 산책  ")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.latitude").value(37.5446))
                .andExpect(jsonPath("$.memo").value("서울숲 산책"))
                .andExpect(jsonPath("$.walkId").doesNotExist())
                .andExpect(jsonPath("$.imageUrl").value(startsWith("/files/photo-pins/")))
                .andReturn().getResponse().getContentAsString();
        Integer pinId = JsonPath.read(created, "$.id");
        String imageUrl = JsonPath.read(created, "$.imageUrl");

        // 서명된 URL 은 토큰 없이 열린다
        mvc.perform(get(imageUrl)).andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CONTENT_TYPE, "image/jpeg"))
                .andExpect(content().bytes(JPEG));
        // 서명 변조 / 서명 없음 / 다른 파일 key 로 서명 재사용 → 404
        mvc.perform(get(imageUrl.replace("signature=", "signature=X"))).andExpect(status().isNotFound());
        mvc.perform(get(imageUrl.substring(0, imageUrl.indexOf('?')))).andExpect(status().isBadRequest());
        mvc.perform(get(imageUrl.replaceAll("photo-pins/[^?]+\\.jpg",
                "photo-pins/" + UUID.randomUUID() + ".jpg"))).andExpect(status().isNotFound());
        // 만료된 URL → 404
        mvc.perform(get(imageUrl.replaceAll("expires=\\d+", "expires=1"))).andExpect(status().isNotFound());

        // 목록은 본인 것만
        call(get("/photo-pins"), owner).andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id").value(pinId));
        call(get("/photo-pins"), other).andExpect(jsonPath("$", hasSize(0)));
        call(get("/photo-pins"), null).andExpect(status().isUnauthorized());

        // 다른 사람 핀 삭제 → 404, 본인 삭제 → 204 후 사진도 사라짐
        call(delete("/photo-pins/" + pinId), other).andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("PHOTO_PIN_NOT_FOUND"));
        call(delete("/photo-pins/" + pinId), owner).andExpect(status().isNoContent());
        call(get("/photo-pins"), owner).andExpect(jsonPath("$", hasSize(0)));
        mvc.perform(get(imageUrl)).andExpect(status().isNotFound());
    }

    @Test
    void 사진핀_입력값_검증() throws Exception {
        String user = signup();

        // 사진 없음
        call(multipart("/photo-pins").param("latitude", "37.5").param("longitude", "127.0"), user)
                .andExpect(status().isBadRequest());
        // 빈 파일 / 이미지가 아닌 파일
        upload(user, new MockMultipartFile("image", "a.jpg", "image/jpeg", new byte[0]), "37.5", "127.0", null)
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("IMAGE_REQUIRED"));
        upload(user, image("application/pdf"), "37.5", "127.0", null)
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("UNSUPPORTED_IMAGE_TYPE"));
        // 좌표 범위 / 누락
        upload(user, image("image/png"), "91", "127.0", null)
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.errors[0].field").value("latitude"));
        upload(user, image("image/png"), null, "127.0", null)
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.errors[0].field").value("latitude"));
        // 토큰 없음
        upload(null, image("image/png"), "37.5", "127.0", null).andExpect(status().isUnauthorized());

        call(get("/photo-pins"), user).andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void 탈퇴하면_사진핀과_사진이_정리된다() throws Exception {
        String user = signup();
        String created = upload(user, image("image/jpeg"), "37.5", "127.0", null)
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        String imageUrl = JsonPath.read(created, "$.imageUrl");

        call(delete("/users/me"), user).andExpect(status().isNoContent());
        mvc.perform(get(imageUrl)).andExpect(status().isNotFound());
    }

    // ======================== helpers ========================

    private ResultActions upload(String token, MockMultipartFile image, String lat, String lng, String memo)
            throws Exception {
        MockMultipartHttpServletRequestBuilder req = multipart("/photo-pins").file(image);
        if (lat != null) req.param("latitude", lat);
        if (lng != null) req.param("longitude", lng);
        if (memo != null) req.param("memo", memo);
        return call(req, token);
    }

    private ResultActions call(AbstractMockHttpServletRequestBuilder<?> req, String token) throws Exception {
        if (token != null) req.header(HttpHeaders.AUTHORIZATION, "Bearer " + token);
        return mvc.perform(req);
    }

    private static MockMultipartFile image(String contentType) {
        return new MockMultipartFile("image", "photo", contentType, JPEG);
    }

    private String signup() throws Exception {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String res = mvc.perform(post("/auth/signup").contentType(MediaType.APPLICATION_JSON).content("""
                        {"email":"p%s@test.dev","password":"walk1234","nickname":"p%s"}""".formatted(suffix, suffix)))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return JsonPath.read(res, "$.accessToken");
    }
}
