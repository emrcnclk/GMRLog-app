import type { UserPublicResponse } from '@gmrlog/types';
import { ErrorBanner, Screen, useTheme } from '@gmrlog/ui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, RefreshControl, View } from 'react-native';

import { mapAuthError } from '../../../src/auth/map-auth-error';
import { useAuthStore } from '../../../src/state/auth-store';
import { useConnectivityStore } from '../../../src/state/stores';
import { ConversationHeader } from '../components/conversation-header';
import { MessageThreadSkeleton } from '../components/conversation-skeleton';
import { EmptyConversation } from '../components/empty-conversation';
import { MessageBubble } from '../components/message-bubble';
import { MessageComposer } from '../components/message-composer';
import { MessagingErrorState } from '../components/messaging-error-state';
import { buildMessageBubbles } from '../hooks/messaging-model';
import { useConversation, useMessages, useSendMessage } from '../hooks/use-messaging';

function readParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }
  return value ?? '';
}

/** Single conversation thread — no realtime · refresh or mutation only. */
export function ConversationScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const conversationId = readParam(params.id);
  const isOnline = useConnectivityStore((s) => s.isOnline);
  const selfId = useAuthStore((s) => s.user?.id);
  const conversationQuery = useConversation(conversationId);
  const messagesQuery = useMessages(conversationId);
  const sendMutation = useSendMessage(conversationId);
  const [sendError, setSendError] = useState<string | null>(null);

  const participantById = useMemo(() => {
    const map = new Map<string, UserPublicResponse>();
    for (const participant of conversationQuery.conversation?.participants ?? []) {
      map.set(participant.id, participant);
    }
    return map;
  }, [conversationQuery.conversation]);

  const invertedBubbles = useMemo(() => {
    const models = buildMessageBubbles(messagesQuery.items, selfId);
    return [...models].reverse();
  }, [messagesQuery.items, selfId]);

  const refreshing = conversationQuery.isRefreshing || messagesQuery.isRefreshing;

  const refresh = useCallback(async () => {
    await Promise.all([conversationQuery.refresh(), messagesQuery.refresh()]);
  }, [conversationQuery, messagesQuery]);

  const onSend = useCallback(
    async (body: string) => {
      setSendError(null);
      try {
        await sendMutation.mutateAsync({ body });
      } catch (error) {
        const mapped = mapAuthError(error, isOnline);
        setSendError(mapped.description);
        throw error;
      }
    },
    [isOnline, sendMutation],
  );

  if (!conversationId) {
    return (
      <Screen>
        <MessagingErrorState
          title="Conversation missing"
          description="Open a conversation from your inbox."
          onRetry={() => {
            router.replace('/(app)/messages');
          }}
        />
      </Screen>
    );
  }

  const loading =
    (conversationQuery.isPending && !conversationQuery.conversation) ||
    messagesQuery.status === 'loading';

  return (
    <Screen edges={[]} style={{ paddingTop: 0, paddingBottom: 0 }}>
      <ConversationHeader
        conversation={conversationQuery.conversation}
        selfId={selfId}
        onBack={() => {
          router.back();
        }}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {loading ? <MessageThreadSkeleton /> : null}

        {!loading && messagesQuery.status === 'error' ? (
          <MessagingErrorState
            isOffline={!isOnline}
            title="Could not load conversation"
            onRetry={() => {
              void messagesQuery.refetch();
            }}
          />
        ) : null}

        {!loading && messagesQuery.status === 'empty' ? (
          <View style={{ flex: 1 }}>
            <EmptyConversation />
          </View>
        ) : null}

        {!loading && messagesQuery.status === 'ready' ? (
          <FlatList
            inverted
            data={invertedBubbles}
            keyExtractor={(item) => item.message.id}
            renderItem={({ item }) => (
              <MessageBubble bubble={item} sender={participantById.get(item.message.senderId)} />
            )}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  void refresh();
                }}
                tintColor={theme.color('color.interactive.primary')}
                colors={[theme.color('color.interactive.primary')]}
              />
            }
            contentContainerStyle={{
              flexGrow: 1,
              paddingVertical: theme.space('space.3'),
            }}
            initialNumToRender={16}
            windowSize={9}
            removeClippedSubviews
            keyboardShouldPersistTaps="handled"
          />
        ) : null}

        {sendError ? (
          <View style={{ paddingHorizontal: theme.space('space.4') }}>
            <ErrorBanner title="Could not send" description={sendError} />
          </View>
        ) : null}

        <MessageComposer sending={sendMutation.isPending} onSend={onSend} />
      </KeyboardAvoidingView>
    </Screen>
  );
}
