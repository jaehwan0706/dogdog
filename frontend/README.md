# 댕산책 프론트엔드 실행 매뉴얼

> `sj` 브랜치(지도 + 현재 위치 기능)를 받아서 내 휴대폰·PC에서 실행·테스트하는 방법입니다.
> 처음이라면 **[0. 먼저 알아둘 것](#0-먼저-알아둘-것)** 부터 읽어 주세요.

## 목차

0. [먼저 알아둘 것](#0-먼저-알아둘-것)
1. [한 번만 하는 준비](#1-한-번만-하는-준비)
2. [처음 실행하기](#2-처음-실행하기)
3. [휴대폰에서 열기 (아이폰·안드로이드)](#3-휴대폰에서-열기-아이폰안드로이드)
4. [에뮬레이터에서 열기 (휴대폰이 없을 때)](#4-에뮬레이터에서-열기-휴대폰이-없을-때)
5. [지도 기능 테스트하기](#5-지도-기능-테스트하기)
6. [위치 바꿔보기](#6-위치-바꿔보기)
7. [문제 해결](#7-문제-해결)
8. [명령어 모음](#8-명령어-모음)

---

## 0. 먼저 알아둘 것

### ✅ Expo Go로 실행합니다 (아이폰·안드로이드 모두)

지도는 **WebView + 네이버 지도 JavaScript API** 로 그립니다. 네이티브 지도 라이브러리가 없어서, 앱을 직접 빌드할 필요 없이 휴대폰의 **Expo Go** 앱으로 QR만 찍으면 실행됩니다.

- 아이폰도 **무료**로 테스트 가능 (Mac·Apple 개발자 계정 필요 없음)
- 코드를 고치면 휴대폰 화면에 바로 반영됩니다 (Fast Refresh)

### 필요한 것 요약

| 필요한 것 | 버전 | 비고 |
|---|---|---|
| Node.js | 22 이상 (테스트: 24) | <https://nodejs.org> LTS |
| Expo 계정 | — | <https://expo.dev/signup> 무료 (Google 계정 가능) |
| 네이버 지도 Client ID | — | 팀 채팅에서 받기 (**GitHub에 올리지 말 것**) |
| 휴대폰 (Expo Go 설치) **또는** Android 에뮬레이터 | — | 휴대폰 추천 ([3번](#3-휴대폰에서-열기-아이폰안드로이드)) |

---

## 1. 한 번만 하는 준비

### 1-1. Node.js 설치

<https://nodejs.org> 에서 LTS 버전 설치 후 터미널에서 확인:

```bash
node -v    # v22 이상이면 OK
```

### 1-2. 휴대폰에 Expo Go 설치

- 아이폰: App Store에서 **Expo Go**
- 안드로이드: Play 스토어에서 **Expo Go**

### 1-3. Expo 로그인 (PC와 휴대폰 둘 다, 같은 계정)

```bash
npx expo login        # 아이디·비밀번호 입력
```

휴대폰 Expo Go 앱에서도 **같은 계정으로 로그인**합니다. 같은 계정이면 QR 없이도 Expo Go 첫 화면의 **Development servers** 목록에 댕산책이 뜹니다.

---

## 2. 처음 실행하기

### 2-1. 브랜치 받기

```bash
git fetch origin
git checkout sj
git pull
```

### 2-2. 네이버 지도 Client ID 설정

```bash
cd frontend
cp .env.example .env          # Windows PowerShell: copy .env.example .env
```

`frontend/.env` 파일을 열어서 팀 채팅에서 받은 값을 넣습니다:

```
EXPO_PUBLIC_NAVER_MAP_CLIENT_ID=여기에_받은_값
```

> - `.env`는 `.gitignore`에 들어있어서 커밋되지 않습니다. **절대 다른 파일에 직접 붙여넣어 커밋하지 마세요.**
> - 예전 이름 `NAVER_MAP_CLIENT_ID` 로 넣어 두었다면 **이름을 바꿔야** 합니다. 값이 없으면 지도 자리에 안내 문구가 나옵니다.
> - 값을 바꾼 뒤에는 `npx expo start --clear` 로 다시 실행해야 반영됩니다.

### 2-3. 설치 & 개발 서버 실행

```bash
npm install
npx expo start
```

터미널에 **QR 코드**가 나오면 준비 끝입니다. 이 터미널은 끄지 말고 그대로 두세요 (개발 서버 Metro가 돌고 있음).

---

## 3. 휴대폰에서 열기 (아이폰·안드로이드)

1. 휴대폰을 **PC와 같은 Wi-Fi** 에 연결
2. QR 찍기
   - 아이폰: **기본 카메라 앱**으로 QR → "Expo Go에서 열기"
   - 안드로이드: **Expo Go 앱** → Scan QR code
   - 또는 Expo Go 첫 화면 **Development servers** 에서 댕산책 선택 ([1-3](#1-3-expo-로그인-pc와-휴대폰-둘-다-같은-계정) 로그인 시)
3. 처음엔 앱을 받느라 30초~1분 걸립니다. 터미널에 `iOS Bundled` / `Android Bundled` 가 나오면 성공

> **아이폰에서 접속이 안 되면**: 설정 → 개인정보 보호 및 보안 → **로컬 네트워크** → Expo Go **켜기**
> **학교·카페 Wi-Fi에서 안 되면**: 기기끼리 연결을 막는 네트워크입니다 → `npx expo start --tunnel`

---

## 4. 에뮬레이터에서 열기 (휴대폰이 없을 때)

Android Studio로 에뮬레이터를 만들고 켭니다.

1. <https://developer.android.com/studio> 설치 → **More Actions → Virtual Device Manager → Create Virtual Device**
2. 기기: **Pixel** 아무거나 → 시스템 이미지: 이름에 **"Google APIs"** 또는 **"Google Play"** 가 붙은 **x86_64** 이미지
3. ▶ 버튼으로 실행
4. `npx expo start` 터미널에서 **`a` 키** → Expo Go가 자동 설치되고 앱이 열립니다

> 💡 PC 메모리가 8GB 정도라면 에뮬레이터 설정(✏️)에서 **RAM을 2GB**로 낮추고, 크롬 등 다른 프로그램을 닫아 주세요.
> 💡 `adb` 명령어(위치 바꾸기 등)를 쓰려면 `%LOCALAPPDATA%\Android\Sdk\platform-tools` 를 `Path` 환경 변수에 추가합니다.

---

## 5. 지도 기능 테스트하기

1. 앱 실행 → 로그인 화면에서 **Google로 계속하기** (아직 실제 로그인 없음, 바로 통과)
2. 하단 탭 **지도** 선택
3. 아래 시나리오를 확인합니다.

| # | 해보기 | 기대 결과 |
|---|---|---|
| 1 | 지도 탭 진입 | "산책 지도" 제목 아래 둥근 카드 안에 네이버 지도 (처음엔 서울시청) |
| 2 | 안내 팝업 "위치 권한이 필요해요" → **계속** | 시스템 권한 팝업 |
| 3 | **앱을 사용하는 동안 허용** | 내 위치(파란 점)로 이동 + 오른쪽 위 내 위치 버튼 (초록색) |
| 4 | 지도를 손가락으로 끌기 | 지도가 더 이상 내 위치를 따라가지 않음, 버튼이 회색으로 바뀜 |
| 5 | 내 위치 버튼 누르기 | 내 위치로 돌아오고 다시 따라가기 (버튼 초록색) |
| 6 | 걸어서 이동 (또는 [6번](#6-위치-바꿔보기)으로 위치 변경) | 파란 점이 따라 움직이고 지도도 따라감 |
| 7 | (권한 초기화 후) **허용 안 함** | 지도 카드 아래 배너 + **권한 허용하기** 버튼 |
| 8 | 권한 허용하기 → 계속 → 또 **허용 안 함** | 버튼이 **설정에서 허용하기**로 바뀜 (iOS는 한 번 거부하면 바로 이 상태) |
| 9 | 설정에서 허용하기 → 위치 권한 허용 → 앱으로 돌아오기 | 돌아오자마자 내 위치 표시 |

**권한 테스트를 처음부터 다시 하려면** (Expo Go 앱의 위치 권한 초기화):

- 아이폰: 설정 → **Expo Go** → 위치 → **다음번에 묻기**
- 안드로이드 휴대폰: 설정 → 애플리케이션 → **Expo Go** → 권한 → 위치 → **매번 확인**
- 에뮬레이터: `adb shell pm reset-permissions -p host.exp.exponent`

→ Expo Go에서 앱 다시 열기 → 로그인 → 지도 탭부터 다시.

---

## 6. 위치 바꿔보기

### 실제 휴대폰

- 진짜 GPS를 사용하므로 실제로 걸어 다니면 위치가 바뀝니다.

### 에뮬레이터

**방법 1 — 지도에서 고르기 (쉬움)**
에뮬레이터 오른쪽 툴바 맨 아래 **`⋯`** → **Location** → 지도에서 원하는 곳 클릭 → **Set location**

**방법 2 — 명령어**

```bash
adb emu geo fix 127.0374 37.5444      # 경도 먼저, 위도 나중! (서울숲)
```

| 장소 | 명령어 |
|---|---|
| 서울숲 | `adb emu geo fix 127.0374 37.5444` |
| 서울시청 | `adb emu geo fix 126.9784 37.5666` |
| 여의도 한강공원 | `adb emu geo fix 126.9340 37.5284` |

> - 좌표는 구글 지도에서 원하는 곳 **우클릭** → 맨 위 `37.xx, 127.xx` 클릭하면 복사됩니다 (넣을 땐 순서 반대로).
> - **앱이 켜진 뒤에** 넣어야 바로 반영됩니다.

**걷는 것처럼 움직이기**: 같은 Location 화면 → **Routes** 탭 → 출발/도착 지점 찍기 → **Play route**

---

## 7. 문제 해결

| 증상 | 원인 / 해결 |
|---|---|
| 지도 자리에 **"EXPO_PUBLIC_NAVER_MAP_CLIENT_ID 가 없어요"** | `frontend/.env` 에 값이 없거나 예전 이름(`NAVER_MAP_CLIENT_ID`) → [2-2](#2-2-네이버-지도-client-id-설정) 후 `npx expo start --clear` |
| **"네이버 지도 인증에 실패했어요"** | Client ID 오타, 또는 네이버 클라우드 콘솔 Maps 앱에 **Web 서비스 URL `http://localhost`** 미등록 (담당: 김석준) |
| **"지도를 불러오지 못했어요"** | 휴대폰 인터넷 연결 확인 (지도는 인터넷으로 받아옴) |
| 휴대폰에서 QR을 찍어도 계속 로딩 / "Could not connect" | ① PC와 같은 Wi-Fi인지 ② 아이폰 로컬 네트워크 권한 ([3번](#3-휴대폰에서-열기-아이폰안드로이드)) ③ Windows 방화벽 팝업에서 Node.js 허용 ④ 그래도 안 되면 `npx expo start --tunnel` |
| `npx expo login` 하라는 경고 | [1-3](#1-3-expo-로그인-pc와-휴대폰-둘-다-같은-계정) 대로 PC·Expo Go 모두 로그인 |
| Expo Go에서 **SDK 버전이 안 맞는다**는 오류 | 스토어에서 Expo Go 최신 버전으로 업데이트 |
| **코드를 고쳤는데 화면이 안 바뀜** | 터미널 `Ctrl+C` 후 `npx expo start --clear`, Expo Go에서 앱 다시 열기 |
| `Port 8081 is being used` | 이미 켜진 Metro 터미널이 있음 → 그 터미널을 쓰거나 끄고 다시 실행 |
| 에뮬레이터가 검은 화면에서 안 넘어감 | 에뮬레이터 종료 → Device Manager에서 ⋮ → **Cold Boot Now** |
| `git pull` 후 실행이 안 됨 | `npm install` → `npx expo start --clear` |

---

## 8. 명령어 모음

```bash
# 처음 한 번
git checkout sj && git pull
cd frontend
cp .env.example .env          # EXPO_PUBLIC_NAVER_MAP_CLIENT_ID 입력
npm install
npx expo login

# 평소
cd frontend
npx expo start                # QR 찍기 (에뮬레이터는 a 키)

# 화면이 안 바뀔 때 / .env 를 바꿨을 때
npx expo start --clear

# 같은 Wi-Fi로 접속이 안 될 때
npx expo start --tunnel

# 에뮬레이터 위치 변경 (경도 위도)
adb emu geo fix 127.0374 37.5444
```

---

문의: 김석준 (`sj` 브랜치 — 지도 / 현재 위치)
