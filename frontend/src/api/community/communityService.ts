import { apiRequest } from '../client';
import { isMockAuth } from '../auth/authService';
import { authStore } from '../../store/authStore';
import type { PageResponse } from '../../types/shop';
import type { Comment, LikeResult, ParticipationResult, PostCategory, PostCreateInput, PostDetail, PostSummary } from '../../types/community';

export type PostQuery = { category?: PostCategory; keyword?: string; page?: number };

export type CommunityService = {
  getPosts: (query?: PostQuery) => Promise<PageResponse<PostSummary>>;
  getMyPosts: (page?: number) => Promise<PageResponse<PostSummary>>;
  getPost: (postId: number) => Promise<PostDetail>;
  createPost: (input: PostCreateInput) => Promise<PostDetail>;
  deletePost: (postId: number) => Promise<void>;
  like: (postId: number) => Promise<LikeResult>;
  unlike: (postId: number) => Promise<LikeResult>;
  join: (postId: number) => Promise<ParticipationResult>;
  leave: (postId: number) => Promise<ParticipationResult>;
  getComments: (postId: number) => Promise<Comment[]>;
  createComment: (postId: number, content: string, parentId?: number) => Promise<Comment>;
  deleteComment: (commentId: number) => Promise<void>;
};

const httpCommunityService: CommunityService = {
  getPosts: ({ category, keyword, page = 0 } = {}) => apiRequest<PageResponse<PostSummary>>('/posts', { query: { category, keyword, page, size: 20 } }),
  getMyPosts: (page = 0) => apiRequest<PageResponse<PostSummary>>('/users/me/posts', { query: { page, size: 20 } }),
  getPost: (postId) => apiRequest<PostDetail>(`/posts/${postId}`),
  createPost: (input) => apiRequest<PostDetail>('/posts', { method: 'POST', body: input }),
  deletePost: (postId) => apiRequest<void>(`/posts/${postId}`, { method: 'DELETE' }),
  like: (postId) => apiRequest<LikeResult>(`/posts/${postId}/likes`, { method: 'POST' }),
  unlike: (postId) => apiRequest<LikeResult>(`/posts/${postId}/likes`, { method: 'DELETE' }),
  join: (postId) => apiRequest<ParticipationResult>(`/posts/${postId}/participants`, { method: 'POST' }),
  leave: (postId) => apiRequest<ParticipationResult>(`/posts/${postId}/participants`, { method: 'DELETE' }),
  getComments: (postId) => apiRequest<Comment[]>(`/posts/${postId}/comments`),
  createComment: (postId, content, parentId) => apiRequest<Comment>(`/posts/${postId}/comments`, { method: 'POST', body: { content, parentId } }),
  deleteComment: (commentId) => apiRequest<void>(`/comments/${commentId}`, { method: 'DELETE' }),
};

// ---- 서버 없이 실행할 때: 메모리 저장 (앱을 켜 있는 동안만 유지) ----
type MockPost = PostDetail & { comments: Comment[] };
const mockPosts: MockPost[] = [];
let mockId = 1;

function me() {
  const user = authStore.getSession()!.user;
  return { id: user.id, nickname: user.nickname, profileImageUrl: user.profileImageUrl };
}

function findPost(postId: number) {
  const post = mockPosts.find((item) => item.id === postId);
  if (!post) throw new Error('게시글을 찾을 수 없어요.');
  return post;
}

function toSummary({ content, imageUrls, comments, mine, participating, updatedAt, ...post }: MockPost): PostSummary {
  return { ...post, contentPreview: content.length > 100 ? `${content.slice(0, 100)}…` : content, thumbnailUrl: imageUrls[0] ?? null };
}

function page<T>(content: T[]): PageResponse<T> {
  return { content, page: 0, size: content.length, totalElements: content.length, totalPages: 1, hasNext: false };
}

function participation(post: MockPost): ParticipationResult {
  return { postId: post.id, participating: post.participating, participantCount: post.recruit!.participantCount, maxParticipants: post.recruit!.maxParticipants, status: post.recruit!.status };
}

const mockCommunityService: CommunityService = {
  getPosts: async ({ category, keyword } = {}) =>
    page(mockPosts.filter((post) => (!category || post.category === category) && (!keyword || `${post.title}${post.content}`.includes(keyword))).map(toSummary)),
  getMyPosts: async () => page(mockPosts.filter((post) => post.mine).map(toSummary)),
  getPost: async (postId) => {
    const { comments, ...post } = findPost(postId);
    return post;
  },
  async createPost(input) {
    const now = new Date().toISOString();
    const recruit = input.category === 'FREE' ? null : { meetAt: input.meetAt!, placeName: input.placeName ?? null, latitude: null, longitude: null, maxParticipants: input.maxParticipants!, participantCount: 0, status: 'OPEN' as const };
    const post: MockPost = { id: mockId++, category: input.category, title: input.title, content: input.content, imageUrls: [], author: me(), likeCount: 0, commentCount: 0, likedByMe: false, mine: true, participating: false, hidden: false, recruit, createdAt: now, updatedAt: now, comments: [] };
    mockPosts.unshift(post);
    return mockCommunityService.getPost(post.id);
  },
  async deletePost(postId) {
    mockPosts.splice(mockPosts.indexOf(findPost(postId)), 1);
  },
  async like(postId) {
    const post = findPost(postId);
    if (!post.likedByMe) Object.assign(post, { likedByMe: true, likeCount: post.likeCount + 1 });
    return { postId, liked: true, likeCount: post.likeCount };
  },
  async unlike(postId) {
    const post = findPost(postId);
    if (post.likedByMe) Object.assign(post, { likedByMe: false, likeCount: post.likeCount - 1 });
    return { postId, liked: false, likeCount: post.likeCount };
  },
  async join(postId) {
    const post = findPost(postId);
    if (!post.participating) Object.assign(post, { participating: true, recruit: { ...post.recruit!, participantCount: post.recruit!.participantCount + 1 } });
    return participation(post);
  },
  async leave(postId) {
    const post = findPost(postId);
    if (post.participating) Object.assign(post, { participating: false, recruit: { ...post.recruit!, participantCount: post.recruit!.participantCount - 1 } });
    return participation(post);
  },
  getComments: async (postId) => [...findPost(postId).comments],
  async createComment(postId, content) {
    const post = findPost(postId);
    const now = new Date().toISOString();
    const comment: Comment = { id: mockId++, parentId: null, content, author: me(), deleted: false, hidden: false, createdAt: now, updatedAt: now, replies: [] };
    post.comments.push(comment);
    post.commentCount += 1;
    return comment;
  },
  async deleteComment(commentId) {
    for (const post of mockPosts) {
      const comment = post.comments.find((item) => item.id === commentId);
      if (comment) Object.assign(comment, { deleted: true, author: null, content: '삭제된 댓글입니다.' });
    }
  },
};

export const communityService: CommunityService = isMockAuth ? mockCommunityService : httpCommunityService;
