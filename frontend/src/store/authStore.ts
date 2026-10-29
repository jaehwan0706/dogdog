import { useSyncExternalStore } from 'react';
import type { TokenResponse, User } from '../types/auth';

// 로그인 세션(토큰 + 사용자). 지금은 메모리에만 두므로 앱을 새로 켜면 다시 로그인해야 한다.
// 영구 저장(iOS/Android 보안 저장소, 웹 대체 저장소)은 별도 작업으로 결정한다.
export type AuthSession = { accessToken: string; refreshToken: string; user: User };

let session: AuthSession | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export const authStore = {
  getSession: () => session,
  setSession(response: TokenResponse) {
    session = { accessToken: response.accessToken, refreshToken: response.refreshToken, user: response.user };
    emit();
  },
  clear() {
    session = null;
    emit();
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

export function useAuthSession() {
  return useSyncExternalStore(authStore.subscribe, authStore.getSession, authStore.getSession);
}
