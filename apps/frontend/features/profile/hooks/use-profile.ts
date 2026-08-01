import type { MePatchInput } from '@gmrlog/validators';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { createExpoSecureStorage } from '../../../lib/storage/expo-secure-storage';
import type { SecureStorage } from '../../../lib/storage/secure-storage';
import { useApiClient } from '../../../src/api/api-provider';
import { invalidateProfileQueries, queryKeys } from '../../../src/query/query-client';
import { useAuthStore } from '../../../src/state/auth-store';
import { loadProfileTab, PROFILE_TAB_DEFAULT, saveProfileTab } from '../storage/profile-tab';

import {
  buildProfileStats,
  resolveProfileView,
  takeRecent,
  type ProfileTabId,
} from './profile-model';
import { useCollections } from './use-collections';
import { useLibrary } from './use-library';
import { useProfileActivity } from './use-profile-activity';
import { useMeAchievements, useMeArchetypes, useMeStatistics } from './use-profile-social';
import { useTierLists } from './use-tier-lists';

export function useProfileTab(storage?: SecureStorage) {
  const store = useMemo(() => storage ?? createExpoSecureStorage(), [storage]);
  const [tab, setTabState] = useState<ProfileTabId>(PROFILE_TAB_DEFAULT);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void loadProfileTab(store).then((saved) => {
      if (!cancelled) {
        setTabState(saved);
        setHydrated(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [store]);

  const setTab = useCallback(
    (next: ProfileTabId) => {
      setTabState(next);
      void saveProfileTab(store, next);
    },
    [store],
  );

  return { tab, setTab, hydrated };
}

export function useProfile() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const authUser = useAuthStore((s) => s.user);

  const query = useQuery({
    queryKey: queryKeys.me,
    queryFn: async () => {
      const envelope = await api.me();
      return envelope.data;
    },
    initialData: authUser ?? undefined,
  });

  const user = query.data ?? authUser ?? null;

  const view = resolveProfileView({
    isPending: query.isPending && !user,
    isError: query.isError,
    error: query.error,
    user,
    isRefreshing: query.isRefetching,
  });

  const refresh = useCallback(async () => {
    await invalidateProfileQueries(queryClient);
  }, [queryClient]);

  return {
    ...view,
    refresh,
    refetch: query.refetch,
  };
}

export function useEditProfile() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: MePatchInput) => {
      const envelope = await api.patchMe(body);
      return envelope.data;
    },
    onSuccess: (user) => {
      queryClient.setQueryData(queryKeys.me, user);
      useAuthStore.setState({ user });
    },
  });
}

/** Aggregated profile refresh + overview slices. */
export function useProfileScreenData() {
  const profile = useProfile();
  const library = useLibrary();
  const collections = useCollections();
  const tierLists = useTierLists();
  const activity = useProfileActivity();
  const statistics = useMeStatistics();
  const achievements = useMeAchievements();
  const archetypes = useMeArchetypes();

  const stats = useMemo(
    () =>
      buildProfileStats({
        hub: library.hub,
        collectionsCount: collections.items.length,
        tierListsCount: tierLists.items.length,
        statistics: statistics.statistics,
      }),
    [library.hub, collections.items.length, tierLists.items.length, statistics.statistics],
  );

  const overview = useMemo(
    () => ({
      recentActivity: takeRecent(activity.items),
      recentCollections: takeRecent(collections.items),
      recentTierLists: takeRecent(tierLists.items),
      awardedAchievements: takeRecent(achievements.awarded),
      archetypes: takeRecent(archetypes.items, 6),
    }),
    [activity.items, collections.items, tierLists.items, achievements.awarded, archetypes.items],
  );

  const queryClient = useQueryClient();

  const isRefreshing =
    profile.isRefreshing ||
    library.isRefreshing ||
    collections.isRefreshing ||
    tierLists.isRefreshing ||
    activity.isRefreshing ||
    statistics.isRefreshing ||
    achievements.isRefreshing ||
    archetypes.isRefreshing;

  const refresh = useCallback(async () => {
    await invalidateProfileQueries(queryClient);
  }, [queryClient]);

  return {
    profile,
    library,
    collections,
    tierLists,
    activity,
    statistics,
    achievements,
    archetypes,
    stats,
    overview,
    isRefreshing,
    refresh,
  };
}
