// React Query hooks over lib/api.ts, so pages share caching and loading states.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAccount } from "@/components/AccountProvider";

import { api } from "./api";
import type { Opp } from "./opps";

export function useFeed() {
  return useQuery({ queryKey: ["feed"], queryFn: api.opps.listFeed });
}

export function useOpp(id: string) {
  return useQuery({ queryKey: ["opp", id], queryFn: () => api.opps.get(id) });
}

export function useSavedIds() {
  const { status } = useAccount();
  return useQuery({
    queryKey: ["saved", status],
    queryFn: api.opps.savedIds,
    enabled: status === "signedIn",
    placeholderData: new Set<string>(),
  });
}

/** Save / unsave with an instant (optimistic) heart. */
export function useToggleSaved() {
  const cache = useQueryClient();
  const { status } = useAccount();
  const key = ["saved", status];
  return useMutation({
    mutationFn: ({ opp, saved }: { opp: Opp; saved: boolean }) => api.opps.setSaved(opp, saved),
    onMutate: async ({ opp, saved }) => {
      await cache.cancelQueries({ queryKey: key });
      const before = cache.getQueryData<Set<string>>(key);
      const next = new Set(before);
      if (saved) next.add(opp.id);
      else next.delete(opp.id);
      cache.setQueryData(key, next);
      return { before };
    },
    onError: (e, _v, ctx) => {
      cache.setQueryData(key, ctx?.before);
      toast.error(e instanceof Error ? e.message : "Нещо се обърка.");
    },
    onSuccess: (_d, { saved }) => {
      toast.success(saved ? "Запазено" : "Махнато от запазени");
      // A save changes the ratings. Refresh "For you" next time it's opened, not now,
      // so the card doesn't vanish under the person's finger.
      void cache.invalidateQueries({ queryKey: ["recommended"], refetchType: "none" });
    },
  });
}

/** Dashboard numbers; only for a signed-in organizer. */
export function useMyStats(enabled: boolean) {
  return useQuery({
    queryKey: ["myStats"],
    queryFn: api.opps.myStats,
    enabled,
  });
}

/** "For you" feed; only asked for when signed in. */
export function useRecommended() {
  const { status } = useAccount();
  return useQuery({
    queryKey: ["recommended", status],
    queryFn: api.opps.recommended,
    enabled: status === "signedIn",
  });
}

export function useMyProfile() {
  const { status } = useAccount();
  return useQuery({
    queryKey: ["me", status],
    queryFn: api.profiles.loadMine,
    enabled: status === "signedIn",
  });
}

export function useMyBadges() {
  const { status } = useAccount();
  return useQuery({
    queryKey: ["badges", status],
    queryFn: api.achievements.listMine,
    enabled: status === "signedIn",
  });
}

/** The fixed tag list (changes only with a migration). */
export function useTags() {
  return useQuery({ queryKey: ["tags"], queryFn: api.opps.listTags, staleTime: Infinity });
}

/** After an organizer creates, edits or deletes an item. */
export function useRefreshOpps() {
  const cache = useQueryClient();
  return () =>
    Promise.all([
      cache.invalidateQueries({ queryKey: ["feed"] }),
      cache.invalidateQueries({ queryKey: ["myStats"] }),
      cache.invalidateQueries({ queryKey: ["opp"] }),
      cache.invalidateQueries({ queryKey: ["oppEdit"] }),
    ]);
}
