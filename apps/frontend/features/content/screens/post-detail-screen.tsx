import type { PostResponse } from '@gmrlog/types';
import { Badge, Button, Dialog, ErrorBanner, Screen, Text, TextField, useTheme } from '@gmrlog/ui';
import { quoteCreateSchema } from '@gmrlog/validators';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';

import { mapAuthError } from '../../../src/auth/map-auth-error';
import { ScreenHeader } from '../../../src/navigation/screen-header';
import { useAuthStore } from '../../../src/state/auth-store';
import { useConnectivityStore } from '../../../src/state/stores';
import { ContentErrorState } from '../components/content-error-state';
import { ContentListSkeleton } from '../components/content-list-skeleton';
import { visibilityLabel } from '../hooks/content-model';
import { mapContentError } from '../hooks/map-content-error';
import { usePost } from '../hooks/use-posts';
import { useBookmarkPost, useCreateQuote, useUnbookmarkPost } from '../hooks/use-social-actions';

export interface PostDetailScreenProps {
  postId: string;
}

/** Post detail — GET /posts/{id} · quote · bookmark (D3.24). */
export function PostDetailScreen({ postId }: PostDetailScreenProps) {
  const theme = useTheme();
  const router = useRouter();
  const isOnline = useConnectivityStore((s) => s.isOnline);
  const userId = useAuthStore((s) => s.user?.id);
  const query = usePost(postId);
  const createQuote = useCreateQuote();
  const bookmark = useBookmarkPost();
  const unbookmark = useUnbookmarkPost();

  const [quoteOpen, setQuoteOpen] = useState(false);
  const [quoteBody, setQuoteBody] = useState('');
  const [banner, setBanner] = useState<{ title: string; description: string } | null>(null);
  const [bookmarked, setBookmarked] = useState(false);

  const onBack = useCallback(() => {
    router.back();
  }, [router]);

  const onEdit = useCallback(() => {
    router.push(`/(app)/post/${postId}/edit`);
  }, [postId, router]);

  const submitQuote = useCallback(async () => {
    setBanner(null);
    try {
      const payload = quoteCreateSchema.parse({
        targetType: 'post',
        targetId: postId,
        body: quoteBody,
      });
      await createQuote.mutateAsync(payload);
      setQuoteOpen(false);
      setQuoteBody('');
    } catch (error) {
      setBanner(mapContentError(error, isOnline));
    }
  }, [createQuote, isOnline, postId, quoteBody]);

  const toggleBookmark = useCallback(async () => {
    setBanner(null);
    try {
      if (bookmarked) {
        await unbookmark.mutateAsync(postId);
        setBookmarked(false);
      } else {
        await bookmark.mutateAsync(postId);
        setBookmarked(true);
      }
    } catch (error) {
      setBanner(mapContentError(error, isOnline));
    }
  }, [bookmarked, bookmark, isOnline, postId, unbookmark]);

  if (query.isPending) {
    return (
      <Screen edges={['left', 'right', 'bottom']} style={{ paddingTop: 0, paddingBottom: 0 }}>
        <ContentListSkeleton />
      </Screen>
    );
  }

  if (query.isError && !query.data) {
    const mapped = mapAuthError(query.error, isOnline);
    return (
      <Screen edges={['left', 'right', 'bottom']} style={{ paddingTop: 0, paddingBottom: 0 }}>
        <ContentErrorState
          title={mapped.title}
          description={mapped.description}
          isOffline={!isOnline}
          onRetry={() => {
            void query.refetch();
          }}
        />
      </Screen>
    );
  }

  const post = query.data;
  const isAuthor = userId === post.author.id;
  const poll = post.poll;

  return (
    <Screen edges={['left', 'right', 'bottom']} style={{ paddingTop: 0, paddingBottom: 0 }}>
      <ScreenHeader title="Post" titleRole="title" onBack={onBack} />

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching}
            onRefresh={() => {
              void query.refetch();
            }}
            tintColor={theme.color('color.interactive.primary')}
            colors={[theme.color('color.interactive.primary')]}
          />
        }
        contentContainerStyle={{
          paddingBottom: theme.space('space.10'),
          gap: theme.space('space.4'),
        }}
      >
        <View style={{ paddingHorizontal: theme.space('space.4'), gap: theme.space('space.3') }}>
          <View style={{ gap: theme.space('space.1') }}>
            <Text role="label" color="color.text.primary">
              {post.author.displayName}
            </Text>
            <Text role="meta" color="color.text.tertiary">
              @{post.author.handle}
            </Text>
          </View>
          <Text role="body" color="color.text.primary">
            {post.body}
          </Text>
          <Badge tone="neutral">{visibilityLabel(post.visibility)}</Badge>
          {post.postKind === 'poll' && poll ? <PollBlock poll={poll} /> : null}
        </View>

        {banner ? (
          <View style={{ paddingHorizontal: theme.space('space.4') }}>
            <ErrorBanner title={banner.title} description={banner.description} />
          </View>
        ) : null}

        <View
          style={{
            paddingHorizontal: theme.space('space.4'),
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: theme.space('space.2'),
          }}
        >
          <Button
            variant="secondary"
            size="sm"
            accessibilityLabel="Quote post"
            loading={createQuote.isPending}
            onPress={() => {
              setQuoteOpen(true);
            }}
          >
            Quote
          </Button>
          <Button
            variant="secondary"
            size="sm"
            accessibilityLabel={bookmarked ? 'Remove bookmark' : 'Bookmark post'}
            loading={bookmark.isPending || unbookmark.isPending}
            onPress={() => {
              void toggleBookmark();
            }}
          >
            {bookmarked ? 'Bookmarked' : 'Bookmark'}
          </Button>
          {isAuthor ? (
            <Button variant="ghost" size="sm" accessibilityLabel="Edit post" onPress={onEdit}>
              Edit
            </Button>
          ) : null}
        </View>
      </ScrollView>

      <Dialog
        visible={quoteOpen}
        title="Quote post"
        onClose={() => {
          setQuoteOpen(false);
        }}
        actions={
          <>
            <Button
              variant="ghost"
              accessibilityLabel="Cancel quote"
              disabled={createQuote.isPending}
              onPress={() => {
                setQuoteOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              accessibilityLabel="Publish quote"
              loading={createQuote.isPending}
              disabled={quoteBody.trim().length === 0}
              onPress={() => {
                void submitQuote();
              }}
            >
              Publish quote
            </Button>
          </>
        }
      >
        <View style={{ gap: theme.space('space.3') }}>
          <Text role="body" color="color.text.secondary">
            Add your commentary to amplify this post.
          </Text>
          <TextField
            value={quoteBody}
            onChangeText={setQuoteBody}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            placeholder="Your quote commentary…"
            accessibilityLabel="Quote commentary"
            style={{ minHeight: theme.space('space.16') }}
          />
        </View>
      </Dialog>
    </Screen>
  );
}

function PollBlock({ poll }: { poll: NonNullable<PostResponse['poll']> }) {
  const theme = useTheme();
  return (
    <View
      style={{
        gap: theme.space('space.2'),
        padding: theme.space('space.3'),
        borderRadius: theme.radius('radius.md'),
        backgroundColor: theme.color('color.surface.secondary'),
      }}
    >
      <Text role="label" color="color.text.primary">
        {poll.question}
      </Text>
      {poll.options.map((option) => (
        <View
          key={option.index}
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            gap: theme.space('space.2'),
          }}
        >
          <Text role="body" color="color.text.secondary">
            {option.label}
          </Text>
          <Text role="meta" color="color.text.tertiary">
            {option.voteCount}
          </Text>
        </View>
      ))}
      {poll.viewerVoteIndex !== null ? (
        <Text role="caption" color="color.text.tertiary">
          You voted for option {poll.viewerVoteIndex + 1}
        </Text>
      ) : null}
    </View>
  );
}
