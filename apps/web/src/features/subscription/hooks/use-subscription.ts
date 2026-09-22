import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { subscriptionApi } from "../../../api/subscription.api";

export const subscriptionQueryKeys = {
  all: ["subscription"] as const,
  plans: ["subscription", "plans"] as const,
  currentRoot: ["subscription", "current"] as const,
  current: (sessionKey?: string) => ["subscription", "current", sessionKey] as const,
};

export function useSubscriptionPlansQuery(accessToken?: string) {
  return useQuery({
    queryKey: subscriptionQueryKeys.plans,
    queryFn: ({ signal }) => subscriptionApi.getPlans(accessToken!, { signal }),
    enabled: Boolean(accessToken),
  });
}
export function useCurrentSubscriptionQuery(accessToken?: string, sessionKey?: string) {
  return useQuery({
    queryKey: subscriptionQueryKeys.current(sessionKey),
    queryFn: ({ signal }) => subscriptionApi.getCurrent(accessToken!, { signal }),
    enabled: Boolean(accessToken && sessionKey),
  });
}

export function useCancelSubscriptionMutation(accessToken?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => subscriptionApi.cancel(accessToken!),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: subscriptionQueryKeys.currentRoot });
      await queryClient.refetchQueries({
        queryKey: subscriptionQueryKeys.currentRoot,
        type: "active",
      });
    },
  });
}
