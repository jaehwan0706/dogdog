// app.json 을 기본으로 쓰고, 네이버 지도 설정만 여기서 덧붙인다.
// Client ID 는 git 에 올리지 않도록 frontend/.env 의 NAVER_MAP_CLIENT_ID 에서 읽는다. (.env.example 참고)
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
        client_id: process.env.NAVER_MAP_CLIENT_ID ?? '',
        android: {
          ACCESS_FINE_LOCATION: true,
          ACCESS_COARSE_LOCATION: true,
        },
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
