# 댕산책 UI 디자인 기준

## 방향

실제 반려동물 라이프스타일 앱처럼 따뜻하고 자연스럽고 신뢰감 있게 만든다. 감성은 사용성을 해치지 않는 선에서 사용하며, 개발자용 기본 UI나 Material 기본 화면처럼 보이지 않게 한다.

## 시각 언어

- Primary: Deep Forest Green
- Background: Warm Ivory / Cream
- Accent: Warm Orange / Mustard
- Surface: White / Light Cream
- Text: Dark Charcoal
- 둥근 카드, 충분한 여백, 큰 반려견·산책 이미지
- 중요한 CTA는 명확하게 표시
- 과도한 테두리와 그림자 사용 금지
- 한 손 사용과 iOS/Android의 자연스러운 동작 고려

## 초기 디자인 토큰

이미지 레퍼런스와 `design/ui-draft.html`을 기준으로 시작한다. 실제 디자인 확정 전까지는 아래 토큰을 사용한다.

- Forest: `#184D3B`
- Forest Deep: `#182720`
- Ivory: `#F6F1E2`
- Ivory Soft: `#EFE8D4`
- Orange: `#DD9A2E`
- Coral: `#D96D4B`
- Ink: `#2A2A20`
- Ink Soft: `#6B6A5C`
- Line: `#DDD6BF`
- 기본 모서리: 12–20px
- 화면 좌우 기본 여백: 20–24px

## 공통 컴포넌트 후보

Button, Card, Input, Chip, Header, Avatar, BottomSheet, EmptyState, LoadingState, ErrorState

## 구현 규칙

- 화면별 임의 색상·간격·타이포그래피를 반복하지 않는다.
- 실제 디자인 토큰을 정한 뒤 `theme/` 또는 현재 구조에 맞는 공통 위치에서 관리한다.
- UI는 hook/service를 통해 mock 또는 API를 소비한다.
- 로딩·빈 상태·오류·권한 거부 상태를 주요 화면에 포함한다.
- Safe Area, 키보드, 다양한 화면 크기, 접근성을 고려한다.
