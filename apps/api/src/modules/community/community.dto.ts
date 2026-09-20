import type {
  CommunityPostRecord,
  CommunityPostDto,
} from "./community.types.js";

const DEFAULT_AUTHOR_DISPLAY_NAME = "Aura Learner";

/**
 * Maps an internal CommunityPostRecord into the safe, public CommunityPostDto.
 * Strictly whitelists allowed fields and protects against sensitive learner identity leakage.
 */
export function toCommunityPostDto(
  post: CommunityPostRecord,
  currentUserId: string,
): CommunityPostDto {
  const rawDisplayName = post.author?.displayName?.trim();
  const displayName = rawDisplayName && rawDisplayName.length > 0
    ? rawDisplayName
    : DEFAULT_AUTHOR_DISPLAY_NAME;

  const likeCount = typeof post._count?.likes === "number" ? post._count.likes : 0;
  const commentCount = typeof post._count?.comments === "number" ? post._count.comments : 0;
  const likedByCurrentUser = Boolean(post.likes && post.likes.length > 0);
  const ownedByCurrentUser = post.authorId === currentUserId;

  return {
    id: post.id,
    author: {
      displayName,
    },
    content: post.content,
    createdAt: post.createdAt.toISOString(),
    likeCount,
    commentCount,
    likedByCurrentUser,
    ownedByCurrentUser,
  };
}
