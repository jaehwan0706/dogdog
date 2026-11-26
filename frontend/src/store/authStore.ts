import { useSyncExternalStore } from 'react';
import type { TokenResponse, User } from '../types/auth';
import { tokenStorage } from './tokenStorage';

// 로그인 세션(토큰 + 사용자). Refresh Token 만 기기에 저장하고, 앱을 켤 때 authService.restoreSession 이 세션을 복구한다.
export type AuthSession = { accessToken: string; refreshToken: string; user: User; needsNickname: boolean };

let session: AuthSession | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export const authStore = {
  getSession: () => session,
  setSession(response: TokenResponse) {
    session = {
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      user: response.user,
      // 카카오·구글로 처음 가입했으면 소셜 이름이 그대로 닉네임이 되므로, 반려견 등록 전에 닉네임을 정하게 한다
      // (토큰 재발급 응답은 isNewUser 가 false 라, 앱을 다시 켜면 이 단계는 넘어간다)
      needsNickname: response.isNewUser && response.user.provider !== 'LOCAL',
    };
    tokenStorage.save(response.refreshToken);
    emit();
  },
  // 토큰은 그대로 두고 사용자 정보만 바꾼다 (예: 닉네임 변경)
  updateUser(user: User) {
    if (!session) return;
    session = { ...session, user };
    emit();
  },
  // 가입 직후 닉네임 정하기를 마쳤을 때
  finishNicknameSetup() {
    if (!session) return;
    session = { ...session, needsNickname: false };
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
