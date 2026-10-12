import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';
import { LoginScreen } from './src/screens/auth/LoginScreen';
import { useState } from 'react';

export default function App() {
  const [isSignedIn, setIsSignedIn] = useState(false);

  // SafeAreaView 는 이 Provider 안에서만 동작 (웹은 없으면 "No safe area value available" 오류)
  return (
    <SafeAreaProvider>
      {isSignedIn ? <RootNavigator /> : <LoginScreen onLogin={() => setIsSignedIn(true)} />}
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
