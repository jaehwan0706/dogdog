// Spring Boot API 공통 호출부. 백엔드 오류 형식: {"status":409,"code":"OUT_OF_STOCK","message":"..."}
// 베이스 URL 은 frontend/.env 의 EXPO_PUBLIC_API_BASE_URL (예: http://192.168.0.10:8080)

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

// 로그인 연동 전까지는 null. 인증 작업 시 토큰 저장소에서 꺼내도록 교체
let accessTokenProvider: () => string | null = () => null;

export function setAccessTokenProvider(provider: () => string | null) {
  accessTokenProvider = provider;
}

type RequestOptions = { method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'; body?: unknown; query?: Record<string, string | number | undefined> };

export async function apiRequest<T>(path: string, { method = 'GET', body, query }: RequestOptions = {}): Promise<T> {
  const params = Object.entries(query ?? {})
    .filter(([, value]) => value !== undefined && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');
  const token = accessTokenProvider();

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}${params ? `?${params}` : ''}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined && { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', '네트워크 연결을 확인해 주세요.');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new ApiError(response.status, error?.code ?? 'UNKNOWN', error?.message ?? '요청을 처리하지 못했어요.');
  }
  return response.status === 204 ? (undefined as T) : response.json();
}
