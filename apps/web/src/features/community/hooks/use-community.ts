import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { communityApi } from "../../../api/community.api";
import {
  CreatePostRequestDto,
  CreateCommentRequestDto,
  CommunityApiError,
} from "../types/community-ui.types";

export const communityQueryKeys = {
  all: ["community"] as const,
  feed: (token?: string, sort: "LATEST" | "POPULAR" = "LATEST") =>
    ["community", "feed", token, sort] as const,
  post: (postId?: string, token?: string) => ["community", "post", postId, token] as const,
  comments: (postId?: string, token?: string) => ["community", "comments", postId, token] as const,
};

const shouldRetry = (failureCount: number, error: unknown): boolean => {
  if (failureCount >= 1) return false;
  if (error instanceof CommunityApiError) {
    if ([401, 403, 404, 429].includes(error.status)) {
      return false;
    }
  }
  return true;
};

export function useCommunityFeedQuery(
  accessToken?: string,
  limit = 20,
  sort: "LATEST" | "POPULAR" = "LATEST",
) {
  return useInfiniteQuery({
    queryKey: communityQueryKeys.feed(accessToken, sort),
    queryFn: ({ pageParam, signal }) =>
      communityApi.listPosts(
        { limit, cursor: pageParam, sort },
        accessToken,
        { signal },
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.pageInfo.hasNextPage ? (lastPage.pageInfo.nextCursor ?? undefined) : undefined,
    enabled: Boolean(accessToken),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    retry: shouldRetry,
  });
}

export function useCommunityPostQuery(postId?: string, accessToken?: string) {
  return useQuery({
    queryKey: communityQueryKeys.post(postId, accessToken),
    queryFn: ({ signal }) => communityApi.getPostById(postId!, accessToken, { signal }),
    enabled: Boolean(postId && accessToken),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    retry: shouldRetry,
  });
}

export function useCommunityCommentsQuery(postId?: string, accessToken?: string, limit = 20) {
  return useInfiniteQuery({
    queryKey: communityQueryKeys.comments(postId, accessToken),
    queryFn: ({ pageParam, signal }) =>
      communityApi.listComments(
        postId!,
        { limit, cursor: pageParam },
        accessToken,
        { signal },
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.pageInfo.hasNextPage ? (lastPage.pageInfo.nextCursor ?? undefined) : undefined,
    enabled: Boolean(postId && accessToken),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    retry: shouldRetry,
  });
}

export function useCreatePostMutation(accessToken?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePostRequestDto) => communityApi.createPost(data, accessToken!),
    onSuccess: () => {
      // Invalidate feed so the authoritative server list updates
      void queryClient.invalidateQueries({ queryKey: ["community", "feed"] });
    },
  });
}

export function useRemovePostMutation(accessToken?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) => communityApi.removePost(postId, accessToken!),
    onSuccess: (_data, postId) => {
      void queryClient.invalidateQueries({ queryKey: ["community", "feed"] });
      void queryClient.invalidateQueries({ queryKey: ["community", "post", postId] });
    },
  });
}

export function useCreateCommentMutation(postId: string, accessToken?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCommentRequestDto) =>
      communityApi.createComment(postId, data, accessToken!),
    onSuccess: () => {
      // Invalidate comments, post detail (for commentCount), and feed
      void queryClient.invalidateQueries({ queryKey: ["community", "comments", postId] });
      void queryClient.invalidateQueries({ queryKey: ["community", "post", postId] });
      void queryClient.invalidateQueries({ queryKey: ["community", "feed"] });
    },
  });
}

export function useRemoveCommentMutation(postId: string, accessToken?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentId: string) => communityApi.removeComment(commentId, accessToken!),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["community", "comments", postId] });
      void queryClient.invalidateQueries({ queryKey: ["community", "post", postId] });
      void queryClient.invalidateQueries({ queryKey: ["community", "feed"] });
    },
  });
}

export function useLikePostMutation(accessToken?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) => communityApi.likePost(postId, accessToken!),
    onSuccess: (_data, postId) => {
      // Server-authoritative counts: Invalidate post queries to refetch true count and status
      void queryClient.invalidateQueries({ queryKey: ["community", "post", postId] });
      void queryClient.invalidateQueries({ queryKey: ["community", "feed"] });
    },
  });
}

export function useUnlikePostMutation(accessToken?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) => communityApi.unlikePost(postId, accessToken!),
    onSuccess: (_data, postId) => {
      void queryClient.invalidateQueries({ queryKey: ["community", "post", postId] });
      void queryClient.invalidateQueries({ queryKey: ["community", "feed"] });
    },
  });
}

export function useToggleLikeMutation(accessToken?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, isLiked }: { postId: string; isLiked: boolean }) =>
      communityApi.toggleLike(postId, isLiked, accessToken!),
    onSuccess: (_data, { postId }) => {
      void queryClient.invalidateQueries({ queryKey: ["community", "post", postId] });
      void queryClient.invalidateQueries({ queryKey: ["community", "feed"] });
    },
  });
}
