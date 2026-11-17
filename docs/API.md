# 댕산책 프론트엔드 API 기준

## 연결 원칙

화면은 API 호출을 직접 흩어지게 작성하지 않는다.

`screen → hook/service → api client → Spring Boot API`

백엔드가 준비되지 않은 기능은 같은 service 계약을 유지하는 mock adapter로 제공한다. 실제 API 연결 시 화면을 다시 작성하지 않는 것이 목표다.

## 예상 엔드포인트

- `POST /auth/login`
- `POST /dogs`
- `POST /walks/start` (`{dogId?}`, 진행 중인 산책이 있으면 409 `WALK_ALREADY_IN_PROGRESS`)
- `GET /walks/current` (진행 중인 산책 + 경로, 없으면 204)
- `POST /walks/{id}/points` (`{points: [{seq, latitude, longitude}]}`, 최대 500개, 이미 받은 seq 는 무시 → `{lastSeq}`)
- `PATCH /walks/{id}/end` (`{points?}` 남은 좌표, 거리·시간은 서버가 계산)
- `GET /walks/{id}` (요약 + 경로), `DELETE /walks/{id}` (진행 중 취소 / 기록 삭제, 사진 핀은 남음)
- `POST /photo-pins` (multipart: `image` + `latitude`·`longitude`·`memo?`·`walkId?`)
- `GET /photo-pins` (내 핀 최신순)
- `DELETE /photo-pins/{id}`
- `GET /facilities?swLat&swLng&neLat&neLng&categories?&limit?` (로그인 불필요, 지도 범위 안 친화시설을 가운데에서 가까운 순으로 최대 300개 → `{facilities, truncated}`, 범위 한 변 최대 0.5도)
- `GET /facilities/search?q&lat&lng&categories?` (이름 검색, 가까운 순 최대 30개), `GET /facilities/{id}` (상세)
- `GET /recommendations/walk-times?lat&lng&dogId?` (지금부터 24시간 중 산책하기 좋은 시간 → `{current, bestSlots, hourly, habit, sample, weatherAvailable, airAvailable}`, 국외 위치는 날씨 없이 습관·시간대만)
- `GET /recommendations/courses?lat&lng&minutes?` (주변 공원·내가 걸었던 길 중 목표 시간에 맞는 코스 → `{targetMinutes, targetMeters, paceMetersPerMinute, courses}`, minutes 생략 시 평소 산책 시간)
- `GET /posts`
- `POST /posts`
- `GET /posts/{id}`
- `POST /posts/{id}/comments`
- `GET /users/me`
- `GET /users/me/walks?from=yyyy-MM-dd&to=yyyy-MM-dd` (종료된 산책 최신순, 생략 시 최근 30일)
- `GET /users/me/posts`
- `GET /products`, `GET /products/{id}`
- `GET /cart`, `POST /cart/items`, `PATCH /cart/items/{id}`, `DELETE /cart/items/{id}`
- `POST /orders`, `GET /orders`, `GET /orders/{orderNo}`
- `POST /orders/{orderNo}/payments/confirm`, `POST /orders/{orderNo}/cancel`
- `POST /reports`, `POST/DELETE /users/{id}/block`, `GET /users/me/blocks`
- 관리자(ADMIN): `/admin/reports`, `/admin/users`, `/admin/posts|comments/{id}/visibility`, `/admin/products`, `/admin/orders`

