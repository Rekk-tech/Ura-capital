import {
  CommunityPostDto,
  CommunityCommentDto,
  CommunityPostLikeStateDto,
  CommunityPostFeedResponse,
  CommunityCommentFeedResponse,
  CreatePostRequestDto,
  CreateCommentRequestDto,
  CommunityApiError,
  AppErrorResponse,
} from "../features/community/types/community-ui.types";

export interface RequestOptions {
  signal?: AbortSignal;
}

export interface ICommunityApiClient {
  listPosts(
    params?: { limit?: number; cursor?: string },
    accessToken?: string,
    options?: RequestOptions,
  ): Promise<CommunityPostFeedResponse>;

  createPost(
    data: CreatePostRequestDto,
    accessToken: string,
    options?: RequestOptions,
  ): Promise<{ data: CommunityPostDto }>;

  getPostById(
    postId: string,
    accessToken?: string,
    options?: RequestOptions,
  ): Promise<{ data: CommunityPostDto }>;

  removePost(
    postId: string,
    accessToken: string,
    options?: RequestOptions,
  ): Promise<{ data: { id: string; removed: boolean } }>;

  listComments(
    postId: string,
    params?: { limit?: number; cursor?: string },
    accessToken?: string,
    options?: RequestOptions,
  ): Promise<CommunityCommentFeedResponse>;

  createComment(
    postId: string,
    data: CreateCommentRequestDto,
    accessToken: string,
    options?: RequestOptions,
  ): Promise<{ data: CommunityCommentDto }>;

  removeComment(
    commentId: string,
    accessToken: string,
    options?: RequestOptions,
  ): Promise<{ data: { id: string; removed: boolean } }>;

  likePost(
    postId: string,
    accessToken: string,
    options?: RequestOptions,
  ): Promise<{ data: CommunityPostLikeStateDto }>;

  unlikePost(
    postId: string,
    accessToken: string,
    options?: RequestOptions,
  ): Promise<{ data: CommunityPostLikeStateDto }>;
}

export class CommunityApiClient implements ICommunityApiClient {
  private readonly baseUrl: string;

  constructor(baseUrl = "/api/community") {
    this.baseUrl = baseUrl;
  }

  async listPosts(
    params?: { limit?: number; cursor?: string },
    accessToken?: string,
    options?: RequestOptions,
  ): Promise<CommunityPostFeedResponse> {
    const query = new URLSearchParams();
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.cursor) query.set("cursor", params.cursor);

    const queryString = query.toString();
    const url = `${this.baseUrl}/posts${queryString ? `?${queryString}` : ""}`;

    const headers: Record<string, string> = { Accept: "application/json" };
    if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

