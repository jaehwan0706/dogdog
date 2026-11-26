import { apiRequest } from '../client';
import { isMockAuth } from '../auth/authService';
import { authStore } from '../../store/authStore';
import type { User } from '../../types/auth';

export const userService = {
  getMe: () => (isMockAuth ? Promise.resolve(authStore.getSession()!.user) : apiRequest<User>('/users/me')),
  // 닉네임 중복 확인 (가입 화면과 같은 서버 API)
  async isNicknameAvailable(nickname: string): Promise<boolean> {
    if (isMockAuth) return true;
    const result = await apiRequest<{ available: boolean }>('/auth/check-nickname', { query: { nickname } });
    return result.available;
  },
  // 닉네임 변경: 서버에 저장하고 세션의 사용자 정보도 바꾼다 (화면 곳곳의 닉네임이 바로 바뀜)
  async updateNickname(nickname: string): Promise<User> {
    const current = authStore.getSession()!.user;
    const user = isMockAuth
      ? { ...current, nickname }
      : await apiRequest<User>('/users/me', { method: 'PATCH', body: { nickname } });
    authStore.updateUser(user);
    return user;
  },
  // 회원 탈퇴: 서버에서 계정을 지운 뒤 세션도 비워 로그인 화면으로 돌아간다
  async withdraw() {
    if (!isMockAuth) await apiRequest<void>('/users/me', { method: 'DELETE' });
    authStore.clear();
  },
};
