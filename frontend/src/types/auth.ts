// 백엔드 AuthDtos 와 맞춘 타입

export type AuthProvider = 'LOCAL' | 'KAKAO' | 'GOOGLE' | 'NAVER' | 'APPLE';
// 앱에서 쓰는 소셜 로그인은 카카오·구글 두 가지 (서버에는 네이버·애플 검증 코드도 남아 있음)
export type SocialProvider = 'kakao' | 'google';

export type User = {
  id: number;
  email: string;
  nickname: string;
  profileImageUrl: string | null;
  provider: AuthProvider;
  role: 'USER' | 'ADMIN';
  createdAt: string;
};

export type TokenResponse = {
  tokenType: string;
  accessToken: string;
  accessTokenExpiresIn: number;
  refreshToken: string;
  isNewUser: boolean;
  user: User;
};

export type SignupRequest = { email: string; password: string; nickname: string };
export type LoginRequest = { email: string; password: string };
