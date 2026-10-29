// 백엔드 PostDtos 와 맞춘 타입

export type PostCategory = 'FREE' | 'WALK_MATE' | 'CARE_SHARE';
export type RecruitStatus = 'OPEN' | 'CLOSED';

export type Author = { id: number; nickname: string; profileImageUrl: string | null };

export type RecruitInfo = {
  meetAt: string;
  placeName: string | null;
  latitude: number | null;
  longitude: number | null;
  maxParticipants: number;
  participantCount: number;
  status: RecruitStatus;
};

export type PostSummary = {
  id: number;
  category: PostCategory;
  title: string;
  contentPreview: string;
  thumbnailUrl: string | null;
  author: Author;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  recruit: RecruitInfo | null;
  createdAt: string;
};

export type PostDetail = {
  id: number;
  category: PostCategory;
  title: string;
  content: string;
  imageUrls: string[];
  author: Author;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  mine: boolean;
  participating: boolean;
  recruit: RecruitInfo | null;
  createdAt: string;
  updatedAt: string;
};

export type PostCreateInput = {
  category: PostCategory;
  title: string;
  content: string;
  // WALK_MATE / CARE_SHARE 는 meetAt, maxParticipants 필수
  meetAt?: string; // YYYY-MM-DDTHH:mm:ss
  placeName?: string;
  maxParticipants?: number;
};

export type Comment = {
  id: number;
  parentId: number | null;
  content: string;
  author: Author | null; // 삭제된 댓글은 null
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
  replies: Comment[];
};

export type LikeResult = { postId: number; liked: boolean; likeCount: number };

export type ParticipationResult = {
  postId: number;
  participating: boolean;
  participantCount: number;
  maxParticipants: number;
  status: RecruitStatus;
};
