# 댕산책 개발 규칙

## 현재 상태

- 저장소는 `frontend/`와 `backend/`의 초기 디렉터리 골격만 있는 상태다.
- `frontend/package.json`, `frontend/App.tsx`, `backend/build.gradle`, 백엔드 애플리케이션/설정 파일은 현재 비어 있다.
- React Native CLI인지 Expo인지, 사용 중인 Navigation·상태관리·API 라이브러리는 아직 결정되거나 설치되지 않았다.
- 이 문서와 `docs/` 문서는 프로젝트의 현재 기준(source of truth)이며, 실제 코드와 달라지면 코드를 우선 확인하고 문서를 갱신한다.

## 작업 원칙

- 작업 전 관련 파일과 Git 변경 상태를 먼저 확인한다.
- 기존 코드와 팀원의 변경을 이유 없이 삭제하거나 전면 재작성하지 않는다.
- 프론트엔드는 TypeScript와 iOS/Android 단일 코드베이스를 기준으로 한다.
- UI, 도메인 로직, API 호출을 분리한다. 화면 안에 API 응답이나 목 데이터를 직접 하드코딩하지 않는다.
- 공통 디자인 토큰과 재사용 컴포넌트를 사용하되, 필요한 수준 이상으로 추상화하지 않는다.
- 위치·카메라·사진·알림 권한과 개인정보, 계정 탈퇴, 신고·차단 등 출시 요구사항을 기능 설계에 반영한다.
- dependency는 실제 필요성과 플랫폼 지원을 확인한 뒤 최소한으로 추가한다.
- 작은 단위로 변경하고, 변경 후 TypeScript·lint·플랫폼 빌드를 가능한 범위에서 확인한다.

## 문서 읽기 순서

- 제품·MVP 범위: `docs/PRODUCT.md`
- UI 원칙과 디자인 토큰: `docs/UI_DESIGN.md`
- 화면·이동 구조: `docs/SCREENS.md`
- API 연결 규칙: `docs/API.md`

## 권장 프론트엔드 작업 순서

Design System → Navigation → Login → Dog Onboarding → Home → Walk → Walk Result → Map → Course → Community → MyPage → Store

