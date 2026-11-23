// app.json 을 기본으로 쓰고, 플랫폼별 설정만 여기서 덧붙인다.
// 지도는 WebView + 네이버 지도 JavaScript API 라서 네이티브 지도 플러그인이 없음 → Expo Go 로 실행 가능
// Client ID 는 git 에 올리지 않도록 frontend/.env 의 EXPO_PUBLIC_NAVER_MAP_CLIENT_ID 에서 읽는다. (.env.example 참고)
const fs = require('fs');
const path = require('path');

if (!process.env.EXPO_PUBLIC_NAVER_MAP_CLIENT_ID) {
  console.warn(
    '[app.config] EXPO_PUBLIC_NAVER_MAP_CLIENT_ID 가 frontend/.env 에 없습니다. 지도 대신 안내 문구가 나옵니다. (.env.example 참고)',
  );
}

// 스토어 등록용 앱 ID. 스토어에 한 번 올리면 바꿀 수 없다.
const APP_ID = 'com.dangsanchaek.app';

// 디자인 이미지가 들어오면 assets/ 에 아래 이름으로 넣는다. 파일이 없으면 Expo 기본 이미지로 빌드된다.
//   assets/icon.png            1024x1024 앱 아이콘 (iOS 는 투명 배경 불가)
//   assets/adaptive-icon.png   1024x1024 Android 아이콘 전경 (가운데 약 66% 안에 로고)
//   assets/splash.png          시작 화면 로고 (가운데에 표시, 배경색은 아래 SPLASH_BACKGROUND)
const asset = (name) => {
  const file = path.join(__dirname, 'assets', name);
  return fs.existsSync(file) ? `./assets/${name}` : undefined;
};
const SPLASH_BACKGROUND = '#F5F7F5'; // theme colors.ivory
const icon = asset('icon.png');
const adaptiveIcon = asset('adaptive-icon.png');
const splash = asset('splash.png');

module.exports = ({ config }) => ({
  ...config,
  ...(icon ? { icon } : {}),
  ios: {
    ...config.ios,
    bundleIdentifier: APP_ID,
  },
  android: {
    ...config.android,
    package: APP_ID,
    ...(adaptiveIcon ? { adaptiveIcon: { foregroundImage: adaptiveIcon, backgroundColor: SPLASH_BACKGROUND } } : {}),
  },
  plugins: [
    ...(config.plugins ?? []),
    ...(splash ? [['expo-splash-screen', { image: splash, imageWidth: 200, resizeMode: 'contain', backgroundColor: SPLASH_BACKGROUND }]] : []),
    [
      // 위치 권한 요청 (iOS/Android 공통). iOS 는 권한 팝업에 이 문구가 표시됨
      'expo-location',
      {
        locationWhenInUsePermission:
          '내 주변 산책로와 시설을 보여주고 산책 경로를 기록하려면 위치 권한이 필요해요.',
      },
    ],
    [
      // 사진 핀: 카메라 촬영 / 앨범에서 선택
      'expo-image-picker',
      {
        cameraPermission: '산책 중 사진을 찍어 지도에 사진 핀으로 남기려면 카메라 권한이 필요해요.',
        photosPermission: '앨범의 사진을 지도에 사진 핀으로 남기려면 사진 접근 권한이 필요해요.',
        microphonePermission: false,
      },
    ],
  ],
});
