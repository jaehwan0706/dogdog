import { useEffect, useState } from 'react';
import { lastLocationStorage } from '../store/lastLocationStorage';

// 위치를 아직 모를 때(첫 실행, 권한 거부) 보여 줄 좌표 (서울시청)
export const FALLBACK_CENTER = { latitude: 37.5666, longitude: 126.9784 };

export type StartCamera = { latitude: number; longitude: number; zoom: number };

// 지도를 처음 열 때의 위치: 지난번에 받은 내 위치가 있으면 거기서, 없으면 서울시청에서 시작한다.
// 지도는 처음 만들 때만 시작 위치를 읽으므로, 저장된 위치를 읽기 전(null)에는 지도를 그리지 않는다 (보통 수 ms)
export function useStartCamera(zoom: number): StartCamera | null {
  const [camera, setCamera] = useState<StartCamera | null>(null);

  useEffect(() => {
    let cancelled = false;
    lastLocationStorage.load().then((saved) => {
      if (!cancelled) setCamera({ ...(saved ?? FALLBACK_CENTER), zoom });
    });
    return () => {
      cancelled = true;
    };
  }, [zoom]);

  return camera;
}
