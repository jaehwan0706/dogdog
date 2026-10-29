# 댕산책 백엔드 (Spring Boot 4.1 / Java 21 / MySQL 8)

인증(이메일·카카오·구글·네이버·Apple) · 반려견 · 커뮤니티(게시글/댓글/좋아요/친구모집/품앗이) · 애완용품 마켓(상품/장바구니/주문·결제) API.

## 1. 실행

### MySQL로 실행 (기본, `local` 프로필)
1. `src/main/resources/application-local.yml.example` 을 `application-local.yml` 로 복사 (git 에 안 올라감)
2. `spring.datasource.password` 를 **본인 MySQL root 비밀번호**로 수정 (DB `dangsanchaek` 는 자동 생성됨)
3. 실행
   ```bash
   cd backend
   ./gradlew bootRun        # Windows: .\gradlew.bat bootRun
   ```
4. 기동 시 Flyway가 `db/migration/V1__init_schema.sql` 로 테이블을 만들고, `db/seed` 의 샘플 상품 8개를 넣습니다.

### MySQL 없이 바로 실행 (H2 메모리 DB, 재시작하면 데이터 초기화)
```bash
./gradlew bootTestRun --args="--spring.profiles.active=test --app.admin.emails=admin@dangsanchaek.dev"
```

### 자동 테스트
```bash
./gradlew test     # 결과 리포트: build/reports/tests/test/index.html
```

## 2. Postman 으로 확인하기
1. Postman → **Import** → `backend/postman/dangsanchaek.postman_collection.json`
2. 서버 실행 (위 1번)
3. 컬렉션 우클릭 → **Run collection** → Run  
   → 63개 요청 / 82개 검증이 순서대로 실행되고, 토큰·ID 는 컬렉션 변수에 자동 저장됩니다.
4. 개별 요청을 직접 눌러볼 때는 **폴더 순서(1→5) 대로** 실행하세요. (앞 요청이 토큰/ID 를 저장)
5. 포트가 다르면 컬렉션 Variables 의 `baseUrl` 을 수정하세요.

CLI 로 돌리고 싶으면: `npx newman run postman/dangsanchaek.postman_collection.json`

### 로컬 테스트용 장치 (운영에선 꺼야 함)
| 설정 | 로컬 값 | 의미 |
|---|---|---|
| `app.oauth.mock-enabled` | `true` | 소셜 토큰 대신 `mock:{소셜ID}:{이메일}` 허용 → 카카오/구글/네이버/Apple 키 없이 테스트 |
| `app.payment.mode` | `mock` | 토스 호출 없이 결제 승인 (`paymentKey` 가 `fail` 로 시작하면 실패) |
| `app.admin.emails` | `admin@dangsanchaek.dev` | 이 이메일로 가입하면 ADMIN (상품 등록 가능) |

## 3. 인증 방식
- 로그인/가입 응답: `accessToken`(JWT, 30분) + `refreshToken`(14일, 1회용·사용 시 새로 발급)
- 보호된 API 헤더: `Authorization: Bearer {accessToken}`
- 401 이면 `POST /auth/refresh` 로 재발급
- 소셜 로그인: 앱이 각 SDK 로 받은 토큰을 서버가 다시 검증
  - kakao / naver: SDK **access token** → 각 사 사용자정보 API 로 검증
  - google / apple: **ID 토큰(JWT)** → 공개키(JWKS) 서명 + `iss` + `aud` 검증  
    (`GOOGLE_CLIENT_IDS`, `APPLE_CLIENT_IDS` 환경변수에 앱 클라이언트ID/Bundle ID 등록 필요)
  - 처음 보는 계정이면 자동 가입 + `isNewUser: true` → 앱은 반려견 등록 온보딩으로 이동

## 4. API 목록
🔓 = 토큰 없이 호출 가능, 👑 = ADMIN

