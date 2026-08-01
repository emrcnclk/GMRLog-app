import type { ReviewResponse } from '@gmrlog/types';
import { Button, Divider, EmptyState, Screen, Text, TextField, useTheme } from '@gmrlog/ui';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Share, View } from 'react-native';

import { ScreenHeader } from '../../../src/navigation/screen-header';
import { useAuthStore } from '../../../src/state/auth-store';
import { useConnectivityStore } from '../../../src/state/stores';
import { ContentErrorState } from '../components/content-error-state';
import { ContentListSkeleton } from '../components/content-list-skeleton';
import { ReviewActionBar } from '../components/review/review-action-bar';
import { ReviewAuthorCard } from '../components/review/review-author-card';
import { ReviewBody } from '../components/review/review-body';
import { ReviewCommentThread } from '../components/review/review-comment-thread';
import { ReviewCard } from '../components/review-card';
import {
  reviewQuoteSeed,
  reviewShareMessage,
  reviewShareUrl,
  selectRelatedReviews,
  shouldHideSpoilerBody,
} from '../hooks/review-detail-model';
import { useCreateReviewComment, useReviewComments } from '../hooks/use-review-comments';
import { useReview, useGameReviews } from '../hooks/use-reviews';

export interface ReviewDetailScreenProps {
  reviewId: string;
}

/** How long the copy control stays in its confirmed state. */
const COPY_CONFIRM_MS = 2000;

/**
 * Review page (D3.28 Phase 4) — replaces the `DetailPlaceholderScreen` that
 * stood here since D3.5.
 *
 * This surface is linked from notifications, search, the Game Hub reviews tab,
 * and the home feed, so it was the most-referenced stub in the product. Every
 * read it needs has been served since D3.21; none of it was reachable.
 */
