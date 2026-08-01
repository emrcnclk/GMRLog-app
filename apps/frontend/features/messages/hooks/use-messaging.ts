import type { ConversationResponse, MessageResponse } from '@gmrlog/types';
import type { ConversationCreateInput, MessageCreateInput } from '@gmrlog/validators';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useApiClient } from '../../../src/api/api-provider';
import { queryKeys } from '../../../src/query/query-client';
import { useAuthStore } from '../../../src/state/auth-store';

import { createIdempotencyKey, createOptimisticMessage, resolveListView } from './messaging-model';

export function useConversations() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.messages.conversations(),
    queryFn: async () => {
      const envelope = await api.listConversations();
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
    await queryClient.invalidateQueries({ queryKey: queryKeys.messages.conversations() });
  }, [queryClient]);

  return {
    ...view,
    refresh,
    refetch: query.refetch,
  };
}

export function useConversation(conversationId: string) {
  const api = useApiClient();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.messages.conversation(conversationId),
    enabled: conversationId.length > 0,
    queryFn: async () => {
      const envelope = await api.getConversation(conversationId);
      return envelope.data;
    },
  });

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: queryKeys.messages.conversation(conversationId),
    });
  }, [conversationId, queryClient]);

  return {
    conversation: query.data ?? null,
    isPending: query.isPending,
    isError: query.isError,
    error: query.error,
    isRefreshing: query.isRefetching,
    refresh,
    refetch: query.refetch,
  };
}

export function useMessages(conversationId: string) {
  const api = useApiClient();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.messages.thread(conversationId),
    enabled: conversationId.length > 0,
    queryFn: async () => {
      const envelope = await api.listMessages(conversationId);
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
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.messages.thread(conversationId) }),
      queryClient.invalidateQueries({
        queryKey: queryKeys.messages.conversation(conversationId),
      }),
    ]);
  }, [conversationId, queryClient]);

  return {
    ...view,
    refresh,
    refetch: query.refetch,
  };
}

export function useCreateConversation() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ConversationCreateInput) => {
      const envelope = await api.createConversation(input);
      return envelope.data;
    },
    onSuccess: (conversation) => {
      queryClient.setQueryData(queryKeys.messages.conversation(conversation.id), conversation);
      void queryClient.invalidateQueries({ queryKey: queryKeys.messages.conversations() });
    },
  });
}

export function useSendMessage(conversationId: string) {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const selfId = useAuthStore((s) => s.user?.id);

  return useMutation({
    mutationFn: async (input: MessageCreateInput) => {
      const envelope = await api.sendMessage(conversationId, input, createIdempotencyKey('msg'));
      return envelope.data;
    },
    onMutate: async (input) => {
      if (!selfId) {
        return { previous: undefined as MessageResponse[] | undefined, optimisticId: null };
      }
      const threadKey = queryKeys.messages.thread(conversationId);
      await queryClient.cancelQueries({ queryKey: threadKey });
      const previous = queryClient.getQueryData<MessageResponse[]>(threadKey);
      const optimistic = createOptimisticMessage(input.body, selfId);
      queryClient.setQueryData<MessageResponse[]>(threadKey, [...(previous ?? []), optimistic]);
      return { previous, optimisticId: optimistic.id };
    },
    onError: (_error, _input, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(queryKeys.messages.thread(conversationId), context.previous);
      }
    },
    onSuccess: (conversation) => {
      queryClient.setQueryData(queryKeys.messages.conversation(conversationId), conversation);
      void queryClient.invalidateQueries({
        queryKey: queryKeys.messages.thread(conversationId),
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.messages.conversations() });
    },
  });
}

export type { ConversationResponse };
