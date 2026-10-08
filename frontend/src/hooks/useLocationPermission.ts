import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, AppState } from 'react-native';
import * as Location from 'expo-location';

// granted: 허용 / denied: 거부(다시 물어볼 수 있음) / blocked: 다시 물어볼 수 없음(설정에서만 변경)
// checking: 아직 확인 중
export type LocationPermissionStatus =
  | 'checking'
  | 'granted'
  | 'denied'
  | 'blocked';

// expo-location 응답을 앱에서 쓰는 상태로 변환 (iOS/Android 공통)
// - Android "다시 묻지 않음", iOS 한 번 거부한 경우 → canAskAgain 이 false
function toStatus(
  response: Location.LocationPermissionResponse,
): LocationPermissionStatus {
  if (response.granted) {
    return 'granted';
  }
  return response.canAskAgain ? 'denied' : 'blocked';
}

// 시스템 팝업 전에 왜 위치가 필요한지 먼저 설명 (사전 안내)
function showPrePrompt(): Promise<boolean> {
  return new Promise(resolve => {
    Alert.alert(
      '위치 권한이 필요해요',
      '내 주변 산책로와 시설을 보여주고 산책 경로를 기록하려면 위치 권한이 필요해요.',
      [
        { text: '나중에', style: 'cancel', onPress: () => resolve(false) },
        { text: '계속', onPress: () => resolve(true) },
      ],
      { cancelable: false },
    );
  });
}

export function useLocationPermission() {
  const [status, setStatus] = useState<LocationPermissionStatus>('checking');
  // 요청 진행 중에 버튼을 연타해도 사전 안내/시스템 팝업이 겹치지 않도록 막음
  const isRequesting = useRef(false);

  const request = useCallback(async () => {
    if (isRequesting.current) {
      return;
    }
    isRequesting.current = true;
    try {
      // 이미 허용됐거나 다시 물어볼 수 없으면 팝업 없이 상태만 반영
      const current = await Location.getForegroundPermissionsAsync();
      if (current.granted || !current.canAskAgain) {
        setStatus(toStatus(current));
        return;
      }

      const ok = await showPrePrompt();
      if (!ok) {
        setStatus('denied');
        return;
      }

      // Android 12+ 에서는 FINE + COARSE 를 함께 요청해 "정확한 위치" 선택지가 나옴 (expo-location 이 처리)
      const result = await Location.requestForegroundPermissionsAsync();
      setStatus(toStatus(result));
    } finally {
      isRequesting.current = false;
    }
  }, []);

  useEffect(() => {
    request();
  }, [request]);

  // 설정 화면에서 권한을 켜고 앱으로 돌아온 경우를 반영 (팝업 없이 확인만)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async state => {
      if (state !== 'active' || isRequesting.current) {
        return;
      }
      const current = await Location.getForegroundPermissionsAsync();
      if (current.granted) {
        setStatus('granted');
      }
    });
    return () => subscription.remove();
  }, []);

  return { status, request };
}
