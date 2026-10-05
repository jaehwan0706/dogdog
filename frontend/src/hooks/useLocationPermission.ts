import { useCallback, useEffect, useState } from 'react';
import { Alert, AppState, PermissionsAndroid, Platform } from 'react-native';

// granted: 허용 / denied: 거부(다시 물어볼 수 있음) / blocked: "다시 묻지 않음" 거부
// checking: 아직 확인 중
export type LocationPermissionStatus =
  | 'checking'
  | 'granted'
  | 'denied'
  | 'blocked';

const FINE_LOCATION = PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION;
const COARSE_LOCATION = PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION;

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

  const request = useCallback(async () => {
    if (Platform.OS !== 'android') {
      // iOS 는 아직 대상이 아님 (에뮬레이터는 Android 만 사용)
      setStatus('denied');
      return;
    }

    // 이미 허용돼 있으면 팝업 없이 바로 통과
    const alreadyGranted =
      (await PermissionsAndroid.check(FINE_LOCATION)) ||
      (await PermissionsAndroid.check(COARSE_LOCATION));
    if (alreadyGranted) {
      setStatus('granted');
      return;
    }

    const ok = await showPrePrompt();
    if (!ok) {
      setStatus('denied');
      return;
    }

    // Android 12+ 에서는 FINE 과 COARSE 를 함께 요청해야 "정확한 위치" 선택지가 나옴
    const result = await PermissionsAndroid.requestMultiple([
      FINE_LOCATION,
      COARSE_LOCATION,
    ]);
    const fine = result[FINE_LOCATION];
    const coarse = result[COARSE_LOCATION];

    if (
      fine === PermissionsAndroid.RESULTS.GRANTED ||
      coarse === PermissionsAndroid.RESULTS.GRANTED
    ) {
      setStatus('granted');
    } else if (fine === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
      setStatus('blocked');
    } else {
      setStatus('denied');
    }
  }, []);

  useEffect(() => {
    request();
  }, [request]);

  // 설정 화면에서 권한을 켜고 앱으로 돌아온 경우를 반영 (팝업 없이 확인만)
  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }
    const subscription = AppState.addEventListener('change', async state => {
      if (state !== 'active') {
        return;
      }
      const granted =
        (await PermissionsAndroid.check(FINE_LOCATION)) ||
        (await PermissionsAndroid.check(COARSE_LOCATION));
      if (granted) {
        setStatus('granted');
      }
    });
    return () => subscription.remove();
  }, []);

  return { status, request };
}
