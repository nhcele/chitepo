import { apiClient } from './client';

export enum ForumType {
  COHORT = 'cohort',
  DIASPORA = 'diaspora',
  GENERAL = 'general',
}

export enum ForumStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  LOCKED = 'locked',
}

export interface Forum {
  id: string;
  title: string;
  description?: string;
  type: ForumType;
  status: ForumStatus;
  cohortId?: string;
  region?: string;
  country?: string;
  createdBy: string;
  isPublic: boolean;
  memberCount: number;
  postCount: number;
  lastActivityAt?: string;
  createdAt: string;
  updatedAt: string;
  cohort?: {
    id: string;
    name: string;
  };
  creator?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface ForumPost {
  id: string;
  forumId: string;
  parentId?: string;
  authorId: string;
  title: string;
  content: string;
  isPinned: boolean;
  isLocked: boolean;
  viewCount: number;
  replyCount: number;
  likeCount: number;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  author?: {
    id: string;
    name: string;
    email: string;
  };
  replies?: ForumPost[];
}

export interface ForumMember {
  id: string;
  forumId: string;
  userId: string;
  role: 'member' | 'moderator' | 'admin';
  joinedAt: string;
  lastReadAt?: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

/**
 * Create a new forum
 */
export async function createForum(data: {
  title: string;
  description?: string;
  type: ForumType;
  cohortId?: string;
  region?: string;
  country?: string;
  isPublic?: boolean;
}): Promise<Forum> {
  return apiClient.post<Forum>('/forums', data);
}

/**
 * Get forums with filters
 */
export async function getForums(filters?: {
  type?: ForumType;
  cohortId?: string;
  region?: string;
  country?: string;
  status?: ForumStatus;
}): Promise<Forum[]> {
  const params: any = {};
  if (filters?.type) params.type = filters.type;
  if (filters?.cohortId) params.cohortId = filters.cohortId;
  if (filters?.region) params.region = filters.region;
  if (filters?.country) params.country = filters.country;
  if (filters?.status) params.status = filters.status;

  return apiClient.get<Forum[]>('/forums', { params });
}

/**
 * Get cohort forum (auto-creates if doesn't exist)
 */
export async function getCohortForum(cohortId: string): Promise<Forum> {
  return apiClient.get<Forum>(`/forums/cohort/${cohortId}`);
}

/**
 * Get diaspora forums
 */
export async function getDiasporaForums(filters?: {
  region?: string;
  country?: string;
}): Promise<Forum[]> {
  const params: any = {};
  if (filters?.region) params.region = filters.region;
  if (filters?.country) params.country = filters.country;

  return apiClient.get<Forum[]>('/forums/diaspora', { params });
}

/**
 * Get forum by ID
 */
export async function getForum(forumId: string): Promise<Forum> {
  return apiClient.get<Forum>(`/forums/${forumId}`);
}

/**
 * Create a post
 */
export async function createPost(
  forumId: string,
  data: {
    title: string;
    content: string;
    parentId?: string;
    tags?: string[];
  },
): Promise<ForumPost> {
  return apiClient.post<ForumPost>(`/forums/${forumId}/posts`, data);
}

/**
 * Get posts in a forum
 */
export async function getPosts(
  forumId: string,
  filters?: {
    parentId?: string | null;
    authorId?: string;
    limit?: number;
    offset?: number;
  },
): Promise<ForumPost[]> {
  const params: any = {};
  if (filters?.parentId !== undefined) params.parentId = filters.parentId;
  if (filters?.authorId) params.authorId = filters.authorId;
  if (filters?.limit) params.limit = filters.limit;
  if (filters?.offset) params.offset = filters.offset;

  return apiClient.get<ForumPost[]>(`/forums/${forumId}/posts`, { params });
}

/**
 * Get post by ID
 */
export async function getPost(postId: string): Promise<ForumPost> {
  return apiClient.get<ForumPost>(`/forums/posts/${postId}`);
}

/**
 * Update post
 */
export async function updatePost(
  postId: string,
  data: {
    title?: string;
    content?: string;
    tags?: string[];
  },
): Promise<ForumPost> {
  return apiClient.patch<ForumPost>(`/forums/posts/${postId}`, data);
}

/**
 * Delete post
 */
export async function deletePost(postId: string): Promise<void> {
  await apiClient.delete(`/forums/posts/${postId}`);
}

/**
 * Toggle like on post
 */
export async function toggleLike(postId: string): Promise<{ liked: boolean; likeCount: number }> {
  return apiClient.post<{ liked: boolean; likeCount: number }>(`/forums/posts/${postId}/like`);
}

/**
 * Add member to forum
 */
export async function addMember(
  forumId: string,
  data: { userId?: string; role?: string },
): Promise<ForumMember> {
  return apiClient.post<ForumMember>(`/forums/${forumId}/members`, data);
}

/**
 * Remove member from forum
 */
export async function removeMember(forumId: string, userId: string): Promise<void> {
  await apiClient.delete(`/forums/${forumId}/members/${userId}`);
}

/**
 * Get forum members
 */
export async function getForumMembers(forumId: string): Promise<ForumMember[]> {
  return apiClient.get<ForumMember[]>(`/forums/${forumId}/members`);
}

