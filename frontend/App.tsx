import { StatusBar } from 'expo-status-bar';
import { RootNavigator } from './src/navigation/RootNavigator';
import { LoginScreen } from './src/screens/auth/LoginScreen';
import { useState } from 'react';

export default function App() {
  const [isSignedIn, setIsSignedIn] = useState(false);

  return (
    <>
      {isSignedIn ? <RootNavigator /> : <LoginScreen onLogin={() => setIsSignedIn(true)} />}
      <StatusBar style="dark" />
    </>
  );
}
