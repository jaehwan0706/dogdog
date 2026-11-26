# 댕산책 Git 작업 규칙

이슈 → 브랜치 → PR → 리뷰·CI → Squash 머지 순서로 작업한다. (캡스톤 레포와 같은 규칙)

## 브랜치

```
main      ── 배포 (Render 서버 + Vercel 웹 자동 배포). 직접 push 금지, develop 에서 PR 로 승격
develop   ── 개발 통합. 기능 브랜치의 PR 대상 (기능 PR 을 main 으로 바로 올리지 않는다)
  ├─ feat/#12-kakao-login
  ├─ fix/#15-walk-time
  └─ docs/#20-api-guide          (refactor / chore / design / test / perf / ci 동일)
급한 수정도 fix/#번호-설명 으로 develop 에 올린 뒤 바로 승격한다 (main 에서 브랜치를 따지 않는다)
```

| 타입 | 언제 |
|---|---|
| `feat` | 새 기능·화면·API |
| `fix` | 버그 수정 |
| `design` | 화면 모양만 바꿀 때 |
| `refactor` | 동작은 그대로, 코드 구조 정리 |
| `docs` | 문서 |
| `chore` | 설정·배포·의존성 |
| `test` / `perf` / `ci` | 테스트 / 성능 / CI |

## 이슈 작성 규칙

**이슈 1개 = PR 1개 = 브랜치 1개.** 하루~이틀 안에 끝낼 수 있는 크기로 나눈다.
너무 크면(예: "커뮤니티 만들기") 화면·API 단위로 쪼개서 여러 이슈로 만든다.

| 항목 | 규칙 | 예 |
|---|---|---|
| 템플릿 | 기능 개발 / 버그 수정 / 화면 디자인 / 작업 중 하나를 고른다 (빈 이슈는 만들 수 없음) | |
| 제목 | `[타입] 무엇을 하는지` — 한 줄, 동사로 끝낸다 | `[FEAT] 카카오 로그인 연결` |
| 타입 | `FEAT` 기능 · `FIX` 버그 · `DESIGN` 화면 모양 · `CHORE` 설정·배포·문서·정리 | `[FIX] 산책 시간이 9시간 어긋남` |
| 담당자 | Assignees 에 작업할 사람 (본인) | |
| 라벨 | 템플릿이 붙여 준 타입 라벨 + 영역 라벨 하나 (`frontend` / `backend`) | `feat`, `backend` |
| 할 일 | 체크리스트로 쪼갠다. 작업하면서 체크한다 | `- [ ] 로그인 API 연결` |
| 완료 기준 | 무엇이 되면 끝인지 확인할 수 있게 쓴다 | "카카오 계정으로 로그인 후 홈 화면이 뜬다" |
| 참고 | 기획(노션)·디자인·관련 이슈 링크 | `#12 와 관련` |

- 시작하기 전에 같은 내용의 이슈가 있는지 검색한다. 있으면 그 이슈에 댓글로 참여한다.
- 버그는 **다시 만드는 순서**와 **캡처**를 꼭 넣는다 (어떤 기기·브라우저인지도).
- 작업 중 바뀐 점이나 결정한 내용은 이슈 댓글로 남긴다 (나중에 이유를 찾을 수 있게).
- 다른 사람 영역(예: 지도 화면)을 고쳐야 하면 담당자를 이슈에 멘션해서 먼저 알린다.
- PR 이 머지되면 `close #번호` 로 이슈가 자동으로 닫힌다. 하다가 그만두면 이유를 적고 직접 닫는다.

**예시**

```
제목: [FEAT] 산책 결과 화면에 사진 핀 목록 보여주기
라벨: feat, frontend    담당자: @본인

## 무엇을 만드나요
산책이 끝난 뒤 결과 화면에서 그 산책 중 남긴 사진 핀을 썸네일로 보여준다.

## 할 일
- [ ] GET /photo-pins?walkId= 로 사진 핀 불러오기
- [ ] 결과 화면 아래에 가로 스크롤 썸네일
- [ ] 사진을 누르면 크게 보기

## 완료 기준
- 사진을 2장 남긴 산책을 끝내면 결과 화면에 썸네일 2개가 보인다

## 참고
- 노션 화면 기획: 산책 결과
```

## 순서

