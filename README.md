# 댕산책 (강아지산책)

반려견과 보호자의 산책·정서 교감·커뮤니티를 하나로 묶은 모바일 네이티브 앱 (App Store·Play Store 동시 출시)

- Notion 메인 페이지: https://app.notion.com/p/3e8d0f5b57ae80a7b871cd502a8fbdbc
- 기획서 최종본: https://app.notion.com/p/3e8d0f5b57ae81ccaf28d39e57e30029
- 기능명세서 & 개발 폴더 구조: https://app.notion.com/p/3e8d0f5b57ae8193ab81c45c6ac1830c

## 배경

- 국내 반려동물 연관산업은 2022년 약 9조 원 → 2032년 약 22조 원 규모로 성장 전망, 그중 펫테크 성장률(CAGR 16.33%)이 가장 높음
- 반려동물의 80.1%가 하루 평균 5시간 54분을 혼자 보내며, 외로움·안전 문제가 보호자의 최대 걱정거리
- 기존 경쟁 서비스(펫썸, 펫피 등)는 단순 산책 경로·시간 기록 위주 — 산책 친구 매칭 · 사진/영상 기반 기록 · AI 활용에서 차별화

> "산책 기록"이라는 기본기에 정서적 교감(사진 지도), 안전(친화시설), 관계(커뮤니티)를 더하고, 모바일 네이티브 배포와 법적 리스크가 낮은 AI 기능으로 완성도를 높이는 방향.

## 핵심 기능

| # | 기능 | 설명 | 우선순위 |
|---|---|---|---|
| 1 | 회원가입/로그인 | 이메일 가입 + 소셜(카카오·구글) + Apple 로그인 | MVP |
| 2 | 데이터 기반 산책 기록 | 실시간 GPS로 거리·시간·소모 칼로리 기록 | MVP |
| 3 | 나만의 산책 지도 | 산책 중 사진을 찍으면 지도에 핀 생성, 비공개 개인 기록 | MVP |
| 4 | 친화 시설 지도 | 반려동물 동반 가능 시설(식당·카페·병원 등) 위치 제공 | MVP |
| 5 | 커뮤니티 | 게시글/댓글/좋아요, 산책 친구 모집, 케어 품앗이 | MVP |
| 6 | 맞춤형 산책 코스 추천 | 산책 이력·공공데이터·날씨/미세먼지 학습 → 개인화 코스 추천 | MVP~확장 |
| 7 | 반려견 사진 AI | 견종 추정, "이달의 산책 베스트샷" 자동 큐레이션 | 확장 |
| 8 | 커뮤니티 모더레이션 AI | 욕설·스팸 게시글/댓글 자동 필터링 | 확장 |

AI 건강 분석(오진 시 법적 책임 리스크)은 이번 버전 범위에서 제외.

## 기술 스택

| 영역 | 채택안 |
|---|---|
| 프론트엔드 | React Native (iOS·Android 단일 코드베이스) |
| 백엔드 | Java / Spring Boot, 도메인별 패키지 구조 |
| 데이터베이스 | MySQL (로컬 시작, JPA/Hibernate로 종속성 최소화) |
| 인증/보안 | JWT + OAuth 2.0, Apple 로그인 |
| AI | 외부 사전학습 API/모델 우선 활용 |

## 로드맵

1. **Phase 1** — 회원/인증, 산책 기록, 사진 핀, 친화시설 지도, 커뮤니티 MVP
2. **Phase 2** — 코스 추천(규칙 기반) 출시, 클라우드 인프라 전환
3. **Phase 3** — AI 코스 추천 고도화, 반려견 사진 AI
4. **Phase 4** — 커뮤니티 모더레이션 AI, 안정화

## 저장소 구조

프론트엔드 1개(React Native) + 백엔드 1개(Spring Boot 모놀리식, 도메인별 패키지 분리)로 시작. 팀 규모상 마이크로서비스는 시기상조 — "모듈형 모놀리스"로 시작해 필요해지면 나중에 분리.

### frontend/ (React Native)

```
frontend/
├── android/
├── ios/
├── src/
│   ├── api/
│   ├── assets/
│   ├── components/
│   ├── screens/
│   │   ├── auth/
│   │   ├── walk/
│   │   ├── map/
│   │   ├── course/
│   │   ├── community/
│   │   └── mypage/
│   ├── navigation/
│   ├── store/
│   ├── hooks/
│   ├── utils/
│   └── types/
├── App.tsx
└── package.json
```

### backend/ (Spring Boot — 도메인별 패키지 분리)

```
backend/
├── src/main/java/com/dangsanchaek/
│   ├── auth/
│   ├── community/
│   ├── walk/
│   ├── map/
│   ├── course/
│   ├── ai/
│   ├── infra/
│   ├── common/                # 공통 응답/예외/유틸
│   ├── config/                # Security(JWT/OAuth), CORS
│   └── DangsanchaekApplication.java
├── src/main/resources/
│   ├── application.yml
│   ├── application-local.yml
│   └── application-prod.yml
├── src/test/java/...
└── build.gradle
```

> 각 도메인 패키지(auth/community/walk/map/course/ai/infra)는 controller / service / repository / domain / dto의 동일한 하위 구조로 통일합니다.

## Git / 브랜치 전략

- `main`(배포용) → `develop`(통합) → `feature/{도메인}-{기능명}` (예: `feature/auth-apple-login`)
- PR은 최소 1인 리뷰 후 develop 병합

## DB 마이그레이션

- 로컬 MySQL로 시작, Flyway로 스키마 변경 이력을 코드로 관리
