import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';
import { LoginScreen } from './src/screens/auth/LoginScreen';
import { useAuthSession } from './src/store/authStore';

export default function App() {
  // 로그인/회원가입 성공 시 세션이 생기고, 토큰 재발급까지 실패하면 비워져 로그인 화면으로 돌아온다
  const session = useAuthSession();

  // SafeAreaView 는 이 Provider 안에서만 동작 (웹은 없으면 "No safe area value available" 오류)
  return (
    <SafeAreaProvider>
      {session ? <RootNavigator /> : <LoginScreen />}
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
