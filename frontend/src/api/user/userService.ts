import { apiRequest } from '../client';
import { isMockAuth } from '../auth/authService';
import { authStore } from '../../store/authStore';
import type { User } from '../../types/auth';

export const userService = {
  getMe: () => (isMockAuth ? Promise.resolve(authStore.getSession()!.user) : apiRequest<User>('/users/me')),
  // 회원 탈퇴: 서버에서 계정을 지운 뒤 세션도 비워 로그인 화면으로 돌아간다
  async withdraw() {
    if (!isMockAuth) await apiRequest<void>('/users/me', { method: 'DELETE' });
    authStore.clear();
  },
};
