export type CommunityModerationStatus = "VISIBLE" | "HIDDEN" | "REMOVED";

export interface CreateCommunityPostInput {
  authorId: string;
  content: string;
}

export interface ListCommunityPostsFilter {
  status?: CommunityModerationStatus;
  authorId?: string;
  limit?: number;
}

export interface CreateCommunityCommentInput {
  postId: string;
  authorId: string;
  content: string;
}

export interface ListCommunityCommentsFilter {
  status?: CommunityModerationStatus;
  limit?: number;
}

export interface CreateCommunityPostLikeInput {
  postId: string;
  userId: string;
}

export interface CommunityPostLikeStateDto {
  postId: string;
  likedByCurrentUser: boolean;
  likeCount: number;
}

// ============================================================================
// FEAT-042: Posts API & Feed Read Model Types
// ============================================================================

export interface SafeAuthorDto {
  displayName: string;
}

export interface CommunityPostDto {
  id: string;
  author: SafeAuthorDto;
  content: string;
  createdAt: string;
  likeCount: number;
  commentCount: number;
  likedByCurrentUser: boolean;
  ownedByCurrentUser: boolean;
}

export interface CommunityPostFeedPageInfo {
  nextCursor: string | null;
  hasNextPage: boolean;
}

export interface CommunityPostFeedResponse {
  data: CommunityPostDto[];
  pageInfo: CommunityPostFeedPageInfo;
}

export interface CommunityPostRecord {
  id: string;
  authorId: string;
  content: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  removedAt: Date | null;
  author: {
    displayName: string | null;
  };
  _count: {
    comments: number;
    likes: number;
  };
  likes?: { id: string }[];
}

export interface ListVisibleFeedParams {
  limit: number;
  cursor?: {
    createdAt: Date;
    id: string;
  };
  currentUserId?: string;
}

// ============================================================================
// FEAT-043: Comments API & Read Model Types
// ============================================================================

export interface CommunityCommentDto {
  id: string;
  author: SafeAuthorDto;
  content: string;
  createdAt: string;
  ownedByCurrentUser: boolean;
}

export interface CommunityCommentFeedPageInfo {
  nextCursor: string | null;
  hasNextPage: boolean;
}

export interface CommunityCommentFeedResponse {
  data: CommunityCommentDto[];
  pageInfo: CommunityCommentFeedPageInfo;
}

export interface CommunityCommentRecord {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  removedAt: Date | null;
  author: {
    displayName: string | null;
  };
}

export interface ListVisibleCommentsParams {
  postId: string;
  limit: number;
  cursor?: {
    createdAt: Date;
    id: string;
  };
}

