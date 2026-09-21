import type {
  CommunityCommentRecord,
  CommunityCommentDto,
} from "./community.types.js";

const DEFAULT_AUTHOR_DISPLAY_NAME = "Aura Learner";

/**
 * Maps an internal CommunityCommentRecord into the safe, public CommunityCommentDto.
 * Whitelists allowed fields and applies default display name fallback.
 */
export function toCommunityCommentDto(
  comment: CommunityCommentRecord,
  currentUserId: string,
): CommunityCommentDto {
  const rawDisplayName = comment.author?.displayName?.trim();
  const displayName =
    rawDisplayName && rawDisplayName.length > 0
      ? rawDisplayName
      : DEFAULT_AUTHOR_DISPLAY_NAME;

  const ownedByCurrentUser = comment.authorId === currentUserId;

  return {
    id: comment.id,
    author: {
      displayName,
    },
    content: comment.content,
    createdAt: comment.createdAt.toISOString(),
    ownedByCurrentUser,
  };
}
