import {
  Button,
  EmptyState,
  SCREEN_GUTTER,
  Screen,
  ScreenTitle,
  SearchField,
  useTheme,
} from '@gmrlog/ui';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, RefreshControl } from 'react-native';

import { useAuthStore } from '../../../src/state/auth-store';
import { useConnectivityStore } from '../../../src/state/stores';
import { useOnlineFriends } from '../../friends/hooks/use-friends';
import { ConversationCard } from '../components/conversation-card';
import { ConversationSkeleton } from '../components/conversation-skeleton';
import { EmptyInbox } from '../components/empty-inbox';
import { MessagingErrorState } from '../components/messaging-error-state';
import { PresenceRail } from '../components/presence-rail';
import { filterConversations } from '../hooks/messaging-model';
import { useConversations } from '../hooks/use-messaging';

/**
 * Inbox (`SCREEN_REDESIGNS.md` §11) — presence first, then thread rows.
 *
 * `ScreenTitle`, not `NavHeader`: this is the top of the content, the same
 * rule 3.1–3.3 already established for Achievements/Settings/Notifications.
 * The search field stays fixed with the title (you search while scrolling a
 * filtered list, not by scrolling back up for it); the presence rail scrolls
 * away with the thread rows, since it is content and not chrome.
 */
export function ConversationsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const isOnline = useConnectivityStore((s) => s.isOnline);
  const selfId = useAuthStore((s) => s.user?.id);
  const inbox = useConversations();
  const online = useOnlineFriends();
  const [query, setQuery] = useState('');

  const openNew = useCallback(() => {
    router.push('/(app)/messages/new');
  }, [router]);

  const openConversation = useCallback(
    (id: string) => {
      router.push(`/(app)/messages/${id}`);
    },
    [router],
  );

  const openFriend = useCallback(
    (userId: string) => {
      router.push(`/(app)/user/${userId}`);
    },
    [router],
  );

  const visibleConversations = useMemo(
    () => filterConversations(inbox.items, query, selfId),
    [inbox.items, query, selfId],
  );

  return (
    <Screen edges={['top']} style={{ paddingBottom: 0 }}>
      <ScreenTitle
        title="Messages"
        backLabel="← Profile"
        onPressBack={() => {
          router.back();
        }}
        trailing={
          <Button variant="ghost" size="sm" accessibilityLabel="New conversation" onPress={openNew}>
            New
          </Button>
        }
      />

      {inbox.status === 'ready' ? (
        <SearchField
          label="Search messages"
          placeholder="Search by name or message"
          value={query}
          onChangeText={setQuery}
          onClear={() => {
            setQuery('');
          }}
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel="Search conversations"
          style={{
            paddingHorizontal: theme.space(SCREEN_GUTTER),
            paddingBottom: theme.space('space.3'),
          }}
        />
      ) : null}

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
          data={visibleConversations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ConversationCard conversation={item} selfId={selfId} onPress={openConversation} />
          )}
          ListHeaderComponent={
            online.isPending || online.isError ? null : (
              <PresenceRail friends={online.friends} onPressFriend={openFriend} />
            )
          }
          ListEmptyComponent={
            query.trim().length > 0 ? (
              <EmptyState title="No results" description="Try a different name or word." />
            ) : null
          }
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
