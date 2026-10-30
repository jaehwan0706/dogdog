// 앱(WebView)·웹(iframe) 지도 컴포넌트가 함께 쓰는 설정·타입·안내 화면
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import type { Coordinate } from '../../hooks/useCurrentLocation';
import { colors, spacing, typography } from '../../theme';
import type { MapCamera } from './naverMapHtml';

// .env 의 EXPO_PUBLIC_ 값은 빌드 때 JS 번들에 들어감 (웹 지도 키는 원래 공개되는 값이고, 네이버 콘솔의 URL 제한으로 보호)
export const CLIENT_ID = process.env.EXPO_PUBLIC_NAVER_MAP_CLIENT_ID ?? '';

export type MapError = 'missingClientId' | 'authFailure' | 'loadError';

export const ERROR_MESSAGES: Record<MapError, string> = {
  missingClientId: 'frontend/.env 에 EXPO_PUBLIC_NAVER_MAP_CLIENT_ID 가 없어요. (.env.example 참고)',
  authFailure: '네이버 지도 인증에 실패했어요. Client ID 와 네이버 콘솔의 Web 서비스 URL 등록을 확인해 주세요.',
  loadError: '지도를 불러오지 못했어요. 인터넷 연결을 확인해 주세요.',
};

export type NaverWebMapProps = {
  initialCamera: MapCamera;
  // 표시할 내 위치 (없으면 표시 안 함)
  myLocation: Coordinate | null;
  // true 면 내 위치가 바뀔 때마다 지도가 따라감
  follow: boolean;
  // 사용자가 지도를 직접 끌었을 때
  onUserGesture?: () => void;
  // 지도에 썸네일로 표시할 사진 핀
  photoPins?: MapPhotoPin[];
  onPhotoPinPress?: (pinId: number) => void;
  style?: StyleProp<ViewStyle>;
};

export type MapPhotoPin = { id: number; latitude: number; longitude: number; imageUrl: string };

// 지도 페이지가 보낸 메시지(JSON 문자열) 해석. 모르는 형식이면 null
export function parseMapMessage(data: unknown): { type?: string } | null {
  if (typeof data !== 'string') {
    return null;
  }
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function MapErrorView({ message, style }: { message: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.error, style]}>
      <Text style={styles.errorText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  error: { alignItems: 'center', backgroundColor: colors.ivorySoft, justifyContent: 'center', padding: spacing.lg },
  errorText: { color: colors.inkSoft, textAlign: 'center', ...typography.body },
});
