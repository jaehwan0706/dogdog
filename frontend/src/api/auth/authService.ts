import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { API_BASE_URL, ApiError, apiRequest, setAccessTokenProvider, setUnauthorizedHandler } from '../client';
import { authStore } from '../../store/authStore';
import { tokenStorage } from '../../store/tokenStorage';
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
    .catch((e) => {
      // 서버가 토큰을 거부했을 때만 로그아웃한다. 네트워크 오류로 세션을 잃지 않도록 그 외에는 유지
      if (e instanceof ApiError && e.status === 401) authStore.clear();
      return false;
    })
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

// 웹에서 팝업이 막혀 로그인 창이 현재 탭에서 열렸다가 /auth/callback?ticket= 으로 돌아온 경우 여기서 로그인을 마친다.
// (팝업으로 열렸으면 App 의 maybeCompleteAuthSession 이 원래 창에 결과를 넘기므로 opener 가 있을 때는 건드리지 않음)
async function completeRedirectedSocialLogin(): Promise<boolean> {
  if (Platform.OS !== 'web' || window.location.pathname !== '/auth/callback') return false;
  // 팝업 창: 결과는 원래 창이 처리하고 팝업은 곧 닫히므로 저장된 토큰으로 복구도 하지 않는다
  if (window.opener) return true;
  const ticket = new URLSearchParams(window.location.search).get('ticket');
  window.history.replaceState(null, '', '/');
  if (!ticket) return false;
  try {
    authStore.setSession(await apiRequest<TokenResponse>('/auth/oauth/exchange', { method: 'POST', body: { ticket }, skipAuthRetry: true }));
    return true;
  } catch {
    return false;
  }
}

setAccessTokenProvider(() => authStore.getSession()?.accessToken ?? null);
setUnauthorizedHandler(refreshSession);

export const authService = {
  // 앱 시작 시 저장된 Refresh Token 으로 로그인 상태를 복구한다. 네트워크 오류면 토큰을 두고 다음 실행 때 다시 시도
  async restoreSession() {
    if (isMockAuth) return;
    if (await completeRedirectedSocialLogin()) return;
    const refreshToken = await tokenStorage.load();
    if (!refreshToken) return;
    try {
      authStore.setSession(await apiRequest<TokenResponse>('/auth/refresh', { method: 'POST', body: { refreshToken }, skipAuthRetry: true }));
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) await tokenStorage.remove();
    }
  },
  login: (request: LoginRequest) =>
    signIn(() => (isMockAuth ? Promise.resolve(mockToken(request.email, '보호자')) : apiRequest<TokenResponse>('/auth/login', { method: 'POST', body: request, skipAuthRetry: true }))),
  signup: (request: SignupRequest) =>
    signIn(() => (isMockAuth ? Promise.resolve(mockToken(request.email, request.nickname)) : apiRequest<TokenResponse>('/auth/signup', { method: 'POST', body: request, skipAuthRetry: true }))),
  // 서버 웹 로그인: 브라우저로 소셜 로그인 창을 열고, 서버가 돌려준 1회용 ticket 을 토큰으로 바꾼다.
  // 취소하면 false, 실패하면 ApiError. 서버에 키가 없고 mock 이 켜져 있으면 로그인 창 없이 바로 끝난다.
  async socialLogin(provider: SocialProvider): Promise<boolean> {
    if (isMockAuth) {
      await signIn(() => Promise.resolve(mockToken(`${provider}@dangsanchaek.dev`, '보호자')));
      return true;
    }
    // 웹: http://localhost:8082/auth/callback, Expo Go: exp://.../--/auth/callback, 앱: dangsanchaek://auth/callback
    const redirect = Linking.createURL('auth/callback');
    const startUrl = `${API_BASE_URL}/auth/oauth/${provider}/start?redirect=${encodeURIComponent(redirect)}`;
    const result = await WebBrowser.openAuthSessionAsync(startUrl, redirect);
    if (result.type !== 'success') return false;

    const { ticket, error } = Linking.parse(result.url).queryParams ?? {};
    if (error === 'CANCELLED') return false;
    if (typeof ticket !== 'string') throw new ApiError(401, String(error ?? 'SOCIAL_LOGIN_FAILED'), '소셜 로그인에 실패했어요. 다시 시도해 주세요.');
    await signIn(() => apiRequest<TokenResponse>('/auth/oauth/exchange', { method: 'POST', body: { ticket }, skipAuthRetry: true }));
    return true;
  },
  async logout() {
    const current = authStore.getSession();
    authStore.clear();
    if (current && !isMockAuth) {
      await apiRequest<void>('/auth/logout', { method: 'POST', body: { refreshToken: current.refreshToken }, skipAuthRetry: true }).catch(() => {});
    }
  },
};
