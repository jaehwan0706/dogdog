import { useSyncExternalStore } from 'react';
import type { TokenResponse, User } from '../types/auth';
import { tokenStorage } from './tokenStorage';

// 로그인 세션(토큰 + 사용자). Refresh Token 만 기기에 저장하고, 앱을 켤 때 authService.restoreSession 이 세션을 복구한다.
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
    tokenStorage.save(response.refreshToken);
    emit();
  },
  clear() {
    session = null;
    tokenStorage.remove();
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