인증·반려견·커뮤니티·내 정보는 각각 `src/api/auth/authService.ts`, `src/api/dog/dogService.ts`, `src/api/community/communityService.ts`, `src/api/user/userService.ts` 를 사용한다. 로그인 세션은 `src/store/authStore.ts`(Refresh Token 만 `src/store/tokenStorage.ts` 로 저장: 앱은 Keychain/Keystore, 웹은 localStorage. 앱 시작 시 `authService.restoreSession` 이 복구), 내 반려견 목록은 `src/store/dogStore.ts` 가 들고 있고, 반려견이 없으면 App 이 온보딩 화면을 띄운다. API 요청이 401 이면 `client.ts` 가 `/auth/refresh` 로 한 번 재발급 후 재시도한다. 사진 핀은 `src/api/map/photoPinService.ts` 를 사용한다. 사진은 서버 로컬 디스크에 저장되고, 응답의 `imageUrl` 은 1시간 유효한 서명 URL(`/files/...?expires=&signature=`)이라 지도 탭에 돌아올 때마다 목록을 다시 불러온다. 산책은 `src/api/walk/walkService.ts` 를 사용하고, 홈의 오늘·이번 주 통계와 산책 기록 목록(`WalkHistoryScreen`)은 `GET /users/me/walks` 결과를 앱에서 집계한다(`src/utils/walkStats.ts`, 칼로리는 대표 반려견 체중 × km × 0.8 추정). 친화시설은 `src/api/facility/facilityService.ts` 를 사용한다. 데이터는 한국문화정보원 '전국 반려동물 동반 가능 문화시설 위치 데이터'(공공데이터포털, 이용허락 제한 없음)로, 서버가 처음 뜰 때 `facilities` 테이블이 비어 있으면 `backend/src/main/resources/data/pet_facilities.csv.gz` 를 읽어 채운다(중복·동반 불가 시설 제외). categories 값: HOSPITAL, PHARMACY, CAFE, RESTAURANT, PET_SHOP, GROOMING, PET_CARE, STAY, TRAVEL, CULTURE. 홈의 날씨 카드·오늘의 추천 산책과 `WalkTimeScreen` 은 `src/api/recommendation/recommendationService.ts` 로 `GET /recommendations/walk-times` 를 부른다(위치는 이미 허용된 경우에만 조용히 받고, 없으면 허용 안내). 서버는 기상청 단기예보·초단기실황과 에어코리아(가까운 측정소 실시간 PM10·PM2.5 + 지역 예보)를 받아 시간마다 0~100점을 매기고, 최근 90일 산책 기록으로 평소 산책 시간대(최근일수록 가중)와 평소 산책 시간(중앙값)을 반영한다. 공공데이터 인증키는 `app.public-data.service-key`(환경변수 `PUBLIC_DATA_SERVICE_KEY`)이며, 비어 있으면 예시 날씨·미세먼지로 계산하고 응답의 `sample` 이 true 다. 맞춤 코스(`CourseScreen`, 홈 추천 카드의 '코스 보기')는 `src/api/course/courseService.ts` 로 `GET /recommendations/courses` 를 부르며, 추천 시간의 권장 산책 시간을 minutes 로 넘긴다. 서버는 목표 시간 × 내 평소 속도(최근 기록 중앙값, 없으면 분당 50m)로 목표 거리를 정하고, 주변 도시공원(전국도시공원정보표준데이터, 서버가 처음 뜰 때 `parks` 테이블이 비어 있으면 `backend/src/main/resources/data/city_parks.csv.gz` 를 읽어 채움, 중복·묘지공원 제외)과 최근 걸었던 경로를 거리 맞음·공원 크기·종류·화장실/음수대·주변 친화시설·다녀온 적 여부로 점수 매긴다. 공원 후보는 직선거리 × 1.3 왕복으로 먼저 추정하고, 상위 5곳은 TMAP 보행자 경로안내(`app.tmap.app-key`, 환경변수 `TMAP_APP_KEY`)로 실제 걷는 길을 받아 거리(편도 × 2)와 점수를 다시 계산한 뒤 경로 좌표를 `path` 로 내려준다(같은 출발·도착은 하루 캐시). 키가 없거나 TMAP 이 실패하면 직선 추정값을 쓰고 `path` 는 빈 배열이다.

신고·차단은 `src/api/moderation/moderationService.ts`, 관리자 기능은 `src/api/admin/adminService.ts`(서버 전용, mock 없음)를 사용한다. 관리자 메뉴는 `/users/me` 의 `role` 이 `ADMIN` 일 때만 마이페이지에 보이고, 실제 권한 검사는 서버가 한다.

마켓은 쿠팡 파트너스 제휴 방식이다. `MarketScreen` 은 `GET /products?linkedOnly=true` 로 쿠팡 링크(`affiliateUrl`)가 있는 상품만 보여주고, 사진을 누르면 쿠팡으로 이동한다. 상품 사진·링크는 관리자 메뉴에서 등록한다(쿠팡 도메인의 https 주소만 허용). 앱에서 장바구니·주문 화면으로 들어가는 경로는 없고, 아래 자체 마켓 코드와 API 는 남아 있다.

자체 마켓은 `src/api/shop/shopService.ts` 계약을 사용한다. `EXPO_PUBLIC_API_BASE_URL` 이 없으면 `mockShopService`(하드코딩 상품·메모리 장바구니·테스트 결제), 있으면 `httpShopService` 로 백엔드를 호출한다.

## 주의사항

- 인증은 JWT와 OAuth 2.0을 고려한다. 토큰 저장 방식은 플랫폼 보안 저장소를 포함해 별도 결정한다.
- 위치·사진·카메라 권한은 API 호출과 별개의 앱 상태로 관리한다.
- 모든 주요 호출에는 로딩·빈 결과·네트워크 오류·재시도 상태가 필요하다.
- 페이로드와 오류 형식은 백엔드 계약이 확정되면 TypeScript 타입으로 고정한다.

