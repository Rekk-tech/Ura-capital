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
