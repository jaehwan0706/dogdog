import { ApiError, apiRequest } from '../client';
import { isMockAuth } from '../auth/authService';
import type { Walk, WalkDetail, WalkPoint } from '../../types/walk';
import { routeMeters } from '../../utils/geo';

export type WalkService = {
  // 진행 중인 산책이 있으면 ApiError(409, 'WALK_ALREADY_IN_PROGRESS')
  start: (dogId?: number) => Promise<Walk>;
  // 진행 중인 산책 (없으면 null). 앱을 다시 켰을 때 이어서 기록하기용
  getCurrent: () => Promise<WalkDetail | null>;
  // 서버에 저장된 마지막 seq 를 돌려준다
  addPoints: (walkId: number, points: WalkPoint[]) => Promise<number>;
  end: (walkId: number, points: WalkPoint[]) => Promise<WalkDetail>;
  getDetail: (walkId: number) => Promise<WalkDetail>;
  // from·to: yyyy-MM-dd (둘 다 포함). 생략하면 최근 30일
  getMyWalks: (range?: { from?: string; to?: string }) => Promise<Walk[]>;
  remove: (walkId: number) => Promise<void>;
};

const httpWalkService: WalkService = {
  start: (dogId) => apiRequest<Walk>('/walks/start', { method: 'POST', body: { dogId } }),
  getCurrent: async () => (await apiRequest<WalkDetail | undefined>('/walks/current')) ?? null,
  addPoints: async (walkId, points) =>
    (await apiRequest<{ lastSeq: number }>(`/walks/${walkId}/points`, { method: 'POST', body: { points } })).lastSeq,
  end: (walkId, points) => apiRequest<WalkDetail>(`/walks/${walkId}/end`, { method: 'PATCH', body: { points } }),
  getDetail: (walkId) => apiRequest<WalkDetail>(`/walks/${walkId}`),
  getMyWalks: (range) => apiRequest<Walk[]>('/users/me/walks', { query: range }),
  remove: (walkId) => apiRequest<void>(`/walks/${walkId}`, { method: 'DELETE' }),
};

// 서버 없이 실행할 때: 앱을 켜 있는 동안만 메모리에 저장
let mockWalks: WalkDetail[] = [];
let mockId = 1;

function findMock(walkId: number) {
  const walk = mockWalks.find((item) => item.id === walkId);
  if (!walk) throw new ApiError(404, 'WALK_NOT_FOUND', '산책 기록을 찾을 수 없습니다.');
  return walk;
}

function appendMockPoints(walk: WalkDetail, points: WalkPoint[]) {
  let lastSeq = walk.points.at(-1)?.seq ?? -1;
  for (const point of [...points].sort((a, b) => a.seq - b.seq)) {
    if (point.seq > lastSeq) {
      walk.points.push(point);
      lastSeq = point.seq;
    }
  }
  return lastSeq;
}

// 서버와 같은 "시간대 없는 현지 시각" 문자열
function localNow() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 19);
}

const mockWalkService: WalkService = {
  async start(dogId) {
    if (mockWalks.some((walk) => walk.status === 'IN_PROGRESS')) {
      throw new ApiError(409, 'WALK_ALREADY_IN_PROGRESS', '이미 진행 중인 산책이 있습니다.');
    }
    const walk: WalkDetail = {
      id: mockId++, dogId: dogId ?? null, dogName: null, status: 'IN_PROGRESS',
      startedAt: localNow(), endedAt: null, distanceMeters: 0, durationSeconds: 0, points: [],
    };
    mockWalks = [walk, ...mockWalks];
    return walk;
  },
  getCurrent: async () => mockWalks.find((walk) => walk.status === 'IN_PROGRESS') ?? null,
  addPoints: async (walkId, points) => appendMockPoints(findMock(walkId), points),
  async end(walkId, points) {
    const walk = findMock(walkId);
    appendMockPoints(walk, points);
    walk.status = 'FINISHED';
    walk.endedAt = localNow();
    walk.distanceMeters = Math.round(routeMeters(walk.points));
    walk.durationSeconds = Math.round((Date.parse(walk.endedAt) - Date.parse(walk.startedAt)) / 1000);
    return { ...walk };
  },
  getDetail: async (walkId) => ({ ...findMock(walkId) }),
  getMyWalks: async ({ from, to } = {}) =>
    mockWalks.filter((walk) => walk.status === 'FINISHED'
      && (!from || walk.startedAt.slice(0, 10) >= from) && (!to || walk.startedAt.slice(0, 10) <= to)),
  async remove(walkId) {
    findMock(walkId);
    mockWalks = mockWalks.filter((walk) => walk.id !== walkId);
  },
};

export const walkService: WalkService = isMockAuth ? mockWalkService : httpWalkService;
