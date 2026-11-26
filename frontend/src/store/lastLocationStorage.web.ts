// 웹은 보안 저장소가 없어 localStorage 를 쓴다. 차단된 브라우저에서는 저장 없이 동작한다.
const KEY = 'dangsanchaek.lastLocation';

export type SavedLocation = { latitude: number; longitude: number };

export const lastLocationStorage = {
  load: async (): Promise<SavedLocation | null> => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (!raw) return null;
      const value = JSON.parse(raw) as Partial<SavedLocation>;
      return typeof value.latitude === 'number' && typeof value.longitude === 'number'
        ? { latitude: value.latitude, longitude: value.longitude }
        : null;
    } catch {
      return null;
    }
  },
  save: async (location: SavedLocation) => {
    try {
      window.localStorage.setItem(KEY, JSON.stringify({ latitude: location.latitude, longitude: location.longitude }));
    } catch {
      // 저장이 막혀 있어도 지도는 동작한다
    }
  },
};
