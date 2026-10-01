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
- `POST /walks/{id}/photo-pins`
- `GET /photo-pins`
- `GET /facilities`
- `GET /courses/recommend`
- `GET /posts`
- `POST /posts`
- `GET /posts/{id}`
- `POST /posts/{id}/comments`
- `GET /users/me`
- `GET /users/me/walks`
- `GET /users/me/posts`

## 주의사항

- 인증은 JWT와 OAuth 2.0을 고려한다. 토큰 저장 방식은 플랫폼 보안 저장소를 포함해 별도 결정한다.
- 위치·사진·카메라 권한은 API 호출과 별개의 앱 상태로 관리한다.
- 모든 주요 호출에는 로딩·빈 결과·네트워크 오류·재시도 상태가 필요하다.
- 페이로드와 오류 형식은 백엔드 계약이 확정되면 TypeScript 타입으로 고정한다.

