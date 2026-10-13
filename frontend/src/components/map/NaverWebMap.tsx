import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import {
  CLIENT_ID,
  ERROR_MESSAGES,
  MapErrorView,
  parseMapMessage,
  type MapError,
  type NaverWebMapProps,
} from './naverMapCommon';
import { buildNaverMapHtml } from './naverMapHtml';

// 앱(iOS/Android)용. 웹에서는 NaverWebMap.web.tsx 가 대신 쓰임 (react-native-webview 가 웹 미지원)

// 네이버 콘솔 "Web 서비스 URL" 에 이 주소를 등록해야 인증이 통과됨
const BASE_URL = 'http://localhost';

export function NaverWebMap({ initialCamera, myLocation, follow, onUserGesture, style }: NaverWebMapProps) {
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
    const message = parseMapMessage(event.nativeEvent.data);
    switch (message?.type) {
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
    return <MapErrorView style={style} message={ERROR_MESSAGES[error]} />;
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
      {error && <MapErrorView style={StyleSheet.absoluteFill} message={ERROR_MESSAGES[error]} />}
    </View>
  );
}

const styles = StyleSheet.create({
  webView: { flex: 1 },
});
