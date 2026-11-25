# 댕산책 출시 체크리스트

코드에 키·비밀번호를 넣지 않는다. 서버 키는 운영 서버 환경 변수, 앱 공개 값은 EAS 환경 변수로만 넣는다.

## 1. 앱 기본 정보 (코드 반영됨)

- 앱 ID: `com.dangsanchaek.app` (iOS `bundleIdentifier`, Android `package` 동일). 스토어에 올린 뒤에는 바꿀 수 없다.
- 빌드: `frontend/eas.json` — `eas build --profile production --platform all`. 빌드 번호는 EAS 가 자동으로 올린다.
- 아이콘·시작 화면: 디자인 이미지를 `frontend/assets/` 에 넣으면 `app.config.js` 가 자동으로 사용한다.
  - `icon.png` 1024×1024 (iOS 는 투명 배경 불가)
  - `adaptive-icon.png` 1024×1024 Android 전경 (가운데 약 66% 안에 로고)
  - `splash.png` 시작 화면 로고
- EAS 환경 변수(production): `EXPO_PUBLIC_API_BASE_URL`(https 운영 서버), `EXPO_PUBLIC_NAVER_MAP_CLIENT_ID`

## 2. 로그인

- 소셜 로그인은 카카오·구글만 제공한다 (팀 결정). iOS 심사 기준 4.8 은 외부 소셜 로그인이 있으면 Apple 로그인 등
  개인정보 보호 로그인을 함께 요구하므로, App Store 심사에서 지적되면 Apple 로그인 추가를 다시 검토한다.
- 구글: Google Cloud 콘솔 OAuth 동의 화면을 '테스트' → **'프로덕션'으로 게시**해야 일반 사용자가 로그인할 수 있다.
- 카카오·구글 콘솔에 운영 콜백 주소 등록: `{OAUTH_CALLBACK_BASE_URL}/auth/oauth/{kakao|google}/callback`

## 3. 약관

- 이용약관·개인정보처리방침·위치기반서비스 약관 문서와 앱 안 동의 화면은 팀원이 준비한다.
- 개인정보처리방침 주소는 구글 플레이·App Store 등록 화면에도 넣는다.
- 케어 품앗이 면책 문구(`frontend/src/constants/legal.ts` 의 `CARE_SHARE_LIABILITY_TEXT`)는 팀이 최종 검토한다.
  글 작성·참여 신청 때 앱이 동의를 받고 서버가 확인한다 (`LIABILITY_AGREEMENT_REQUIRED`).

## 4. 배포 (꽁냥과 같은 방식)

- 서버: Render Blueprint (`render.yaml`, `backend/Dockerfile`) — `develop` 브랜치에 올리면 자동 배포.
  무료 플랜은 15분 쉬면 잠들어 첫 요청이 느리고, 디스크가 유지되지 않아 업로드 사진이 재배포 때 사라진다.
- DB: Supabase(PostgreSQL). Render 무료 서버는 IPv6 직접 연결이 안 될 수 있어 Supabase 의 **Session pooler** 주소를 쓴다.
  `DB_URL=jdbc:postgresql://{pooler 호스트}:5432/postgres?sslmode=require`, `DB_USERNAME=postgres.{프로젝트 ref}`
- 웹: Vercel (`frontend/vercel.json`, Root Directory `frontend`). 환경 변수 `EXPO_PUBLIC_API_BASE_URL`, `EXPO_PUBLIC_NAVER_MAP_CLIENT_ID`.
- 배포 후: 카카오·구글 콘솔에 `https://{서버}/auth/oauth/{kakao|google}/callback`, 네이버 지도에 Vercel 주소 등록.

## 5. 운영 서버 환경 변수

| 변수 | 내용 |
|---|---|
| `SPRING_PROFILES_ACTIVE` | `prod` (기본값이 local 이라 꼭 지정) |
| `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` | Supabase PostgreSQL (Session pooler) |
| `JWT_SECRET` | 32바이트 이상 임의 문자열 |
| `ADMIN_EMAILS` | 관리자 이메일 |
| `OAUTH_CALLBACK_BASE_URL` | https 운영 서버 주소 |
| `OAUTH_ALLOWED_REDIRECTS` | `dangsanchaek://` |
| `KAKAO_REST_API_KEY`, `KAKAO_CLIENT_SECRET` | 카카오 |
| `APP_OAUTH_WEB_GOOGLE_CLIENTID`, `APP_OAUTH_WEB_GOOGLE_CLIENTSECRET` | 구글 (스프링 규칙상 `-` 없이 붙여 쓴다) |
| `PUBLIC_DATA_SERVICE_KEY`, `TMAP_APP_KEY` | 날씨·미세먼지, 보행자 경로 |
| `PAYMENT_MODE` | 기본 `toss` 는 토스 키가 없으면 서버가 안 켜진다. 자체 결제를 안 쓰면 주문 API 처리 방침을 정한다 |
| `STORAGE_LOCAL_DIR` | 업로드 사진 폴더. 재배포해도 지워지지 않는 디스크로 |
