import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as Location from 'expo-location';

export type Coordinate = {
  latitude: number;
  longitude: number;
  // 오차 반경(m). 기기가 알려주지 않으면 null
  accuracy: number | null;
  // 위치를 측정한 시각(ms)
  timestamp: number;
};

// 위치 권한이 허용된 동안(enabled) 내 위치를 계속 받아온다.
// 지도(WebView)는 위치를 직접 받지 않고, 여기서 받은 좌표를 전달받아 그리기만 함
export function useCurrentLocation(enabled: boolean) {
  const [location, setLocation] = useState<Coordinate | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    // 웹은 expo-location 을 거치지 않고 브라우저 위치 API 를 직접 쓴다.
    // expo-location(웹)은 자기 구독 번호(1, 2, ...)로 콜백을 찾는데, 브라우저에는 watchPosition 이 돌려준 번호를 넘긴다.
    // Chrome(PC)은 이 번호도 1부터라 우연히 맞지만, WebKit(iPhone 의 Safari·Chrome 모두)은 setTimeout 과 같은 순번을 써서
    // 번호가 달라진다 → 위치가 와도 콜백을 못 찾고 감시를 끊어 버려 iPhone 웹에서만 내 위치가 안 뜬다.
    // 또 accuracy 옵션이 enableHighAccuracy 로 바뀌지 않고, 위치 오류도 버려진다
    if (Platform.OS === 'web') {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        console.warn('[useCurrentLocation] 이 브라우저는 위치를 지원하지 않습니다.');
        return;
      }
      const watchId = navigator.geolocation.watchPosition(
        ({ coords, timestamp }) =>
          setLocation({
            latitude: coords.latitude,
            longitude: coords.longitude,
            accuracy: coords.accuracy,
            timestamp,
          }),
        error => console.warn('[useCurrentLocation] 위치를 받을 수 없습니다.', error.code, error.message),
        { enableHighAccuracy: true, maximumAge: 10_000 },
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }

    let subscription: Location.LocationSubscription | null = null;
    let cancelled = false;

    Location.watchPositionAsync(
      // 산책 중 경로 기록까지 고려해 High, 5m 이상 움직였을 때만 갱신
      { accuracy: Location.Accuracy.High, distanceInterval: 5 },
      ({ coords, timestamp }) =>
        setLocation({
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy,
          timestamp,
        }),
    )
      .then(sub => {
        // 응답이 오기 전에 화면을 벗어났으면 바로 정리
        if (cancelled) {
          sub.remove();
        } else {
          subscription = sub;
        }
      })
      .catch(error => console.warn('[useCurrentLocation] 위치를 받을 수 없습니다.', error));

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [enabled]);

  return location;
}