export function ReviewDetailScreen({ reviewId }: ReviewDetailScreenProps) {
  const theme = useTheme();
  const router = useRouter();
  const isOnline = useConnectivityStore((s) => s.isOnline);
  const viewerId = useAuthStore((s) => s.user?.id);

  const review = useReview(reviewId);
  const comments = useReviewComments(reviewId);
  const createComment = useCreateReviewComment(reviewId);

  const gameId = review.data?.gameId ?? '';
  const gameReviews = useGameReviews(gameId);

  const [draft, setDraft] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const composerRef = useRef<View>(null);
  const scrollRef = useRef<ScrollView>(null);

  const related = useMemo(
    () => selectRelatedReviews(gameReviews.items, reviewId),
    [gameReviews.items, reviewId],
  );

  const openUser = useCallback(
    (userId: string) => {
      router.push(`/(app)/user/${userId}`);
    },
    [router],
  );

  const openGame = useCallback(
    (id: string) => {
      router.push(`/(app)/game/${id}`);
    },
    [router],
  );

  const openReview = useCallback(
    (id: string) => {
      router.push(`/(app)/review/${id}`);
    },
    [router],
  );

  const onShare = useCallback((target: ReviewResponse) => {
    void Share.share({
      message: reviewShareMessage(target),
      url: reviewShareUrl(target.id),
    });
  }, []);

  const onCopyLink = useCallback((target: ReviewResponse) => {
    void Clipboard.setStringAsync(reviewShareUrl(target.id)).then(() => {
      setLinkCopied(true);
      setTimeout(() => {
        setLinkCopied(false);
      }, COPY_CONFIRM_MS);
    });
  }, []);

  const onQuote = useCallback(
    (target: ReviewResponse) => {
      router.push({
        pathname: '/(app)/post/create',
        params: { gameId: target.gameId, body: reviewQuoteSeed(target) },
      });
    },
    [router],
  );

  const focusComposer = useCallback((parentCommentId: string | null) => {
    setReplyTo(parentCommentId);
    scrollRef.current?.scrollToEnd({ animated: true });
  }, []);

  const submitComment = useCallback(() => {
    const body = draft.trim();
    if (body.length === 0) {
      return;
    }
    createComment.mutate(
      { body, ...(replyTo !== null ? { parentCommentId: replyTo } : {}) },
      {
        onSuccess: () => {
          setDraft('');
          setReplyTo(null);
        },
      },
    );
  }, [createComment, draft, replyTo]);

  if (review.isPending) {
    return (
      <Screen edges={['left', 'right', 'bottom']} style={{ paddingTop: 0, paddingBottom: 0 }}>
        <ScreenHeader
          title="Review"
          titleRole="title"
          onBack={() => {
            router.back();
          }}
        />
        <ContentListSkeleton />
      </Screen>
    );
  }

  const data = review.data;
  if (review.isError || data === undefined) {
    return (
      <Screen edges={['left', 'right', 'bottom']} style={{ paddingTop: 0, paddingBottom: 0 }}>
        <ScreenHeader
          title="Review"
          titleRole="title"
          onBack={() => {
            router.back();
          }}
        />
        <ContentErrorState
          isOffline={!isOnline}
          title="Could not load this review"
          onRetry={() => {
            void review.refetch();
          }}
        />
      </Screen>
    );
  }

  return (
    <Screen edges={['left', 'right', 'bottom']} style={{ paddingTop: 0, paddingBottom: 0 }}>
      <ScreenHeader
        title="Review"
        titleRole="title"
        onBack={() => {
          router.back();
        }}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scrollRef}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: theme.space('space.10') }}
        >
          <ReviewAuthorCard review={data} onPressAuthor={openUser} onPressGame={openGame} />

          <ReviewBody body={data.body} isSpoilerHidden={shouldHideSpoilerBody(data, viewerId)} />

          <View style={{ height: theme.space('space.5') }} />

          <ReviewActionBar
            replyCount={comments.total}
            linkCopied={linkCopied}
            onReply={() => {
              focusComposer(null);
            }}
            onQuote={() => {
              onQuote(data);
            }}
            onShare={() => {
              onShare(data);
            }}
            onCopyLink={() => {
              onCopyLink(data);
            }}
          />

          <View
            style={{
              paddingHorizontal: theme.space('space.4'),
              paddingTop: theme.space('space.5'),
              gap: theme.space('space.4'),
            }}
          >
            <Text role="title" accessibilityRole="header">
              {comments.total > 0 ? `Replies (${String(comments.total)})` : 'Replies'}
            </Text>

            {comments.isPending ? (
              <ContentListSkeleton rows={2} />
            ) : comments.threads.length === 0 ? (
              <EmptyState
                icon="message-circle"
                title="No replies yet"
                description="Say what you thought — the author is listening."
              />
            ) : (
              comments.threads.map((thread) => (
                <ReviewCommentThread
                  key={thread.comment.id}
                  thread={thread}
                  onReply={focusComposer}
                  onPressAuthor={openUser}
                />
              ))
            )}
          </View>

          {related.length > 0 ? (
            <View style={{ paddingTop: theme.space('space.8') }}>
              <Divider />
              <View
                style={{
                  paddingHorizontal: theme.space('space.4'),
                  paddingTop: theme.space('space.5'),
                  paddingBottom: theme.space('space.2'),
                }}
              >
                <Text role="title" accessibilityRole="header">
                  More reviews of this game
                </Text>
              </View>
              {related.map((item) => (
                <ReviewCard
                  key={item.id}
                  review={item}
                  onPress={openReview}
                  onPressGame={openGame}
                />
              ))}
            </View>
          ) : null}

          <View
            ref={composerRef}
            style={{
              paddingHorizontal: theme.space('space.4'),
              paddingTop: theme.space('space.6'),
              gap: theme.space('space.3'),
            }}
          >
            <TextField
              label={replyTo === null ? 'Add a reply' : 'Reply to comment'}
              placeholder="Share what you thought…"
              value={draft}
              onChangeText={setDraft}
              multiline
              accessibilityLabel={replyTo === null ? 'Add a reply' : 'Reply to comment'}
            />
            <View style={{ flexDirection: 'row', gap: theme.space('space.2') }}>
              <Button
                accessibilityLabel="Post reply"
                loading={createComment.isPending}
                disabled={draft.trim().length === 0}
                onPress={submitComment}
              >
                Post reply
              </Button>
              {replyTo !== null ? (
                <Button
                  variant="ghost"
                  accessibilityLabel="Cancel reply and comment on the review instead"
                  onPress={() => {
                    setReplyTo(null);
                  }}
                >
                  Cancel
                </Button>
              ) : null}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
