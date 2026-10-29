import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppButton } from './src/components/AppButton';
import { RootNavigator } from './src/navigation/RootNavigator';
import { LoginScreen } from './src/screens/auth/LoginScreen';
import { DogOnboardingScreen } from './src/screens/dog/DogOnboardingScreen';
import { useAuthSession } from './src/store/authStore';
import { dogStore, useDogs } from './src/store/dogStore';
import { colors } from './src/theme';

export default function App() {
  // 로그인/회원가입 성공 시 세션이 생기고, 토큰 재발급까지 실패하면 비워져 로그인 화면으로 돌아온다
  const session = useAuthSession();

  // SafeAreaView 는 이 Provider 안에서만 동작 (웹은 없으면 "No safe area value available" 오류)
  return (
    <SafeAreaProvider>
      {session ? <SignedInApp key={session.user.id} /> : <LoginScreen />}
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