1. **이슈 만들기** — GitHub → Issues → New issue → 템플릿(기능 개발 / 버그 수정 / 작업) 선택.
   담당자(Assignees)에 본인, 라벨 확인. 이슈 번호를 기억한다 (예: #12).
2. **브랜치 만들기** — 항상 최신 develop 에서 시작한다.
   ```bash
   git switch develop
   git pull origin develop
   git switch -c feat/#12-kakao-login
   ```
3. **작업·커밋** — 작게 자주 커밋한다. 커밋 메시지도 `<타입>: <요약>` 으로 쓰면 좋다.
   ```bash
   git add <파일>
   git commit -m "feat: 카카오 로그인 버튼 연결"
   git push -u origin feat/#12-kakao-login
   ```
4. **PR 올리기** — base 는 **develop**.
   - 제목: `feat: 카카오 로그인 연동` (`<타입>: <요약>`)
   - 본문: 템플릿대로, 맨 위에 `close #12` (머지되면 이슈가 자동으로 닫힌다)
   - UI 를 바꿨다면 캡처를 붙인다.
5. **CI** — 아래 검사가 모두 초록불이면 머지할 수 있다. 실패하면 고쳐서 다시 push.
6. **머지** — **Squash and merge**. 머지 후 브랜치는 자동으로 삭제된다.
7. **배포** — 아래 "배포(승격)" 순서로 develop 을 main 에 올리면 Render 서버와 Vercel 웹이 함께 자동 배포된다.

## 배포 (develop → main 승격) — 레포 관리자만

develop 은 기본 브랜치라서 "Compare & pull request" 배너가 뜨지 않는다. 승격 PR 은 직접 만든다.

1. 레포 위 메뉴 **Pull requests** → 오른쪽 위 초록색 **New pull request**
2. 브랜치 칸 두 개를 고른다: 왼쪽 **base: `main`** (받는 쪽), 오른쪽 **compare: `develop`** (보내는 쪽)
   → `base: main ← compare: develop` 인지 꼭 확인 (반대면 안 된다)
3. **Create pull request** → 제목 `<타입>: <요약>` (예: `feat: 산책 중 지도에 친화시설 표시 배포`),
   본문에 이번에 나가는 PR 목록 (예: `- #9 산책 중 지도에 친화시설 표시`). 승격 PR 은 `close #` 가 없어도 된다
4. 검사가 모두 초록불이면 머지 버튼 옆 **▾ → Create a merge commit → Bypass requirements → Confirm**
   (main 은 Squash 가 아니라 **Merge commit** 으로 올린다. Squash 하면 develop 과 기록이 어긋난다)
5. 몇 분 뒤 Render·Vercel 배포 완료. main 화면의 "Contribute" 버튼과 "main had recent pushes" 배너는 **누르지 않는다** (main → develop 방향)

## 하면 안 되는 PR

| PR | 왜 |
|---|---|
| **main → develop** | 승격 머지 뒤 GitHub 가 "main had recent pushes · Compare & pull request" 배너를 띄우지만 **무시한다.** main 의 머지 기록 커밋일 뿐 내용 차이가 없고, 머지하면 main 이 자동 삭제될 수 있다. 만들면 CI 가 자동으로 닫는다 |
| develop 이 아닌 브랜치 → **main** | main 은 **develop 승격 PR 만** 받는다. 기능·버그 수정(급한 것 포함)은 모두 develop 으로 올린 뒤 승격 |

## 자동 검사 (`.github/workflows`)

| 검사 | 내용 |
|---|---|
| PR 규칙 | 브랜치 이름 `<타입>/#<번호>-<설명>`, PR 제목 `<타입>: <요약>`, 본문 `close #번호` |
| Backend test | `./gradlew test` (마이그레이션 전부 적용 + API 테스트) |
| Frontend type check | `npx tsc --noEmit` |
| Migration · Secret guard | 이미 있는 V 마이그레이션 파일 수정 금지, `application-local.yml`·`.env`·키 문자열 업로드 금지 |

PR 올리기 전에 로컬에서 `./gradlew test` 와 `npx tsc --noEmit` 을 먼저 돌려 보자.

## 주의

- 키·비밀번호는 `application-local.yml`, `frontend/.env` 에만 둔다 (git 에 안 올라감). 운영 값은 Render·Vercel 화면에서 넣는다.
- DB 를 바꿀 때는 이미 있는 `V*.sql` 을 고치지 말고 새 번호 파일을 만든다. 운영 DB 에 이미 적용돼서 고치면 서버가 안 켜진다.
- 같은 파일을 여러 명이 고칠 것 같으면 이슈에서 먼저 나눠 맡는다.
