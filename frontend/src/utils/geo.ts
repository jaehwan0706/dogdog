type LatLng = { latitude: number; longitude: number };

const EARTH_RADIUS_METERS = 6_371_000;
const toRadians = (degree: number) => (degree * Math.PI) / 180;

// 두 좌표 사이 거리(m). 서버(walk/service/Distance.java)와 같은 하버사인 공식
export function distanceMeters(a: LatLng, b: LatLng) {
  const dLat = toRadians(b.latitude - a.latitude);
  const dLng = toRadians(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(a.latitude)) * Math.cos(toRadians(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function routeMeters(route: LatLng[]) {
  let total = 0;
  for (let i = 1; i < route.length; i += 1) total += distanceMeters(route[i - 1], route[i]);
  return total;
}

// 1000m 미만은 m, 이상은 km 소수 둘째 자리 (예: 850m, 2.31km)
export function formatDistance(meters: number) {
  return meters < 1000 ? `${Math.round(meters)}m` : `${(meters / 1000).toFixed(2)}km`;
}

// 산책 중 타이머 표시 (예: 05:07, 1:02:30)
export function formatClock(totalSeconds: number) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (value: number) => String(value).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

// 기록 요약 표시 (예: 18분, 1시간 5분)
export function formatDuration(totalSeconds: number) {
  const minutes = Math.round(totalSeconds / 60);
  if (minutes < 60) return `${minutes}분`;
  const rest = minutes % 60;
  return rest ? `${Math.floor(minutes / 60)}시간 ${rest}분` : `${Math.floor(minutes / 60)}시간`;
}
