// 백엔드 AuthDtos 와 맞춘 타입

export type AuthProvider = 'LOCAL' | 'KAKAO' | 'GOOGLE' | 'NAVER' | 'APPLE';
export type SocialProvider = 'kakao' | 'google' | 'naver' | 'apple';

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
