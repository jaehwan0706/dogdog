// app.json 을 기본으로 쓰고, 플랫폼별 설정만 여기서 덧붙인다.
// 지도는 WebView + 네이버 지도 JavaScript API 라서 네이티브 지도 플러그인이 없음 → Expo Go 로 실행 가능
// Client ID 는 git 에 올리지 않도록 frontend/.env 의 EXPO_PUBLIC_NAVER_MAP_CLIENT_ID 에서 읽는다. (.env.example 참고)
if (!process.env.EXPO_PUBLIC_NAVER_MAP_CLIENT_ID) {
  console.warn(
    '[app.config] EXPO_PUBLIC_NAVER_MAP_CLIENT_ID 가 frontend/.env 에 없습니다. 지도 대신 안내 문구가 나옵니다. (.env.example 참고)',
  );
}

module.exports = ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    // 개발 빌드(expo run:android)를 만들 때 쓰는 패키지 이름
    package: 'com.dangsanchaekapp',
  },
  plugins: [
    ...(config.plugins ?? []),
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
