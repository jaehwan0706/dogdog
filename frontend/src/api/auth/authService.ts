import { API_BASE_URL, apiRequest, setAccessTokenProvider, setUnauthorizedHandler } from '../client';
import { authStore } from '../../store/authStore';
import type { LoginRequest, SignupRequest, SocialProvider, TokenResponse } from '../../types/auth';

// EXPO_PUBLIC_API_BASE_URL 이 없으면 서버 없이 화면만 넘어가도록 가짜 토큰을 발급한다 (마켓 mock 과 같은 기준)
export const isMockAuth = !API_BASE_URL;

function mockToken(email: string, nickname: string): TokenResponse {
  return {
    tokenType: 'Bearer',
    accessToken: 'mock-access-token',
    accessTokenExpiresIn: 1800,
    refreshToken: 'mock-refresh-token',
    isNewUser: false,
    user: { id: 1, email, nickname, profileImageUrl: null, provider: 'LOCAL', role: 'USER', createdAt: new Date().toISOString() },
  };
}

async function signIn(request: () => Promise<TokenResponse>) {
  const response = await request();
  authStore.setSession(response);
  return response;
}

// 동시에 여러 요청이 401 을 받아도 재발급은 한 번만 (Refresh Token 은 1회용)
let refreshing: Promise<boolean> | null = null;

async function refreshSession(): Promise<boolean> {
  const current = authStore.getSession();
  if (!current || isMockAuth) return false;
  refreshing ??= apiRequest<TokenResponse>('/auth/refresh', { method: 'POST', body: { refreshToken: current.refreshToken }, skipAuthRetry: true })
    .then((response) => {
      authStore.setSession(response);
      return true;
    })
    .catch(() => {
      authStore.clear();
      return false;
    })
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

setAccessTokenProvider(() => authStore.getSession()?.accessToken ?? null);
setUnauthorizedHandler(refreshSession);

export const authService = {
  login: (request: LoginRequest) =>
    signIn(() => (isMockAuth ? Promise.resolve(mockToken(request.email, '보호자')) : apiRequest<TokenResponse>('/auth/login', { method: 'POST', body: request, skipAuthRetry: true }))),
  signup: (request: SignupRequest) =>
    signIn(() => (isMockAuth ? Promise.resolve(mockToken(request.email, request.nickname)) : apiRequest<TokenResponse>('/auth/signup', { method: 'POST', body: request, skipAuthRetry: true }))),
  // 소셜 SDK 연동 전까지는 개발 빌드에서만 백엔드 mock 토큰("mock:{소셜ID}:{이메일}", app.oauth.mock-enabled=true 필요)으로 로그인
  socialLogin: (provider: SocialProvider, token: string) =>
    signIn(() => (isMockAuth ? Promise.resolve(mockToken(`${provider}@dangsanchaek.dev`, '보호자')) : apiRequest<TokenResponse>(`/auth/social/${provider}`, { method: 'POST', body: { token }, skipAuthRetry: true }))),
  async logout() {
    const current = authStore.getSession();
    authStore.clear();
    if (current && !isMockAuth) {
      await apiRequest<void>('/auth/logout', { method: 'POST', body: { refreshToken: current.refreshToken }, skipAuthRetry: true }).catch(() => {});
    }
  },
};
