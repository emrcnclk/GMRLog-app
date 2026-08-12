import type { ReactionResponse, TierListResponse } from '@gmrlog/types';
import type {
  TierListCreateInput,
  TierListPatchInput,
  TierListSlotsPutInput,
} from '@gmrlog/validators';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

import { useApiClient } from '../../../src/api/api-provider';
import { createIdempotencyKey } from '../../../src/api/idempotency';
import { queryKeys } from '../../../src/query/query-client';

import {
  boardToSlotsPutPayload,
  forkTierListTitle,
  resolveListView,
  toEditableBoard,
} from './tier-list-model';

export function useTierLists() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.tierLists.list(),
    queryFn: async () => {
      const envelope = await api.listTierLists();
      return envelope.data;
    },
  });

  const items = query.data ?? [];
  const view = resolveListView({
    isPending: query.isPending,
    isError: query.isError,
    error: query.error,
    items,
    isRefreshing: query.isRefetching,
  });

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.tierLists.list() });
  }, [queryClient]);

  return { ...view, refresh, refetch: query.refetch };
}

export function useTierList(tierListId: string) {
  const api = useApiClient();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.tierLists.detail(tierListId),
    enabled: tierListId.length > 0,
    queryFn: async () => {
      const envelope = await api.getTierList(tierListId);
      return envelope.data;
    },
  });

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: queryKeys.tierLists.detail(tierListId),
    });
  }, [queryClient, tierListId]);

  return {
    tierList: query.data ?? null,
    isPending: query.isPending,
    isError: query.isError,
    error: query.error,
    isRefreshing: query.isRefetching,
    refresh,
    refetch: query.refetch,
  };
}

export function useCreateTierList() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: TierListCreateInput) => {
      const envelope = await api.createTierList(input);
      return envelope.data;
    },
    onSuccess: (tierList) => {
      queryClient.setQueryData(queryKeys.tierLists.detail(tierList.id), tierList);
      void queryClient.invalidateQueries({ queryKey: queryKeys.tierLists.list() });
    },
  });
}

export function useUpdateTierList(tierListId: string) {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: TierListPatchInput) => {
      const envelope = await api.patchTierList(tierListId, input);
      return envelope.data;
    },
    onMutate: async (input) => {
      const key = queryKeys.tierLists.detail(tierListId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<TierListResponse>(key);
      if (previous) {
        const optimistic: TierListResponse = {
          ...previous,
          title: input.title ?? previous.title,
          visibility: input.visibility ?? previous.visibility,
          updatedAt: new Date().toISOString(),
        };
        queryClient.setQueryData(key, optimistic);
        patchTierListInList(queryClient, optimistic);
      }
      return { previous };
    },
    onError: (_error, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.tierLists.detail(tierListId), context.previous);
        patchTierListInList(queryClient, context.previous);
      }
    },
    onSuccess: (tierList) => {
      queryClient.setQueryData(queryKeys.tierLists.detail(tierList.id), tierList);
      void queryClient.invalidateQueries({ queryKey: queryKeys.tierLists.list() });
    },
  });
}

export function useDeleteTierList() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tierListId: string) => {
      await api.deleteTierList(tierListId);
      return tierListId;
    },
    onMutate: async (tierListId) => {
      const listKey = queryKeys.tierLists.list();
      const detailKey = queryKeys.tierLists.detail(tierListId);
      await queryClient.cancelQueries({ queryKey: listKey });
      await queryClient.cancelQueries({ queryKey: detailKey });
      const previous = queryClient.getQueryData<TierListResponse[]>(listKey);
      const previousDetail = queryClient.getQueryData<TierListResponse>(detailKey);
      if (previous) {
        queryClient.setQueryData(
          listKey,
          previous.filter((item) => item.id !== tierListId),
        );
      }
      queryClient.removeQueries({ queryKey: detailKey });
      return { previous, previousDetail, detailKey };
    },
    onError: (_error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.tierLists.list(), context.previous);
      }
      if (context?.previousDetail) {
        queryClient.setQueryData(context.detailKey, context.previousDetail);
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.tierLists.list() });
    },
  });
}

