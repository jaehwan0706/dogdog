// Spring Boot API 공통 호출부. 백엔드 오류 형식: {"status":409,"code":"OUT_OF_STOCK","message":"...","errors":[{"field","message"}]?}
// 베이스 URL 은 frontend/.env 의 EXPO_PUBLIC_API_BASE_URL (예: http://192.168.0.10:8080)

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

// 토큰은 auth/authService 가 authStore 에서 꺼내도록 등록한다
let accessTokenProvider: () => string | null = () => null;
// 401 을 받았을 때 토큰 재발급을 시도하고 성공 여부를 돌려준다
let unauthorizedHandler: () => Promise<boolean> = async () => false;

export function setAccessTokenProvider(provider: () => string | null) {
  accessTokenProvider = provider;
}

export function setUnauthorizedHandler(handler: () => Promise<boolean>) {
  unauthorizedHandler = handler;
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | undefined>;
  // 로그인·재발급 요청처럼 401 이어도 재발급을 다시 시도하면 안 되는 요청
  skipAuthRetry?: boolean;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, query, skipAuthRetry } = options;
  const params = Object.entries(query ?? {})
    .filter(([, value]) => value !== undefined && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');
  const token = accessTokenProvider();
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}${params ? `?${params}` : ''}`, {
      method,
      headers: {
        Accept: 'application/json',
        // FormData(사진 업로드)는 fetch 가 multipart 경계값을 넣은 Content-Type 을 직접 붙인다
        ...(body !== undefined && !isFormData && { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: isFormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    // 요청 본문 변환 실패 같은 앱 쪽 오류도 여기로 오므로 개발 중에는 실제 원인을 Metro 터미널에 남긴다
    if (__DEV__) console.warn(`[api] ${method} ${path} 요청 실패:`, e);
    throw new ApiError(0, 'NETWORK_ERROR', '네트워크 연결을 확인해 주세요.');
  }

  if (response.status === 401 && token && !skipAuthRetry && (await unauthorizedHandler())) {
    return apiRequest<T>(path, { ...options, skipAuthRetry: true });
  }

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    // 입력값 검증 오류(INVALID_INPUT)는 errors[].message 에 필드별 사유가 있어 첫 번째를 보여준다
    const message = error?.errors?.[0]?.message ?? error?.message ?? '요청을 처리하지 못했어요.';
    throw new ApiError(response.status, error?.code ?? 'UNKNOWN', message);
  }
  return response.status === 204 ? (undefined as T) : response.json();
}
