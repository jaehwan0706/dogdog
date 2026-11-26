import * as SecureStore from 'expo-secure-store';

// 마지막으로 받은 내 위치. 다음에 지도를 열 때 서울시청 대신 여기서 시작한다 (기기에만 저장, 서버로 보내지 않음)
const KEY = 'dangsanchaek.lastLocation';

export type SavedLocation = { latitude: number; longitude: number };

export const lastLocationStorage = {
  load: async (): Promise<SavedLocation | null> => {
    try {
      const raw = await SecureStore.getItemAsync(KEY);
      return raw ? parse(raw) : null;
    } catch {
      return null;
    }
  },
  save: (location: SavedLocation) =>
    SecureStore.setItemAsync(KEY, JSON.stringify({ latitude: location.latitude, longitude: location.longitude })).catch(() => {}),
};

export function parse(raw: string): SavedLocation | null {
  const value = JSON.parse(raw) as Partial<SavedLocation>;
  return typeof value.latitude === 'number' && typeof value.longitude === 'number'
    ? { latitude: value.latitude, longitude: value.longitude }
    : null;
}
