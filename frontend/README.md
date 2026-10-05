# 댕산책 프론트엔드 실행 매뉴얼

> `sj` 브랜치(지도 + 현재 위치 기능)를 받아서 내 PC에서 실행·테스트하는 방법입니다.
> 처음이라면 **[0. 먼저 알아둘 것](#0-먼저-알아둘-것)** 부터 읽어 주세요.

## 목차

0. [먼저 알아둘 것](#0-먼저-알아둘-것)
1. [한 번만 하는 준비](#1-한-번만-하는-준비)
2. [앱을 띄울 기기 고르기](#2-앱을-띄울-기기-고르기)
3. [처음 실행하기](#3-처음-실행하기)
4. [두 번째부터 실행하기](#4-두-번째부터-실행하기)
5. [지도 기능 테스트하기](#5-지도-기능-테스트하기)
6. [위치 바꿔보기](#6-위치-바꿔보기)
7. [문제 해결](#7-문제-해결)
8. [명령어 모음](#8-명령어-모음)

---

## 0. 먼저 알아둘 것

### ⚠️ Expo Go로는 실행되지 않습니다

네이버 지도는 Expo Go 앱에 들어있지 않은 네이티브 라이브러리라서, 휴대폰 Expo Go 앱으로 QR을 찍는 방식은 **동작하지 않습니다**.
대신 내 PC에서 앱을 직접 빌드해서 설치하는 **개발 빌드** 방식으로 실행합니다. (`npm run android`)

### ⚠️ 지금은 Android만 됩니다

iOS(아이폰·Mac 시뮬레이터)는 아직 설정·테스트되지 않았습니다. 아이폰만 있다면 PC의 Android 에뮬레이터를 사용해 주세요.

### 필요한 것 요약

| 필요한 것 | 버전 | 비고 |
|---|---|---|
| Node.js | 22 이상 (테스트: 24) | <https://nodejs.org> LTS |
| Android Studio | 최신 | Android SDK, JDK, 에뮬레이터가 같이 설치됨 |
| 네이버 지도 Client ID | — | 팀 채팅에서 받기 (**GitHub에 올리지 말 것**) |
| Android 휴대폰 **또는** 에뮬레이터 | Android 12 이상 권장 | [2번](#2-앱을-띄울-기기-고르기) 참고 |

---

## 1. 한 번만 하는 준비

### 1-1. Node.js 설치

<https://nodejs.org> 에서 LTS 버전 설치 후 터미널에서 확인:

```bash
node -v    # v22 이상이면 OK
```

### 1-2. Android Studio 설치

1. <https://developer.android.com/studio> 에서 설치 (설치 마법사는 기본값으로 진행)
2. 처음 실행하면 SDK 다운로드가 자동으로 진행됩니다. 끝날 때까지 기다리기
3. **More Actions → SDK Manager** 에서 확인:
   - **SDK Platforms** 탭: `Android 16 (API 36)` 체크
   - **SDK Tools** 탭: `Android SDK Platform-Tools`, `Android Emulator` 체크

### 1-3. 환경 변수 설정 (Windows)

`시작 → "시스템 환경 변수 편집" → 환경 변수` 에서:

| 종류 | 이름 | 값 |
|---|---|---|
| 새로 만들기 | `ANDROID_HOME` | `C:\Users\<내이름>\AppData\Local\Android\Sdk` |
| 새로 만들기 | `JAVA_HOME` | `C:\Program Files\Android\Android Studio\jbr` |
| `Path`에 추가 | — | `%ANDROID_HOME%\platform-tools` |

터미널을 **새로 열고** 확인:

```bash
adb version     # 버전이 나오면 OK
```

> **Mac**: `~/.zshrc`에 아래를 추가 후 `source ~/.zshrc`
> ```bash
> export ANDROID_HOME=$HOME/Library/Android/sdk
> export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
> export PATH=$PATH:$ANDROID_HOME/platform-tools
> ```

---

## 2. 앱을 띄울 기기 고르기

둘 중 하나만 있으면 됩니다. **Android 휴대폰이 있으면 휴대폰을 추천**합니다 (빠르고, PC가 덜 무겁고, 진짜 GPS로 테스트 가능).

### A. Android 휴대폰 (추천)

1. **개발자 옵션 켜기**: 설정 → 휴대전화 정보 → 소프트웨어 정보 → **빌드번호 7번 연속 탭**
2. **USB 디버깅 켜기**: 설정 → 개발자 옵션 → **USB 디버깅** ON
3. USB로 PC에 연결 → 휴대폰에 뜨는 "USB 디버깅 허용" → **허용**
4. 확인:
   ```bash
   adb devices
   # R3CXXXXXXX    device   ← 이렇게 나오면 OK ("unauthorized"면 휴대폰에서 허용 누르기)
   ```

### B. 에뮬레이터 (휴대폰이 없을 때)

1. Android Studio → **More Actions → Virtual Device Manager → Create Virtual Device**
2. 기기: **Pixel 6** (아무 Pixel이나 OK) → Next
3. 시스템 이미지: **API 36** 중 이름에 **"Google APIs"** 또는 **"Google Play"** 가 붙은 **x86_64** 이미지 선택
   - ⚠️ 그냥 "AOSP" 이미지는 안 됩니다. 지도 위치 기능이 Google Play 서비스를 사용합니다.
4. Finish → 목록에서 ▶ 버튼으로 실행
5. 확인:
   ```bash
   adb devices
   # emulator-5554   device   ← OK ("offline"이면 아직 부팅 중)
   ```

> 💡 PC 메모리가 8GB 정도라면 에뮬레이터 설정(✏️)에서 **RAM을 2GB**로 낮추면 빌드할 때 덜 버벅입니다.

---

## 3. 처음 실행하기

### 3-1. 브랜치 받기

```bash
git fetch origin
git checkout sj
git pull
```

### 3-2. 네이버 지도 Client ID 설정

```bash
cd frontend
cp .env.example .env          # Windows PowerShell: copy .env.example .env
```

`frontend/.env` 파일을 열어서 팀 채팅에서 받은 값을 넣습니다:

```
NAVER_MAP_CLIENT_ID=여기에_받은_값
```

> - `.env`는 `.gitignore`에 들어있어서 커밋되지 않습니다. **절대 다른 파일에 직접 붙여넣어 커밋하지 마세요.**
> - 이 값이 없으면 빌드는 되지만 **지도가 회색 화면**으로만 나옵니다.

### 3-3. 설치 & 빌드 & 실행

1번에서 준비한 휴대폰을 연결하거나 에뮬레이터를 켠 상태에서:

```bash
npm install
npm run android
```

- `npm run android` 하나로 **빌드 → 설치 → 개발 서버(Metro) 실행 → 앱 실행**까지 한 번에 됩니다.
- **첫 빌드는 10~15분** 걸립니다. 다음부터는 훨씬 빠릅니다.
- 끝나면 기기에 **댕산책** 앱이 뜹니다. 터미널은 끄지 말고 그대로 두세요 (Metro가 돌고 있음).

---

## 4. 두 번째부터 실행하기

앱이 이미 설치돼 있고, **JS/TS 코드만 바뀌었다면** 다시 빌드할 필요가 없습니다.

```bash
cd frontend
npx expo start
```

`Waiting on http://localhost:8081` 이 나오면 → 기기에서 **댕산책 앱 아이콘**을 눌러 실행합니다.

> ⚠️ `npx expo start` 화면에서 **`a` 키를 누르지 마세요.** Expo Go를 설치하려고 해서 실행되지 않습니다. 앱 아이콘을 직접 누르세요.

**다시 빌드(`npm run android`)가 필요한 경우**
- `git pull` 후 `package.json`(라이브러리)이 바뀌었을 때 → `npm install` 후 `npm run android`
- `app.json` / `app.config.js`가 바뀌었을 때
- 앱을 삭제했을 때

---

## 5. 지도 기능 테스트하기

1. 앱 실행 → 로그인 화면에서 **이메일로 로그인 → 로그인** (아직 실제 로그인 없음, 입력 없이 통과)
2. 하단 탭 **지도** 선택
3. 아래 시나리오를 확인합니다.

| # | 해보기 | 기대 결과 |
|---|---|---|
| 1 | 지도 탭 진입 | "산책 지도" 제목 아래 둥근 카드 안에 네이버 지도 (처음엔 서울시청) |
| 2 | 안내 팝업 "위치 권한이 필요해요" → **계속** | 시스템 권한 팝업 (정확한 위치 / 대략적 위치) |
| 3 | **앱 사용 중에만 허용** | 내 위치(파란 점)로 이동 + 왼쪽 아래 현위치 버튼 ◎ |
| 4 | (권한 초기화 후) **허용 안함** | 지도 카드 아래 배너 + **권한 허용하기** 버튼 |
| 5 | 권한 허용하기 → 계속 → 또 **허용 안함** | 버튼이 **설정에서 허용하기**로 바뀜 |
| 6 | 설정에서 허용하기 → 위치 권한 허용 → 뒤로가기 | 앱으로 돌아오자마자 내 위치 표시 |
| 7 | 홈 / 커뮤니티 / 마켓 / 프로필 탭 | 이전과 동일 |

**권한 테스트를 처음부터 다시 하려면** (앱 데이터·권한 초기화):

```bash
adb shell pm clear com.dangsanchaekapp
```

→ 앱 다시 실행 → 로그인 → 지도 탭부터 다시.

---

## 6. 위치 바꿔보기

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
> - 지도를 손으로 움직였다면 현위치 버튼 ◎을 눌러야 새 위치로 이동합니다.

**걷는 것처럼 움직이기**: 같은 Location 화면 → **Routes** 탭 → 출발/도착 지점 찍기 → **Play route**

### 실제 휴대폰

- 진짜 GPS를 사용하므로 실제로 이동하면 위치가 바뀝니다.
- 책상에서 테스트하려면 "Fake GPS" 같은 가짜 위치 앱 설치 → 개발자 옵션 → **모의 위치 앱 선택**에서 그 앱 지정.

---

## 7. 문제 해결

| 증상 | 원인 / 해결 |
|---|---|
| **지도가 회색 격자만 나옴** | ① `frontend/.env`에 `NAVER_MAP_CLIENT_ID`가 없음 → 넣고 `npm run android` 다시 ② 처음 실행 시 타일 로딩에 1~2분 걸릴 수 있음 → 잠시 기다리기 |
| 휴대폰에서 **Expo Go**로 열려고 했는데 안 됨 | 정상입니다. Expo Go는 지원하지 않습니다 → [3-3](#3-3-설치--빌드--실행) 방식으로 |
| `adb` 명령어를 찾을 수 없음 | [1-3 환경 변수](#1-3-환경-변수-설정-windows) 설정 후 **터미널 새로 열기** |
| 빌드 중 `JAVA_HOME` 관련 오류 | `JAVA_HOME`을 Android Studio의 `jbr` 폴더로 설정 ([1-3](#1-3-환경-변수-설정-windows)) |
| `SDK location not found` | `ANDROID_HOME` 환경 변수 설정 후 터미널 새로 열기 |
| `adb devices`에 기기가 안 보임 / `unauthorized` | USB 케이블 재연결, 휴대폰의 "USB 디버깅 허용" 팝업에서 허용 |
| **코드를 고쳤는데 화면이 안 바뀜** | 앱이 개발 서버와 연결이 끊겨 예전 코드로 실행 중일 수 있음 → 터미널 `Ctrl+C` 후 `npx expo start --clear`, 앱 완전 종료 후 다시 실행 |
| 빨간 화면 "Unable to load script" / Metro 연결 실패 | `npx expo start`가 켜져 있는지 확인. 휴대폰(USB)이라면 `adb reverse tcp:8081 tcp:8081` |
| `Port 8081 is being used` | 이미 켜진 Metro 터미널이 있음 → 그 터미널을 쓰거나 끄고 다시 실행 |
| 에뮬레이터가 검은 화면에서 안 넘어감 | 에뮬레이터 종료 → Device Manager에서 ⋮ → **Cold Boot Now** |
| 빌드가 너무 느리거나 PC가 멈춤 | 크롬 등 다른 프로그램 닫기. 빌드 후 `cd android && ./gradlew --stop` 으로 빌드 프로세스 정리 |
| `git pull` 후 실행이 안 됨 | `npm install` → `npm run android` 순서로 다시 |

---

## 8. 명령어 모음

```bash
# 처음 한 번
git checkout sj && git pull
cd frontend
cp .env.example .env          # NAVER_MAP_CLIENT_ID 입력
npm install
npm run android               # 빌드 + 설치 + 실행 (첫 빌드 10~15분)

# 평소
cd frontend
npx expo start                # 실행 후 기기에서 앱 아이콘 누르기

# 화면이 안 바뀔 때
npx expo start --clear

# 기기 연결 확인
adb devices

# 권한·데이터 초기화
adb shell pm clear com.dangsanchaekapp

# 에뮬레이터 위치 변경 (경도 위도)
adb emu geo fix 127.0374 37.5444
```

---

문의: 김석준 (`sj` 브랜치 — 지도 / 현재 위치)