| 영역 | 메서드 · 경로 | 설명 |
|---|---|---|
| 인증 | 🔓 `POST /auth/signup` | 이메일 가입 `{email,password,nickname}` (비번: 영문+숫자 8~64자) |
| | 🔓 `POST /auth/login` | 이메일 로그인 |
| | 🔓 `POST /auth/social/{kakao\|google\|naver\|apple}` | 소셜 로그인/자동가입 `{token, nickname?}` |
| | 🔓 `POST /auth/refresh` | 토큰 재발급 `{refreshToken}` |
| | 🔓 `POST /auth/logout` | 로그아웃 `{refreshToken}` |
| | 🔓 `GET /auth/check-email?email=` · `GET /auth/check-nickname?nickname=` | 중복 확인 |
| 회원 | `GET /users/me` · `PATCH /users/me` | 내 정보 조회/수정(닉네임, 프로필 이미지) |
| | `PATCH /users/me/password` | 비밀번호 변경(이메일 가입자만, 변경 시 모든 기기 로그아웃) |
| | `DELETE /users/me` | 회원 탈퇴(개인정보 비식별화, 반려견·장바구니 삭제) |
| 반려견 | `POST /dogs` · `GET /dogs` · `GET/PATCH/DELETE /dogs/{id}` | 반려견 등록/목록/상세/부분수정/삭제 (최대 10마리) |
| 게시글 | 🔓 `GET /posts?category=&recruitStatus=&keyword=&page=&size=` | 목록 (로그인 시 `likedByMe` 포함) |
| | `POST /posts` · 🔓 `GET /posts/{id}` · `PATCH/DELETE /posts/{id}` | 작성/상세/수정/삭제(작성자만) |
| | `GET /users/me/posts` | 내가 쓴 글 |
| 좋아요 | `POST /posts/{id}/likes` · `DELETE /posts/{id}/likes` | 좋아요/취소 (멱등) |
| 댓글 | 🔓 `GET /posts/{id}/comments` · `POST /posts/{id}/comments` | 목록(답글 중첩) / 작성 `{content, parentId?}` |
| | `PATCH /comments/{id}` · `DELETE /comments/{id}` | 수정/삭제(작성자만) |
| 친구모집·품앗이 | 🔓 `GET /posts/{id}/participants` | 참여자 목록 |
| | `POST /posts/{id}/participants` · `DELETE /posts/{id}/participants` | 참여 신청/취소 (정원 초과·마감·본인글 차단) |
| | `PATCH /posts/{id}/recruit-status` | 작성자 모집 마감/재개 `{status: OPEN\|CLOSED}` |
| 상품 | 🔓 `GET /products?category=&keyword=` · 🔓 `GET /products/{id}` | 판매중 상품 목록/상세 |
| | 👑 `GET/POST /admin/products` · 👑 `PATCH /admin/products/{id}` | 관리자 상품 관리 |
| 장바구니 | `GET /cart` · `POST /cart/items` · `PATCH/DELETE /cart/items/{id}` · `DELETE /cart` | 담기(같은 상품은 수량 합산)/수량변경/삭제/비우기 |
| 주문 | `POST /orders` | 주문 생성 → 재고 확보, `PENDING_PAYMENT`. `items`(바로구매) 또는 `cartItemIds`(장바구니) 중 하나 |
| | `GET /orders` · `GET /orders/{orderNo}` | 내 주문 목록/상세 |
| | `POST /orders/{orderNo}/payments/confirm` | 결제 승인 `{paymentKey, amount}` (서버 금액과 다르면 거부) → `PAID` |
| | `POST /orders/{orderNo}/cancel` | 취소(결제됐으면 PG 취소) + 재고 복구 |

게시글 `category`: `FREE`(자유) / `WALK_MATE`(산책 친구 모집) / `CARE_SHARE`(케어 품앗이).
모집글은 `meetAt`(미래 일시)·`maxParticipants` 필수, `placeName/latitude/longitude` 선택.

결제 흐름(토스페이먼츠): `POST /orders` → 앱에서 토스 결제창(orderId=`orderNo`, amount=`totalAmount`, orderName=`orderName`) → successUrl 의 `paymentKey/amount` 로 `confirm` 호출. 결제 대기 주문은 30분 뒤 자동 취소·재고 복구.

### 오류 응답 형식
```json
{ "status": 409, "code": "EMAIL_ALREADY_EXISTS", "message": "이미 사용 중인 이메일입니다." }
{ "status": 400, "code": "INVALID_INPUT", "message": "요청 값이 올바르지 않습니다.",
  "errors": [{ "field": "password", "message": "비밀번호는 영문과 숫자를 포함해 ..." }] }
```
전체 코드는 `common/exception/ErrorCode.java`.

## 5. 테이블 (Flyway `V1__init_schema.sql`)
```
users ─┬─< refresh_tokens
       ├─< dogs
       ├─< posts ─┬─< post_images
       │          ├─< comments (parent_id → comments, 답글 1단계)
       │          ├─< post_likes        (post_id,user_id UNIQUE)
       │          └─< post_participants (post_id,user_id UNIQUE)
       ├─< cart_items >── products      (user_id,product_id UNIQUE)
       └─< orders ─< order_items >── products  (주문 시점 상품명·가격 스냅샷)
```
| 테이블 | 주요 컬럼 |
|---|---|
| users | email(UNIQUE, 소셜은 null 가능), password_hash, nickname(UNIQUE), provider(LOCAL/KAKAO/GOOGLE/NAVER/APPLE)+provider_id(UNIQUE), role(USER/ADMIN), status(ACTIVE/DELETED) |
| dogs | user_id, name, breed, gender(MALE/FEMALE), birth_date, weight_kg, neutered, profile_image_url |
| posts | user_id, category, title, content, meet_at, place_name, latitude, longitude, max_participants, recruit_status(OPEN/CLOSED), participant_count, like_count, comment_count |
| products | name, description, category(FOOD/SNACK/TOY/WALK/HYGIENE/CLOTHING/ETC), price, stock, image_url, status(ON_SALE/HIDDEN) |
| orders | order_no(UNIQUE, PG orderId), user_id, status(PENDING_PAYMENT/PAID/CANCELLED), order_name, total_amount, 배송지, payment_key, payment_method, paid_at, cancelled_at |

동시성: 좋아요/댓글 수·재고는 원자적 UPDATE(`stock = stock - n WHERE stock >= n`), 모집 참여·결제는 행 잠금으로 초과/중복 처리를 막습니다.

## 6. 운영 배포 시 환경변수
`JWT_SECRET`(32바이트 이상), `DB_URL/DB_USERNAME/DB_PASSWORD`, `PAYMENT_MODE=toss`, `TOSS_SECRET_KEY`, `GOOGLE_CLIENT_IDS`, `APPLE_CLIENT_IDS`, `ADMIN_EMAILS`  
(`mock-enabled` 는 기본값 false, prod 프로필에서 켜지 마세요.)
