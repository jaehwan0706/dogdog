// app.json 을 기본으로 쓰고, 네이버 지도 설정만 여기서 덧붙인다.
// Client ID 는 git 에 올리지 않도록 frontend/.env 의 NAVER_MAP_CLIENT_ID 에서 읽는다. (.env.example 참고)
const NAVER_MAP_CLIENT_ID = process.env.NAVER_MAP_CLIENT_ID ?? '';

// .env 가 없으면 빌드는 되지만 지도가 회색 화면만 나오므로, 빌드/실행 때 바로 알 수 있게 경고
if (!NAVER_MAP_CLIENT_ID) {
  console.warn(
    '[app.config] NAVER_MAP_CLIENT_ID 가 frontend/.env 에 없습니다. 지도가 회색 화면으로 나옵니다. (.env.example 참고)',
  );
}

module.exports = ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    // 네이버 클라우드 콘솔에 등록한 Android 패키지 이름과 같아야 지도 인증이 통과됨
    package: 'com.dangsanchaekapp',
  },
  plugins: [
    ...(config.plugins ?? []),
    [
      '@mj-studio/react-native-naver-map',
      {
        client_id: NAVER_MAP_CLIENT_ID,
        android: {
          ACCESS_FINE_LOCATION: true,
          ACCESS_COARSE_LOCATION: true,
        },
      },
    ],
    [
      // 위치 권한 요청 (iOS/Android 공통). iOS 는 권한 팝업에 이 문구가 표시됨
      'expo-location',
      {
        locationWhenInUsePermission:
          '내 주변 산책로와 시설을 보여주고 산책 경로를 기록하려면 위치 권한이 필요해요.',
      },
    ],
    [
      'expo-build-properties',
      {
        android: {
          // 네이버 지도 SDK 는 Maven Central 이 아닌 네이버 저장소에 있음
          extraMavenRepos: ['https://repository.map.naver.com/archive/maven'],
        },
      },
    ],
  ],
});