export function useReplaceSlots(tierListId: string) {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: TierListSlotsPutInput) => {
      const envelope = await api.replaceTierListSlots(tierListId, input);
      return envelope.data;
    },
    onMutate: async (input) => {
      const key = queryKeys.tierLists.detail(tierListId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<TierListResponse>(key);
      if (previous) {
        const optimistic: TierListResponse = {
          ...previous,
          updatedAt: new Date().toISOString(),
          slots: input.slots.map((slot, slotIndex) => ({
            label: slot.label,
            position: slotIndex,
            games: slot.gameIds.map((gameId, gameIndex) => {
              const prior = previous.slots.flatMap((s) => s.games).find((g) => g.gameId === gameId);
              return {
                gameId,
                position: gameIndex,
                game: prior?.game,
              };
            }),
          })),
        };
        queryClient.setQueryData(key, optimistic);
        patchTierListInList(queryClient, optimistic);
      }
      return { previous };
    },
    onError: (_error, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.tierLists.detail(tierListId), context.previous);
        patchTierListInList(queryClient, context.previous);
      }
    },
    onSuccess: (tierList) => {
      queryClient.setQueryData(queryKeys.tierLists.detail(tierList.id), tierList);
      void queryClient.invalidateQueries({ queryKey: queryKeys.tierLists.list() });
    },
  });
}

/**
 * Fork — §20's action row, composed from the two mutations that already
 * exist rather than a dedicated endpoint (`TierListsController` has none).
 * Create, then replace the new list's slots with the source board; a failure
 * on the second call leaves an empty tier list behind rather than a corrupt
 * one, which is the safer half to fail on.
 */
export function useForkTierList() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (source: TierListResponse) => {
      const created = await api.createTierList({
        title: forkTierListTitle(source.title),
        visibility: 'private',
      });
      const payload = boardToSlotsPutPayload(toEditableBoard(source.slots));
      const replaced = await api.replaceTierListSlots(created.data.id, payload);
      return replaced.data;
    },
    onSuccess: (tierList) => {
      queryClient.setQueryData(queryKeys.tierLists.detail(tierList.id), tierList);
      void queryClient.invalidateQueries({ queryKey: queryKeys.tierLists.list() });
    },
  });
}

/**
 * Like — `tier_list` is a real `ReactionTargetTypeValue`, but
 * `TierListResponse` carries no aggregate count and no viewer state
 * (`reactionSummary` / `viewerState` are documented as "deferred with
 * Reactions" in `ReactionResponse`'s own comment). Without a persisted
 * viewer-state to read on load, this can only be a session-local toggle: the
 * created reaction's id is kept in memory so a second tap can undo it, but a
 * remount forgets it, honestly, rather than guessing.
 */
export function useToggleTierListLike(tierListId: string) {
  const api = useApiClient();
  const [reaction, setReaction] = useState<ReactionResponse | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      if (reaction) {
        await api.deleteReaction(reaction.id);
        return null;
      }
      const envelope = await api.createReaction(
        { targetType: 'tier_list', targetId: tierListId, kind: 'like' },
        createIdempotencyKey('reaction'),
      );
      return envelope.data;
    },
    onSuccess: (result) => {
      setReaction(result);
    },
  });

  return {
    liked: reaction !== null,
    toggle: mutation.mutate,
    isPending: mutation.isPending,
  };
}

function patchTierListInList(
  queryClient: ReturnType<typeof useQueryClient>,
  tierList: TierListResponse,
): void {
  const listKey = queryKeys.tierLists.list();
  const list = queryClient.getQueryData<TierListResponse[]>(listKey);
  if (!list) {
    return;
  }
  queryClient.setQueryData(
    listKey,
    list.map((item) => (item.id === tierList.id ? tierList : item)),
  );
}
