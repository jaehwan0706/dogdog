// 웹에는 Keychain 같은 보안 저장소가 없어 localStorage 를 쓴다 (웹은 개발·체험용). 차단된 브라우저에서는 저장 없이 동작한다.
const KEY = 'dangsanchaek.refreshToken';

export const tokenStorage = {
  async load(): Promise<string | null> {
    try {
      return window.localStorage.getItem(KEY);
    } catch {
      return null;
    }
  },
  async save(token: string): Promise<void> {
    try {
      window.localStorage.setItem(KEY, token);
    } catch {
      // 저장 실패 시 새로고침하면 다시 로그인
    }
  },
  async remove(): Promise<void> {
    try {
      window.localStorage.removeItem(KEY);
    } catch {
      // 저장소 접근 불가: 지울 값도 없음
    }
  },
};
