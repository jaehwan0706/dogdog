import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import type { Coordinate } from '../../hooks/useCurrentLocation';
import { colors, spacing, typography } from '../../theme';
import { buildNaverMapHtml, type MapCamera } from './naverMapHtml';

// .env 의 EXPO_PUBLIC_ 값은 빌드 때 JS 번들에 들어감 (웹 지도 키는 원래 공개되는 값이고, 네이버 콘솔의 URL 제한으로 보호)
const CLIENT_ID = process.env.EXPO_PUBLIC_NAVER_MAP_CLIENT_ID ?? '';

// 네이버 콘솔 "Web 서비스 URL" 에 이 주소를 등록해야 인증이 통과됨
const BASE_URL = 'http://localhost';

type MapError = 'missingClientId' | 'authFailure' | 'loadError';

const ERROR_MESSAGES: Record<MapError, string> = {
  missingClientId: 'frontend/.env 에 EXPO_PUBLIC_NAVER_MAP_CLIENT_ID 가 없어요. (.env.example 참고)',
  authFailure: '네이버 지도 인증에 실패했어요. Client ID 와 Web 서비스 URL(http://localhost) 등록을 확인해 주세요.',
  loadError: '지도를 불러오지 못했어요. 인터넷 연결을 확인해 주세요.',
};

type Props = {
  initialCamera: MapCamera;
  // 표시할 내 위치 (없으면 표시 안 함)
  myLocation: Coordinate | null;
  // true 면 내 위치가 바뀔 때마다 지도가 따라감
  follow: boolean;
  // 사용자가 지도를 직접 끌었을 때
  onUserGesture?: () => void;
  style?: StyleProp<ViewStyle>;
};

export function NaverWebMap({ initialCamera, myLocation, follow, onUserGesture, style }: Props) {
  const webViewRef = useRef<WebView>(null);
  // 처음 한 번만 만들기 (다시 만들면 WebView 가 새로고침됨)
  const [html] = useState(() => buildNaverMapHtml(CLIENT_ID, initialCamera));
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<MapError | null>(CLIENT_ID ? null : 'missingClientId');

  // 지도 준비가 끝난 뒤 내 위치·따라가기 상태가 바뀌면 지도에 전달
  useEffect(() => {
    if (!isReady || !myLocation) {
      return;
    }
    const message = { type: 'location', ...myLocation, follow };
    webViewRef.current?.injectJavaScript(
      `window.__fromApp && window.__fromApp(${JSON.stringify(message)}); true;`,
    );
  }, [isReady, myLocation, follow]);

  const handleMessage = (event: WebViewMessageEvent) => {
    let message: { type?: string };
    try {
      message = JSON.parse(event.nativeEvent.data);
    } catch {
      return;
    }
    switch (message.type) {
      case 'ready':
        setIsReady(true);
        break;
      case 'userGesture':
        onUserGesture?.();
        break;
      case 'authFailure':
      case 'loadError':
        setError(message.type);
        break;
    }
  };

  if (error === 'missingClientId') {
    return <ErrorView style={style} message={ERROR_MESSAGES[error]} />;
  }

  return (
    <View style={style}>
      <WebView
        ref={webViewRef}
        style={styles.webView}
        source={{ html, baseUrl: BASE_URL }}
        originWhitelist={['*']}
        onMessage={handleMessage}
        onError={() => setError('loadError')}
        // 지도 자체가 스크롤·줌을 처리하므로 WebView 의 스크롤/튕김은 끔
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        setSupportMultipleWindows={false}
      />
      {error && <ErrorView style={StyleSheet.absoluteFill} message={ERROR_MESSAGES[error]} />}
    </View>
  );
}

function ErrorView({ message, style }: { message: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.error, style]}>
      <Text style={styles.errorText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  webView: { flex: 1 },
  error: { alignItems: 'center', backgroundColor: colors.ivorySoft, justifyContent: 'center', padding: spacing.lg },
  errorText: { color: colors.inkSoft, textAlign: 'center', ...typography.body },
});
