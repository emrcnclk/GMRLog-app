import type { CollectionResponse } from '@gmrlog/types';
import type {
  CollectionCreateInput,
  CollectionEntriesPutInput,
  CollectionPatchInput,
} from '@gmrlog/validators';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useApiClient } from '../../../src/api/api-provider';
import { queryKeys } from '../../../src/query/query-client';

import { resolveListView } from './collection-model';

export function useCollections() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.collections.list(),
    queryFn: async () => {
      const envelope = await api.listCollections();
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
    await queryClient.invalidateQueries({ queryKey: queryKeys.collections.list() });
  }, [queryClient]);

  return { ...view, refresh, refetch: query.refetch };
}

export function useCollection(collectionId: string) {
  const api = useApiClient();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.collections.detail(collectionId),
    enabled: collectionId.length > 0,
    queryFn: async () => {
      const envelope = await api.getCollection(collectionId);
      return envelope.data;
    },
  });

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: queryKeys.collections.detail(collectionId),
    });
  }, [collectionId, queryClient]);

  return {
    collection: query.data ?? null,
    isPending: query.isPending,
    isError: query.isError,
    error: query.error,
    isRefreshing: query.isRefetching,
    refresh,
    refetch: query.refetch,
  };
}

export function useCreateCollection() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CollectionCreateInput) => {
      const envelope = await api.createCollection(input);
      return envelope.data;
    },
    onSuccess: (collection) => {
      queryClient.setQueryData(queryKeys.collections.detail(collection.id), collection);
      void queryClient.invalidateQueries({ queryKey: queryKeys.collections.list() });
    },
  });
}

export function useUpdateCollection(collectionId: string) {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CollectionPatchInput) => {
      const envelope = await api.patchCollection(collectionId, input);
      return envelope.data;
    },
    onMutate: async (input) => {
      const key = queryKeys.collections.detail(collectionId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<CollectionResponse>(key);
      if (previous) {
        const optimistic: CollectionResponse = {
          ...previous,
          title: input.title ?? previous.title,
          description: input.description === undefined ? previous.description : input.description,
          visibility: input.visibility ?? previous.visibility,
          updatedAt: new Date().toISOString(),
        };
        queryClient.setQueryData(key, optimistic);
        patchCollectionInList(queryClient, optimistic);
      }
      return { previous };
    },
    onError: (_error, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.collections.detail(collectionId), context.previous);
        patchCollectionInList(queryClient, context.previous);
      }
    },
    onSuccess: (collection) => {
      queryClient.setQueryData(queryKeys.collections.detail(collection.id), collection);
      void queryClient.invalidateQueries({ queryKey: queryKeys.collections.list() });
    },
  });
}

export function useDeleteCollection() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (collectionId: string) => {
      await api.deleteCollection(collectionId);
      return collectionId;
    },
    onMutate: async (collectionId) => {
      const listKey = queryKeys.collections.list();
      const detailKey = queryKeys.collections.detail(collectionId);
      await queryClient.cancelQueries({ queryKey: listKey });
      await queryClient.cancelQueries({ queryKey: detailKey });
      const previous = queryClient.getQueryData<CollectionResponse[]>(listKey);
      const previousDetail = queryClient.getQueryData<CollectionResponse>(detailKey);
      if (previous) {
        queryClient.setQueryData(
          listKey,
          previous.filter((item) => item.id !== collectionId),
        );
      }
      queryClient.removeQueries({ queryKey: detailKey });
      return { previous, previousDetail, detailKey };
    },
    onError: (_error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.collections.list(), context.previous);
      }
      if (context?.previousDetail) {
        queryClient.setQueryData(context.detailKey, context.previousDetail);
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.collections.list() });
    },
  });
}

export function useReplaceEntries(collectionId: string) {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CollectionEntriesPutInput) => {
      const envelope = await api.replaceCollectionEntries(collectionId, input);
      return envelope.data;
    },
    onMutate: async (input) => {
      const key = queryKeys.collections.detail(collectionId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<CollectionResponse>(key);
      if (previous) {
        const optimistic: CollectionResponse = {
          ...previous,
          updatedAt: new Date().toISOString(),
          entries: input.entries.map((entry, index) => ({
            gameId: entry.gameId,
            position: index,
            note: entry.note ?? null,
            game: previous.entries.find((e) => e.gameId === entry.gameId)?.game,
          })),
        };
        queryClient.setQueryData(key, optimistic);
        patchCollectionInList(queryClient, optimistic);
      }
      return { previous };
    },
    onError: (_error, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.collections.detail(collectionId), context.previous);
        patchCollectionInList(queryClient, context.previous);
      }
    },
    onSuccess: (collection) => {
      queryClient.setQueryData(queryKeys.collections.detail(collection.id), collection);
      void queryClient.invalidateQueries({ queryKey: queryKeys.collections.list() });
    },
  });
}

function patchCollectionInList(
  queryClient: ReturnType<typeof useQueryClient>,
  collection: CollectionResponse,
): void {
  const listKey = queryKeys.collections.list();
  const list = queryClient.getQueryData<CollectionResponse[]>(listKey);
  if (!list) {
    return;
  }
  queryClient.setQueryData(
    listKey,
    list.map((item) => (item.id === collection.id ? collection : item)),
  );
}
