export type CommunityModerationStatus = "VISIBLE" | "HIDDEN" | "REMOVED";

export interface CreateCommunityPostInput {
  authorId: string;
  content: string;
  status?: CommunityModerationStatus;
}

export interface UpdateCommunityPostStatusInput {
  status: CommunityModerationStatus;
  removedAt?: Date | null;
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
  status?: CommunityModerationStatus;
}

export interface UpdateCommunityCommentStatusInput {
  status: CommunityModerationStatus;
  removedAt?: Date | null;
}

export interface ListCommunityCommentsFilter {
  status?: CommunityModerationStatus;
  limit?: number;
}

export interface CreateCommunityPostLikeInput {
  postId: string;
  userId: string;
}
