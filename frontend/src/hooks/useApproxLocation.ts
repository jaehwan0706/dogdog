import { useCallback, useEffect, useState } from 'react';
import * as Location from 'expo-location';

export type ApproxLocation = { latitude: number; longitude: number };
// unknown: 확인 중 / granted: 위치 받음(또는 받는 중) / denied: 권한 없음 / error: 위치를 못 받음
export type ApproxLocationStatus = 'unknown' | 'granted' | 'denied' | 'error';

// 최근 10분 안에 받은 위치가 있으면 그대로 쓴다 (날씨는 5km 격자라 정확한 위치가 필요 없음)
const MAX_AGE_MS = 10 * 60 * 1000;

// 날씨·추천처럼 대략적인 위치만 필요한 화면용. 지도와 달리 권한 안내 팝업을 먼저 띄우지 않고,
// 이미 허용된 경우에만 조용히 위치를 받는다. 허용 전이면 request() 로 시스템 팝업을 띄운다.
export function useApproxLocation() {
  const [status, setStatus] = useState<ApproxLocationStatus>('unknown');
  const [location, setLocation] = useState<ApproxLocation | null>(null);

  const locate = useCallback(async () => {
    try {
      const position = (await Location.getLastKnownPositionAsync({ maxAge: MAX_AGE_MS }))
        ?? (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
      // 약 100m 단위로 반올림해서 넘긴다 (같은 동네면 같은 값 → 화면이 불필요하게 다시 불러오지 않음)
      setLocation({
        latitude: Math.round(position.coords.latitude * 1000) / 1000,
        longitude: Math.round(position.coords.longitude * 1000) / 1000,
      });
      setStatus('granted');
    } catch (error) {
      console.warn('[useApproxLocation] 위치를 받을 수 없습니다.', error);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    Location.getForegroundPermissionsAsync()
      .then((permission) => (permission.granted ? locate() : setStatus('denied')))
      .catch(() => setStatus('denied'));
  }, [locate]);

  const request = useCallback(async () => {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.granted) {
      await locate();
    } else {
      setStatus('denied');
    }
  }, [locate]);

  return { status, location, request, refresh: locate };
}
