import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { authService } from './src/api/auth/authService';
import { AppButton } from './src/components/AppButton';
import { RootNavigator } from './src/navigation/RootNavigator';
import { LoginScreen } from './src/screens/auth/LoginScreen';
import { NicknameSetupScreen } from './src/screens/auth/NicknameSetupScreen';
import { DogOnboardingScreen } from './src/screens/dog/DogOnboardingScreen';
import { useAuthSession } from './src/store/authStore';
import { dogStore, useDogs } from './src/store/dogStore';
import { colors } from './src/theme';

// 웹에서 소셜 로그인 팝업이 /auth/callback 으로 돌아오면 결과를 원래 창에 넘기고 팝업을 닫는다 (앱에서는 아무 일도 안 함)
WebBrowser.maybeCompleteAuthSession();

export default function App() {
  // 로그인/회원가입 성공 시 세션이 생기고, 토큰 재발급까지 실패하면 비워져 로그인 화면으로 돌아온다
  const session = useAuthSession();
  const [restoring, setRestoring] = useState(true);

  // 저장된 로그인 복구가 끝나기 전에 로그인 화면이 깜빡이지 않도록 기다린다
  useEffect(() => {
    authService.restoreSession().finally(() => setRestoring(false));
  }, []);

  // SafeAreaView 는 이 Provider 안에서만 동작 (웹은 없으면 "No safe area value available" 오류)
  return (
    <SafeAreaProvider>
      {restoring
        ? <View style={styles.center}><ActivityIndicator color={colors.forest} /></View>
        : !session
          ? <LoginScreen />
          // 카카오·구글로 처음 가입했으면 반려견 등록 전에 닉네임부터 정한다
          : session.needsNickname
            ? <NicknameSetupScreen />
            : <SignedInApp key={session.user.id} />}
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}

// 로그인 후: 반려견 목록을 불러와 없으면 온보딩, 있으면 메인 탭
function SignedInApp() {
  const { dogs, error } = useDogs();

  useEffect(() => {
    dogStore.load();
    return () => dogStore.reset();
  }, []);

  if (dogs === null) {
    return (
      <View style={styles.center}>
        {error ? <AppButton label="다시 시도" variant="ghost" onPress={() => dogStore.load()} /> : <ActivityIndicator color={colors.forest} />}
      </View>
    );
  }
  return dogs.length === 0 ? <DogOnboardingScreen /> : <RootNavigator />;
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', backgroundColor: colors.ivory, flex: 1, justifyContent: 'center' },
});
