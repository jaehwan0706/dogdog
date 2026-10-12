import { useEffect, useState } from 'react';
import * as Location from 'expo-location';

export type Coordinate = {
  latitude: number;
  longitude: number;
  // 오차 반경(m). 기기가 알려주지 않으면 null
  accuracy: number | null;
};

// 위치 권한이 허용된 동안(enabled) 내 위치를 계속 받아온다.
// 지도(WebView)는 위치를 직접 받지 않고, 여기서 받은 좌표를 전달받아 그리기만 함
export function useCurrentLocation(enabled: boolean) {
  const [location, setLocation] = useState<Coordinate | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    let subscription: Location.LocationSubscription | null = null;
    let cancelled = false;

    Location.watchPositionAsync(
      // 산책 중 경로 기록까지 고려해 High, 5m 이상 움직였을 때만 갱신
      { accuracy: Location.Accuracy.High, distanceInterval: 5 },
      ({ coords }) =>
        setLocation({
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy,
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
