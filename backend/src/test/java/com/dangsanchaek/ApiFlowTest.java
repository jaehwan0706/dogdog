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
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * H2(MySQL 모드) + Flyway 마이그레이션 + Hibernate 스키마 검증 위에서 실제 API 흐름을 검증한다.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ApiFlowTest {

    @Autowired
    MockMvc mvc;

    // ======================== 인증 ========================

    @Test
    void 이메일_회원가입_로그인_토큰재발급_로그아웃() throws Exception {
        String email = uniqueEmail();
        String body = """
                {"email":"%s","password":"walk1234","nickname":"%s"}""".formatted(email, uniqueNick());

        String signup = call(post("/auth/signup"), null, body).andExpect(status().isCreated())
                .andExpect(jsonPath("$.isNewUser").value(true))
                .andExpect(jsonPath("$.user.provider").value("LOCAL"))
                .andReturn().getResponse().getContentAsString();

        // 이메일 중복
        call(post("/auth/signup"), null, body).andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("EMAIL_ALREADY_EXISTS"));
        call(get("/auth/check-email?email=" + email), null, null).andExpect(jsonPath("$.available").value(false));
        // 비밀번호 규칙 위반
        call(post("/auth/signup"), null, """
                {"email":"%s","password":"short","nickname":"%s"}""".formatted(uniqueEmail(), uniqueNick()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("password"));

        // 로그인 (이메일 대소문자 무시)
        call(post("/auth/login"), null, """
                {"email":"%s","password":"walk1234"}""".formatted(email.toUpperCase()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.isNewUser").value(false));
        call(post("/auth/login"), null, """
                {"email":"%s","password":"wrong1234"}""".formatted(email))
                .andExpect(status().isUnauthorized()).andExpect(jsonPath("$.code").value("INVALID_CREDENTIALS"));

        // 토큰 없이 / 잘못된 토큰으로 보호 API
        call(get("/users/me"), null, null).andExpect(status().isUnauthorized());
        call(get("/users/me"), "not-a-jwt", null).andExpect(status().isUnauthorized());
        String access = JsonPath.read(signup, "$.accessToken");
        call(get("/users/me"), access, null).andExpect(status().isOk()).andExpect(jsonPath("$.email").value(email));

        // 리프레시 토큰 회전: 새 토큰 발급, 이전 토큰 재사용 불가
        String refresh = JsonPath.read(signup, "$.refreshToken");
        String refreshed = call(post("/auth/refresh"), null, "{\"refreshToken\":\"" + refresh + "\"}")
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        call(post("/auth/refresh"), null, "{\"refreshToken\":\"" + refresh + "\"}")
                .andExpect(status().isUnauthorized());

        // 로그아웃 후 해당 리프레시 토큰 무효
        String refresh2 = JsonPath.read(refreshed, "$.refreshToken");
        call(post("/auth/logout"), null, "{\"refreshToken\":\"" + refresh2 + "\"}").andExpect(status().isNoContent());
        call(post("/auth/refresh"), null, "{\"refreshToken\":\"" + refresh2 + "\"}")
                .andExpect(status().isUnauthorized());
    }

    @Test
    void 소셜로그인_mock_신규가입후_재로그인_이메일충돌_탈퇴() throws Exception {
        String kakaoId = UUID.randomUUID().toString();
        String email = uniqueEmail();

        String first = call(post("/auth/social/kakao"), null, """
                {"token":"mock:%s:%s","nickname":"초코맘"}""".formatted(kakaoId, email))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isNewUser").value(true))
                .andExpect(jsonPath("$.user.provider").value("KAKAO"))
                .andReturn().getResponse().getContentAsString();
        call(post("/auth/social/kakao"), null, "{\"token\":\"mock:%s:%s\"}".formatted(kakaoId, email))
                .andExpect(status().isOk()).andExpect(jsonPath("$.isNewUser").value(false));

        // 같은 이메일로 다른 소셜 가입 시도 → 409
        call(post("/auth/social/apple"), null, "{\"token\":\"mock:apple-%s:%s\"}".formatted(kakaoId, email))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("EMAIL_REGISTERED_WITH_OTHER_PROVIDER"));
        // 이메일 없는 Apple 가입은 닉네임 자동 생성
        call(post("/auth/social/apple"), null, "{\"token\":\"mock:apple-" + UUID.randomUUID() + "\"}")
                .andExpect(status().isOk()).andExpect(jsonPath("$.user.nickname").isNotEmpty());
        // 미지원 provider / 실제 검증 실패 토큰
        call(post("/auth/social/facebook"), null, "{\"token\":\"mock:1\"}").andExpect(status().isBadRequest());
        call(post("/auth/social/google"), null, "{\"token\":\"invalid.id.token\"}")
                .andExpect(status().isUnauthorized()).andExpect(jsonPath("$.code").value("INVALID_SOCIAL_TOKEN"));

        // 탈퇴
        String access = JsonPath.read(first, "$.accessToken");
        call(delete("/users/me"), access, null).andExpect(status().isNoContent());
        call(get("/users/me"), access, null).andExpect(status().isNotFound());
        // 탈퇴 후 같은 소셜 계정은 신규 가입으로 처리
        call(post("/auth/social/kakao"), null, "{\"token\":\"mock:%s:%s\"}".formatted(kakaoId, email))
                .andExpect(status().isOk()).andExpect(jsonPath("$.isNewUser").value(true));
    }

    // ======================== 반려견 ========================

    @Test
    void 반려견_등록_조회_수정_삭제_및_타인접근차단() throws Exception {
        String owner = signup();
        String other = signup();

        String created = call(post("/dogs"), owner, """
                {"name":"초코","breed":"푸들","gender":"MALE","birthDate":"2021-03-15","weightKg":4.2,"neutered":true}""")
                .andExpect(status().isCreated()).andExpect(jsonPath("$.name").value("초코"))
                .andReturn().getResponse().getContentAsString();
        Integer dogId = JsonPath.read(created, "$.id");

        call(get("/dogs"), owner, null).andExpect(jsonPath("$", hasSize(1)));
        call(patch("/dogs/" + dogId), owner, "{\"weightKg\":4.5}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.weightKg").value(4.5))
                .andExpect(jsonPath("$.breed").value("푸들"));
        call(get("/dogs/" + dogId), other, null).andExpect(status().isNotFound());
        call(post("/dogs"), owner, "{\"name\":\"\"}").andExpect(status().isBadRequest());
        call(delete("/dogs/" + dogId), owner, null).andExpect(status().isNoContent());
        call(get("/dogs"), owner, null).andExpect(jsonPath("$", hasSize(0)));
    }

    // ======================== 커뮤니티 ========================

    @Test
    void 게시글_좋아요_댓글_답글() throws Exception {
        String author = signup();
        String reader = signup();

        String post = call(post("/posts"), author, """
                {"category":"FREE","title":"첫 산책","content":"한강 산책 다녀왔어요","imageUrls":["https://img/1.jpg"]}""")
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        Integer postId = JsonPath.read(post, "$.id");

        // 비로그인 목록/상세 허용
        call(get("/posts?category=FREE"), null, null).andExpect(status().isOk());
        call(get("/posts/" + postId), null, null).andExpect(status().isOk())
                .andExpect(jsonPath("$.imageUrls[0]").value("https://img/1.jpg"));
        // 비로그인 작성 불가
        call(post("/posts"), null, "{\"category\":\"FREE\",\"title\":\"x\",\"content\":\"y\"}")
                .andExpect(status().isUnauthorized());

        // 좋아요 (멱등)
        call(post("/posts/" + postId + "/likes"), reader, null).andExpect(jsonPath("$.likeCount").value(1));
        call(post("/posts/" + postId + "/likes"), reader, null).andExpect(jsonPath("$.likeCount").value(1));
        call(get("/posts/" + postId), reader, null).andExpect(jsonPath("$.likedByMe").value(true));
        call(get("/posts"), reader, null).andExpect(status().isOk());
        call(delete("/posts/" + postId + "/likes"), reader, null).andExpect(jsonPath("$.likeCount").value(0));

        // 댓글 + 답글
        String comment = call(post("/posts/" + postId + "/comments"), reader, "{\"content\":\"귀여워요\"}")
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        Integer commentId = JsonPath.read(comment, "$.id");
        String reply = call(post("/posts/" + postId + "/comments"), author,
                "{\"content\":\"감사합니다\",\"parentId\":" + commentId + "}")
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        Integer replyId = JsonPath.read(reply, "$.id");
        // 답글의 답글 불가
        call(post("/posts/" + postId + "/comments"), reader, "{\"content\":\"x\",\"parentId\":" + replyId + "}")
                .andExpect(status().isBadRequest());
        call(get("/posts/" + postId + "/comments"), null, null)
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].replies", hasSize(1)));
        call(get("/posts/" + postId), null, null).andExpect(jsonPath("$.commentCount").value(2));

        // 남의 댓글 수정 불가, 본인 삭제 → 답글이 있으니 "삭제된 댓글" 로 남음
        call(patch("/comments/" + commentId), author, "{\"content\":\"hack\"}").andExpect(status().isForbidden());
        call(delete("/comments/" + commentId), reader, null).andExpect(status().isNoContent());
        call(get("/posts/" + postId + "/comments"), null, null)
                .andExpect(jsonPath("$[0].deleted").value(true))
                .andExpect(jsonPath("$[0].replies", hasSize(1)));

        // 남의 글 수정/삭제 불가, 본인 삭제 가능
        call(patch("/posts/" + postId), reader, "{\"title\":\"hack\"}").andExpect(status().isForbidden());
        call(patch("/posts/" + postId), author, "{\"title\":\"수정된 제목\"}")
                .andExpect(jsonPath("$.title").value("수정된 제목"));
        call(delete("/posts/" + postId), author, null).andExpect(status().isNoContent());
        call(get("/posts/" + postId), null, null).andExpect(status().isNotFound());
    }

    @Test
    void 산책친구모집_품앗이_참여신청_정원_마감() throws Exception {
        String author = signup();
        String user1 = signup();
        String user2 = signup();
        String meetAt = LocalDateTime.now().plusDays(1).withNano(0).toString();

        // 모집 필수값 누락
        call(post("/posts"), author, "{\"category\":\"WALK_MATE\",\"title\":\"산책 같이해요\",\"content\":\"저녁\"}")
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("RECRUIT_FIELDS_REQUIRED"));

        String post = call(post("/posts"), author, """
                {"category":"WALK_MATE","title":"산책 같이해요","content":"저녁 7시 한강",
                 "meetAt":"%s","placeName":"여의도 한강공원","latitude":37.528,"longitude":126.933,"maxParticipants":1}"""
                .formatted(meetAt))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.recruit.status").value("OPEN"))
                .andReturn().getResponse().getContentAsString();
        Integer postId = JsonPath.read(post, "$.id");

        call(post("/posts/" + postId + "/participants"), author, null).andExpect(status().isBadRequest());
        call(post("/posts/" + postId + "/participants"), user1, null)
                .andExpect(status().isOk()).andExpect(jsonPath("$.participantCount").value(1));
        call(post("/posts/" + postId + "/participants"), user1, null).andExpect(status().isConflict());
        call(post("/posts/" + postId + "/participants"), user2, null)
                .andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("RECRUIT_FULL"));
        call(get("/posts/" + postId + "/participants"), null, null).andExpect(jsonPath("$", hasSize(1)));
        call(get("/posts?category=WALK_MATE&recruitStatus=OPEN"), null, null).andExpect(status().isOk());

        // 참여 취소 → 자리 남 → 작성자가 마감하면 신청 불가
        call(delete("/posts/" + postId + "/participants"), user1, null)
                .andExpect(jsonPath("$.participantCount").value(0));
        call(patch("/posts/" + postId + "/recruit-status"), user1, "{\"status\":\"CLOSED\"}")
                .andExpect(status().isForbidden());
        call(patch("/posts/" + postId + "/recruit-status"), author, "{\"status\":\"CLOSED\"}")
                .andExpect(jsonPath("$.status").value("CLOSED"));
        call(post("/posts/" + postId + "/participants"), user2, null)
                .andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("RECRUIT_CLOSED"));

        // 품앗이도 동일하게 동작, 자유글에는 참여 불가
        call(post("/posts"), author, """
                {"category":"CARE_SHARE","title":"주말 돌봄 품앗이","content":"서로 봐줘요","meetAt":"%s","maxParticipants":3}"""
                .formatted(meetAt)).andExpect(status().isCreated());
        String free = call(post("/posts"), author, "{\"category\":\"FREE\",\"title\":\"t\",\"content\":\"c\"}")
                .andReturn().getResponse().getContentAsString();
        call(post("/posts/" + JsonPath.read(free, "$.id") + "/participants"), user2, null)
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("NOT_RECRUIT_POST"));
    }

    // ======================== 마켓 ========================

    @Test
    void 상품_장바구니_주문_결제_취소_재고() throws Exception {
        String admin = signupAs("admin@test.dev");
        String user = signup();

        // 상품 등록은 관리자만
        String productBody = """
                {"name":"연어 사료 2kg","category":"FOOD","price":32000,"stock":5}""";
        call(post("/admin/products"), user, productBody).andExpect(status().isForbidden());
        String product = call(post("/admin/products"), admin, productBody)
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        Integer productId = JsonPath.read(product, "$.id");
        String snack = call(post("/admin/products"), admin, """
                {"name":"닭가슴살 육포","category":"SNACK","price":8900,"stock":1}""")
                .andReturn().getResponse().getContentAsString();
        Integer snackId = JsonPath.read(snack, "$.id");

        call(get("/products?category=FOOD"), null, null).andExpect(status().isOk());
        call(get("/products/" + productId), null, null).andExpect(jsonPath("$.stock").value(5));

        // 장바구니: 같은 상품은 수량 합산, 재고 초과 불가
        call(post("/cart/items"), user, "{\"productId\":" + productId + ",\"quantity\":1}").andExpect(status().isOk());
        String cart = call(post("/cart/items"), user, "{\"productId\":" + productId + ",\"quantity\":1}")
                .andExpect(jsonPath("$.items", hasSize(1)))
                .andExpect(jsonPath("$.items[0].quantity").value(2))
                .andExpect(jsonPath("$.totalAmount").value(64000))
                .andReturn().getResponse().getContentAsString();
        call(post("/cart/items"), user, "{\"productId\":" + productId + ",\"quantity\":10}")
                .andExpect(status().isConflict());
        Integer cartItemId = JsonPath.read(cart, "$.items[0].cartItemId");

        // 장바구니 주문 → 재고 차감, 장바구니 비움
        String address = "\"receiverName\":\"홍길동\",\"receiverPhone\":\"010-1234-5678\",\"zipCode\":\"04524\",\"address\":\"서울시 중구\"";
        String order = call(post("/orders"), user, "{\"cartItemIds\":[" + cartItemId + "]," + address + "}")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("PENDING_PAYMENT"))
                .andExpect(jsonPath("$.totalAmount").value(64000))
                .andReturn().getResponse().getContentAsString();
        String orderNo = JsonPath.read(order, "$.orderNo");
        call(get("/products/" + productId), null, null).andExpect(jsonPath("$.stock").value(3));
        call(get("/cart"), user, null).andExpect(jsonPath("$.items", hasSize(0)));

        // 결제: 금액 위변조 거부 → 정상 승인 → 중복 승인 거부
        call(post("/orders/" + orderNo + "/payments/confirm"), user, "{\"paymentKey\":\"pk_test\",\"amount\":100}")
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("PAYMENT_AMOUNT_MISMATCH"));
        call(post("/orders/" + orderNo + "/payments/confirm"), user, "{\"paymentKey\":\"pk_test\",\"amount\":64000}")
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("PAID"));
        call(post("/orders/" + orderNo + "/payments/confirm"), user, "{\"paymentKey\":\"pk_test\",\"amount\":64000}")
                .andExpect(status().isConflict());
        // 남의 주문 조회 불가
        call(get("/orders/" + orderNo), admin, null).andExpect(status().isNotFound());

        // 취소 → 재고 복구
        call(post("/orders/" + orderNo + "/cancel"), user, "{\"reason\":\"단순 변심\"}")
                .andExpect(jsonPath("$.status").value("CANCELLED"));
        call(get("/products/" + productId), null, null).andExpect(jsonPath("$.stock").value(5));

        // 바로구매: 여러 상품 중 하나라도 재고 부족이면 전체 실패, 재고 부분 차감 없음
        call(post("/orders"), user, "{\"items\":[{\"productId\":" + productId + ",\"quantity\":2},{\"productId\":"
                + snackId + ",\"quantity\":2}]," + address + "}")
                .andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("OUT_OF_STOCK"));
        call(get("/products/" + productId), null, null).andExpect(jsonPath("$.stock").value(5));

        // items 와 cartItemIds 둘 다 없음 → 400
        call(post("/orders"), user, "{" + address + "}").andExpect(status().isBadRequest());
        call(get("/orders"), user, null).andExpect(jsonPath("$.content", hasSize(1)));
    }

    // ======================== helpers ========================

    private ResultActions call(MockHttpServletRequestBuilder req, String token, String body) throws Exception {
        if (token != null) req.header(HttpHeaders.AUTHORIZATION, "Bearer " + token);
        if (body != null) req.contentType(MediaType.APPLICATION_JSON).content(body);
        return mvc.perform(req);
    }

    private String signup() throws Exception {
        return signupAs(uniqueEmail());
    }

    private String signupAs(String email) throws Exception {
        String res = call(post("/auth/signup"), null, """
                {"email":"%s","password":"walk1234","nickname":"%s"}""".formatted(email, uniqueNick()))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return JsonPath.read(res, "$.accessToken");
    }

    private static String uniqueEmail() {
        return "u" + UUID.randomUUID().toString().substring(0, 8) + "@test.dev";
    }

    private static String uniqueNick() {
        return "n" + UUID.randomUUID().toString().substring(0, 8);
    }
}
