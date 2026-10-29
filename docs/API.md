# 댕산책 프론트엔드 API 기준

## 연결 원칙

화면은 API 호출을 직접 흩어지게 작성하지 않는다.

`screen → hook/service → api client → Spring Boot API`

백엔드가 준비되지 않은 기능은 같은 service 계약을 유지하는 mock adapter로 제공한다. 실제 API 연결 시 화면을 다시 작성하지 않는 것이 목표다.

## 예상 엔드포인트

- `POST /auth/login`
- `POST /dogs`
- `POST /walks/start`
- `PATCH /walks/{id}/end`
- `POST /walks/{id}/points`
- `POST /photo-pins` (multipart: `image` + `latitude`·`longitude`·`memo?`·`walkId?`)
- `GET /photo-pins` (내 핀 최신순)
- `DELETE /photo-pins/{id}`
- `GET /facilities`
- `GET /courses/recommend`
- `GET /posts`
- `POST /posts`
- `GET /posts/{id}`
- `POST /posts/{id}/comments`
- `GET /users/me`
- `GET /users/me/walks`
- `GET /users/me/posts`
- `GET /products`, `GET /products/{id}`
- `GET /cart`, `POST /cart/items`, `PATCH /cart/items/{id}`, `DELETE /cart/items/{id}`
- `POST /orders`, `GET /orders`, `GET /orders/{orderNo}`
- `POST /orders/{orderNo}/payments/confirm`, `POST /orders/{orderNo}/cancel`

인증·반려견·커뮤니티·내 정보는 각각 `src/api/auth/authService.ts`, `src/api/dog/dogService.ts`, `src/api/community/communityService.ts`, `src/api/user/userService.ts` 를 사용한다. 로그인 세션은 `src/store/authStore.ts`(현재 메모리 저장, 앱 재시작 시 재로그인), 내 반려견 목록은 `src/store/dogStore.ts` 가 들고 있고, 반려견이 없으면 App 이 온보딩 화면을 띄운다. API 요청이 401 이면 `client.ts` 가 `/auth/refresh` 로 한 번 재발급 후 재시도한다. 사진 핀은 `src/api/map/photoPinService.ts` 를 사용한다. 사진은 서버 로컬 디스크에 저장되고, 응답의 `imageUrl` 은 1시간 유효한 서명 URL(`/files/...?expires=&signature=`)이라 지도 탭에 돌아올 때마다 목록을 다시 불러온다. 산책·시설·코스 API 는 백엔드에 아직 없어 홈의 산책 통계는 예시 값이다.

마켓은 `src/api/shop/shopService.ts` 계약을 사용한다. `EXPO_PUBLIC_API_BASE_URL` 이 없으면 `mockShopService`(하드코딩 상품·메모리 장바구니·테스트 결제), 있으면 `httpShopService` 로 백엔드를 호출한다.

## 주의사항

- 인증은 JWT와 OAuth 2.0을 고려한다. 토큰 저장 방식은 플랫폼 보안 저장소를 포함해 별도 결정한다.
- 위치·사진·카메라 권한은 API 호출과 별개의 앱 상태로 관리한다.
- 모든 주요 호출에는 로딩·빈 결과·네트워크 오류·재시도 상태가 필요하다.
- 페이로드와 오류 형식은 백엔드 계약이 확정되면 TypeScript 타입으로 고정한다.

