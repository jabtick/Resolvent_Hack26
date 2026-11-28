// React Query hooks over lib/api.ts, so pages share caching and loading states.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAccount } from "@/components/AccountProvider";

import type { Badge } from "./achievements";
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
    onSuccess: (_d, { saved }) => toast.success(saved ? "Запазено" : "Махнато от запазени"),
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

export function useMyProfile() {
  const { status } = useAccount();
  return useQuery({
    queryKey: ["me", status],
    queryFn: api.profiles.loadMine,
    enabled: status === "signedIn",
  });
}

/** The signed-in student's badges. */
export function useMyBadges() {
  const { status } = useAccount();
  return useQuery({
    queryKey: ["badges", status],
    queryFn: api.achievements.listMine,
    enabled: status === "signedIn",
  });
}

/** Hide / show a badge on the public profile, with an instant switch. */
export function useToggleBadgeHidden() {
  const cache = useQueryClient();
  const { status } = useAccount();
  const key = ["badges", status];
  return useMutation({
    mutationFn: ({ badge, hidden }: { badge: Badge; hidden: boolean }) =>
      api.achievements.setHidden(badge, hidden),
    onMutate: async ({ badge, hidden }) => {
      await cache.cancelQueries({ queryKey: key });
      const before = cache.getQueryData<Badge[]>(key);
      cache.setQueryData<Badge[]>(key, (list) =>
        list?.map((b) => (b.id === badge.id ? { ...b, hidden } : b)),
      );
      return { before };
    },
    onError: (e, _v, ctx) => {
      cache.setQueryData(key, ctx?.before);
      toast.error(e instanceof Error ? e.message : "Нещо се обърка.");
    },
    onSuccess: (_d, { hidden }) =>
      toast.success(hidden ? "Скрита от публичния профил" : "Видима в публичния профил"),
  });
}