    const res = await fetch(url, { method: "GET", headers, signal: options?.signal });
    if (!res.ok) await this.handleError(res);
    return (await res.json()) as CommunityPostFeedResponse;
  }

  async createPost(
    data: CreatePostRequestDto,
    accessToken: string,
    options?: RequestOptions,
  ): Promise<{ data: CommunityPostDto }> {
    const url = `${this.baseUrl}/posts`;
    const headers: Record<string, string> = {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    };

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
      signal: options?.signal,
    });
    if (!res.ok) await this.handleError(res);
    return (await res.json()) as { data: CommunityPostDto };
  }

  async getPostById(
    postId: string,
    accessToken?: string,
    options?: RequestOptions,
  ): Promise<{ data: CommunityPostDto }> {
    const url = `${this.baseUrl}/posts/${encodeURIComponent(postId)}`;
    const headers: Record<string, string> = { Accept: "application/json" };
    if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

    const res = await fetch(url, { method: "GET", headers, signal: options?.signal });
    if (!res.ok) await this.handleError(res);
    return (await res.json()) as { data: CommunityPostDto };
  }

  async removePost(
    postId: string,
    accessToken: string,
    options?: RequestOptions,
  ): Promise<{ data: { id: string; removed: boolean } }> {
    const url = `${this.baseUrl}/posts/${encodeURIComponent(postId)}`;
    const headers: Record<string, string> = {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    };

    const res = await fetch(url, { method: "DELETE", headers, signal: options?.signal });
    if (!res.ok) await this.handleError(res);
    return (await res.json()) as { data: { id: string; removed: boolean } };
  }

  async listComments(
    postId: string,
    params?: { limit?: number; cursor?: string },
    accessToken?: string,
    options?: RequestOptions,
  ): Promise<CommunityCommentFeedResponse> {
    const query = new URLSearchParams();
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.cursor) query.set("cursor", params.cursor);

    const queryString = query.toString();
    const url = `${this.baseUrl}/posts/${encodeURIComponent(postId)}/comments${queryString ? `?${queryString}` : ""}`;

    const headers: Record<string, string> = { Accept: "application/json" };
    if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

    const res = await fetch(url, { method: "GET", headers, signal: options?.signal });
    if (!res.ok) await this.handleError(res);
    return (await res.json()) as CommunityCommentFeedResponse;
  }

  async createComment(
    postId: string,
    data: CreateCommentRequestDto,
    accessToken: string,
    options?: RequestOptions,
  ): Promise<{ data: CommunityCommentDto }> {
    const url = `${this.baseUrl}/posts/${encodeURIComponent(postId)}/comments`;
    const headers: Record<string, string> = {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    };

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
      signal: options?.signal,
    });
    if (!res.ok) await this.handleError(res);
    return (await res.json()) as { data: CommunityCommentDto };
  }

  async removeComment(
    commentId: string,
    accessToken: string,
    options?: RequestOptions,
  ): Promise<{ data: { id: string; removed: boolean } }> {
    const url = `${this.baseUrl}/comments/${encodeURIComponent(commentId)}`;
    const headers: Record<string, string> = {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    };

    const res = await fetch(url, { method: "DELETE", headers, signal: options?.signal });
    if (!res.ok) await this.handleError(res);
    return (await res.json()) as { data: { id: string; removed: boolean } };
  }

  async likePost(
    postId: string,
    accessToken: string,
    options?: RequestOptions,
  ): Promise<{ data: CommunityPostLikeStateDto }> {
    const url = `${this.baseUrl}/posts/${encodeURIComponent(postId)}/like`;
    const headers: Record<string, string> = {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    };

    const res = await fetch(url, { method: "PUT", headers, signal: options?.signal });
    if (!res.ok) await this.handleError(res);
    return (await res.json()) as { data: CommunityPostLikeStateDto };
  }

  async unlikePost(
    postId: string,
    accessToken: string,
    options?: RequestOptions,
  ): Promise<{ data: CommunityPostLikeStateDto }> {
    const url = `${this.baseUrl}/posts/${encodeURIComponent(postId)}/like`;
    const headers: Record<string, string> = {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    };

    const res = await fetch(url, { method: "DELETE", headers, signal: options?.signal });
    if (!res.ok) await this.handleError(res);
    return (await res.json()) as { data: CommunityPostLikeStateDto };
  }

  private async handleError(res: Response): Promise<never> {
    let errorData: AppErrorResponse | null = null;
    try {
      errorData = (await res.json()) as AppErrorResponse;
    } catch {
      // Non-JSON response
    }

    // Parse Retry-After header if present (for 429 rate limiting)
    let retryAfter: number | undefined;
    const retryAfterHeader = res.headers.get("retry-after");
    if (retryAfterHeader) {
      const parsed = parseInt(retryAfterHeader, 10);
      if (!Number.isNaN(parsed) && parsed > 0) {
        retryAfter = parsed;
      }
    }

    const code =
      errorData?.error?.code ??
      (res.status === 400
        ? "VALIDATION_ERROR"
        : res.status === 401
          ? "UNAUTHENTICATED"
          : res.status === 403
            ? "FORBIDDEN"
            : res.status === 404
              ? "NOT_FOUND"
              : res.status === 429
                ? "RATE_LIMITED"
                : res.status === 503
                  ? "SERVICE_UNAVAILABLE"
                  : "INTERNAL_ERROR");

    const message =
      errorData?.error?.message ??
      (res.status === 400
        ? "Invalid request content"
        : res.status === 401
          ? "Authentication required"
          : res.status === 403
            ? "Permission denied"
            : res.status === 404
              ? "Post or comment not found"
              : res.status === 429
                ? `Rate limit exceeded. Please wait ${retryAfter ?? 60} seconds before retrying.`
                : res.status === 503
                  ? "Service temporarily unavailable. Please try again shortly."
                  : "An unexpected error occurred");

    throw new CommunityApiError(res.status, code, message, retryAfter, errorData?.error?.details);
  }
}

export const communityApi = new CommunityApiClient();
