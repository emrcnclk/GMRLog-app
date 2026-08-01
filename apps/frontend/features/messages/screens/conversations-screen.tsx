import { Button, Screen, useTheme } from '@gmrlog/ui';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { FlatList, RefreshControl } from 'react-native';

import { ScreenHeader } from '../../../src/navigation/screen-header';
import { useAuthStore } from '../../../src/state/auth-store';
import { useConnectivityStore } from '../../../src/state/stores';
import { ConversationCard } from '../components/conversation-card';
import { ConversationSkeleton } from '../components/conversation-skeleton';
import { EmptyInbox } from '../components/empty-inbox';
import { MessagingErrorState } from '../components/messaging-error-state';
import { useConversations } from '../hooks/use-messaging';

/** Inbox — conversation list (newest activity first from backend). */
export function ConversationsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const isOnline = useConnectivityStore((s) => s.isOnline);
  const selfId = useAuthStore((s) => s.user?.id);
  const inbox = useConversations();

  const openNew = useCallback(() => {
    router.push('/(app)/messages/new');
  }, [router]);

  const openConversation = useCallback(
    (id: string) => {
      router.push(`/(app)/messages/${id}`);
    },
    [router],
  );

  return (
    <Screen edges={['left', 'right', 'bottom']} style={{ paddingTop: 0, paddingBottom: 0 }}>
      <ScreenHeader
        title="Messages"
        onBack={() => {
          router.back();
        }}
        trailing={
          <Button variant="ghost" size="sm" accessibilityLabel="New conversation" onPress={openNew}>
            New
          </Button>
        }
      />

      {inbox.status === 'loading' ? <ConversationSkeleton /> : null}

      {inbox.status === 'error' ? (
        <MessagingErrorState
          isOffline={!isOnline}
          onRetry={() => {
            void inbox.refetch();
          }}
        />
      ) : null}

      {inbox.status === 'empty' ? <EmptyInbox onNewConversation={openNew} /> : null}

      {inbox.status === 'ready' ? (
        <FlatList
          data={inbox.items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ConversationCard conversation={item} selfId={selfId} onPress={openConversation} />
          )}
          refreshControl={
            <RefreshControl
              refreshing={inbox.isRefreshing}
              onRefresh={() => {
                void inbox.refresh();
              }}
              tintColor={theme.color('color.interactive.primary')}
              colors={[theme.color('color.interactive.primary')]}
            />
          }
          contentContainerStyle={{ flexGrow: 1, paddingBottom: theme.space('space.8') }}
          initialNumToRender={12}
          windowSize={7}
          removeClippedSubviews
        />
      ) : null}
    </Screen>
  );
}
