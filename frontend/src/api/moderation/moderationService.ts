import { apiRequest } from '../client';
import { isMockAuth } from '../auth/authService';
import type { BlockedUser, ReportReason, ReportTargetType } from '../../types/moderation';

export type ReportInput = { targetType: ReportTargetType; targetId: number; reason: ReportReason; detail?: string };

// 사용자 신고·차단. 차단하면 서버가 그 사용자의 글·댓글을 목록에서 빼고 내려준다.
export type ModerationService = {
  report: (input: ReportInput) => Promise<void>;
  block: (userId: number) => Promise<void>;
  unblock: (userId: number) => Promise<void>;
  getBlockedUsers: () => Promise<BlockedUser[]>;
};

const httpModerationService: ModerationService = {
  report: (input) => apiRequest<void>('/reports', { method: 'POST', body: input }),
  block: (userId) => apiRequest<void>(`/users/${userId}/block`, { method: 'POST' }),
  unblock: (userId) => apiRequest<void>(`/users/${userId}/block`, { method: 'DELETE' }),
  getBlockedUsers: () => apiRequest<BlockedUser[]>('/users/me/blocks'),
};

// 서버 없이 실행할 때: 신고는 받기만 하고, 차단 목록만 메모리에 둔다
let mockBlocked: BlockedUser[] = [];

const mockModerationService: ModerationService = {
  report: async () => {},
  block: async (userId) => {
    if (!mockBlocked.some((item) => item.userId === userId)) mockBlocked.push({ userId, nickname: `사용자${userId}`, profileImageUrl: null, blockedAt: new Date().toISOString() });
  },
  unblock: async (userId) => {
    mockBlocked = mockBlocked.filter((item) => item.userId !== userId);
  },
  getBlockedUsers: async () => [...mockBlocked],
};

export const moderationService: ModerationService = isMockAuth ? mockModerationService : httpModerationService;
