import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  profileApi,
  ProfileApiError,
  UserProfile,
  UpdateProfilePayload,
  ChangePasswordPayload,
  UserSession,
} from "../../../api/profile.api";
import { getGlobalAccessToken } from "../../../api/auth-token";

export const profileKeys = {
  all: ["profile"] as const,
  details: (token?: string | null) => ["profile", "details", token ?? "global"] as const,
  sessions: (token?: string | null) => ["profile", "sessions", token ?? "global"] as const,
};

export function useProfileQuery(
  accessToken?: string | null,
  enabled = true,
  options?: { retry?: boolean | number }
) {
  const token = accessToken || getGlobalAccessToken();

  return useQuery<UserProfile>({
    queryKey: profileKeys.details(accessToken),
    queryFn: ({ signal }) => profileApi.getProfile(token ?? undefined, { signal }),
    enabled: Boolean(token && enabled),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry:
      options?.retry !== undefined
        ? options.retry
        : (failureCount, error) => {
            if (failureCount >= 2) return false;
            if (error instanceof ProfileApiError && (error.status === 401 || error.status === 403)) {
              return false;
            }
            return true;
          },
  });
}

export function useSessionsQuery(
  accessToken?: string | null,
  enabled = true,
  options?: { retry?: boolean | number }
) {
  const token = accessToken || getGlobalAccessToken();

  return useQuery<UserSession[]>({
    queryKey: profileKeys.sessions(accessToken),
    queryFn: ({ signal }) => profileApi.listSessions(token ?? undefined, { signal }),
    enabled: Boolean(token && enabled),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry:
      options?.retry !== undefined
        ? options.retry
        : (failureCount, error) => {
            if (failureCount >= 2) return false;
            if (error instanceof ProfileApiError && (error.status === 401 || error.status === 403)) {
              return false;
            }
            return true;
          },
  });
}

export function useUpdateProfileMutation(accessToken?: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateProfilePayload) =>
      profileApi.updateProfile(data, accessToken || undefined),
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(profileKeys.details(accessToken), updatedProfile);
      void queryClient.invalidateQueries({ queryKey: profileKeys.all });
    },
  });
}

export function useChangePasswordMutation(accessToken?: string | null) {
  return useMutation({
    mutationFn: (data: ChangePasswordPayload) =>
      profileApi.changePassword(data, accessToken || undefined),
  });
}
