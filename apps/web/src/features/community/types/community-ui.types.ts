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

export interface CommunityCommentDto {
  id: string;
  author: SafeAuthorDto;
  content: string;
  createdAt: string;
  ownedByCurrentUser: boolean;
}

export interface CommunityPostLikeStateDto {
  postId: string;
  likedByCurrentUser: boolean;
  likeCount: number;
}

export interface CommunityPageInfo {
  nextCursor: string | null;
  hasNextPage: boolean;
}

export interface CommunityPostFeedResponse {
  data: CommunityPostDto[];
  pageInfo: CommunityPageInfo;
}

export interface CommunityCommentFeedResponse {
  data: CommunityCommentDto[];
  pageInfo: CommunityPageInfo;
}

export interface CreatePostRequestDto {
  content: string;
}

export interface CreateCommentRequestDto {
  content: string;
}

export interface AppErrorResponse {
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
    requestId?: string;
  };
}

export class CommunityApiError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly retryAfter?: number | undefined;
  public readonly details?: unknown | undefined;

  constructor(status: number, code: string, message: string, retryAfter?: number, details?: unknown) {
    super(message);
    this.name = "CommunityApiError";
    this.status = status;
    this.code = code;
    this.retryAfter = retryAfter;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
