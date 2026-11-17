// 백엔드 ModerationDtos 와 맞춘 타입
import type { AuthProvider } from './auth';

export type ReportTargetType = 'POST' | 'COMMENT' | 'USER';
export type ReportReason = 'SPAM' | 'ABUSE' | 'SEXUAL' | 'FRAUD' | 'ETC';
export type ReportStatus = 'PENDING' | 'ACTION_TAKEN' | 'DISMISSED';
export type ReportAction = 'HIDE' | 'SUSPEND' | 'DISMISS';
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'DELETED';

export const reportReasonLabel: Record<ReportReason, string> = {
  SPAM: '스팸·광고',
  ABUSE: '욕설·비방·혐오',
  SEXUAL: '음란·선정적 내용',
  FRAUD: '사기·거래 유도',
  ETC: '기타',
};

export const reportStatusLabel: Record<ReportStatus, string> = { PENDING: '검토 대기', ACTION_TAKEN: '조치 완료', DISMISSED: '문제 없음' };
export const reportTargetLabel: Record<ReportTargetType, string> = { POST: '게시글', COMMENT: '댓글', USER: '사용자' };

export type BlockedUser = { userId: number; nickname: string; profileImageUrl: string | null; blockedAt: string };

export type ReportTarget = {
  exists: boolean;
  authorId: number | null;
  authorNickname: string | null;
  authorStatus: UserStatus | null;
  preview: string | null; // 게시글 제목 / 댓글 내용 / 사용자 닉네임
  hidden: boolean;
  postId: number | null;
};

export type AdminReport = {
  id: number;
  targetType: ReportTargetType;
  targetId: number;
  reason: ReportReason;
  detail: string | null;
  status: ReportStatus;
  reporterId: number;
  reporterNickname: string | null;
  target: ReportTarget;
  targetReportCount: number;
  adminMemo: string | null;
  resolvedAt: string | null;
  createdAt: string;
};

export type AdminUser = {
  id: number;
  email: string | null;
  nickname: string;
  provider: AuthProvider;
  role: 'USER' | 'ADMIN';
  status: UserStatus;
  createdAt: string;
};
