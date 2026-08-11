import type { ReviewResponse } from '@gmrlog/types';
import { Button, Chip, ErrorBanner, Screen, Text, useTheme } from '@gmrlog/ui';
import { reviewCreateSchema, reviewPatchSchema } from '@gmrlog/validators';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useWatch } from 'react-hook-form';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  View,
  type NativeSyntheticEvent,
  type TextInputContentSizeChangeEventData,
} from 'react-native';

import { useAppForm } from '../../../src/forms/use-app-form';
import { useConnectivityStore } from '../../../src/state/stores';
import {
  isDirtyValues,
  normalizeReviewBody,
  REVIEW_BODY_MAX,
  reviewComposerFormSchema,
  type ReviewComposerFormValues,
} from '../hooks/content-model';
import { mapContentError } from '../hooks/map-content-error';
import { useCreateReview, useDeleteReview, useUpdateReview } from '../hooks/use-reviews';

import { ConfirmDialog } from './confirm-dialog';
import { ReviewAttachmentsRow } from './review-attachments-row';
import { ReviewComposerBar } from './review-composer-bar';
import { ReviewGameStrip } from './review-game-strip';
import { StarRating } from './star-rating';
import { VisibilitySelector } from './visibility-selector';

export interface ReviewComposerProps {
  mode: 'create' | 'edit';
  gameId: string;
  review?: ReviewResponse;
  onClose: () => void;
  onSaved?: (review: ReviewResponse) => void;
  onDeleted?: () => void;
}

const BODY_MIN_HEIGHT = 180;

export function ReviewComposer({
  mode,
  gameId,
  review,
  onClose,
  onSaved,
  onDeleted,
}: ReviewComposerProps) {
  const theme = useTheme();
  const isOnline = useConnectivityStore((s) => s.isOnline);
  const createMutation = useCreateReview();
  const updateMutation = useUpdateReview(review?.id ?? '');
  const deleteMutation = useDeleteReview();
  const [banner, setBanner] = useState<ReturnType<typeof mapContentError> | null>(null);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [bodyHeight, setBodyHeight] = useState(BODY_MIN_HEIGHT);
  // Not backed by ReviewCreateInput/ReviewPatchInput — no such fields exist on
  // the schema yet. Shown per §16, but local-only and never submitted, same
  // gap `post-composer.tsx` already flags for "Attach media".
  const [finishedIt, setFinishedIt] = useState(false);
  const [replay, setReplay] = useState(false);

  const defaults: ReviewComposerFormValues = useMemo(
    () => ({
      rating: review?.rating ?? null,
      body: review?.body ?? '',
      containsSpoilers: review?.containsSpoilers ?? false,
      visibility: review?.visibility ?? 'public',
    }),
    [review],
  );

  const form = useAppForm(reviewComposerFormSchema, {
    defaultValues: defaults,
    mode: 'onChange',
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isValid, isSubmitting },
  } = form;

  const watched = useWatch({ control });
  const dirty = isDirtyValues(
    {
      rating: watched.rating,
      body: watched.body,
      containsSpoilers: watched.containsSpoilers,
      visibility: watched.visibility,
    },
    defaults,
  );

  useEffect(() => {
    reset(defaults);
  }, [defaults, reset]);

  const saving = isSubmitting || createMutation.isPending || updateMutation.isPending;
  const deleting = deleteMutation.isPending;
  const ratingSet = watched.rating !== null && watched.rating !== undefined;
  const canSave = isValid && ratingSet && !saving && !deleting && (mode === 'create' || dirty);

  const requestClose = () => {
    if (dirty && !saving) {
      setDiscardOpen(true);
      return;
    }
    onClose();
  };

  const onSubmit = handleSubmit(async (values: ReviewComposerFormValues) => {
    if (values.rating === null) {
      return;
    }
    setBanner(null);
    const body = normalizeReviewBody(values.body);
    try {
      if (mode === 'create') {
        const payload = reviewCreateSchema.parse({
          gameId,
          rating: values.rating,
          body,
          containsSpoilers: values.containsSpoilers,
          visibility: values.visibility,
        });
        const created = await createMutation.mutateAsync(payload);
        onSaved?.(created);
        onClose();
        return;
      }
      const payload = reviewPatchSchema.parse({
        rating: values.rating,
        body,
        containsSpoilers: values.containsSpoilers,
        visibility: values.visibility,
      });
      const updated = await updateMutation.mutateAsync(payload);
      onSaved?.(updated);
      onClose();
    } catch (error) {
      setBanner(mapContentError(error, isOnline));
    }
  });

  const confirmDelete = async () => {
    if (!review) {
      return;
    }
    setBanner(null);
    try {
      await deleteMutation.mutateAsync({ id: review.id, gameId: review.gameId });
      setDeleteOpen(false);
      onDeleted?.();
      onClose();
    } catch (error) {
      setDeleteOpen(false);
      setBanner(mapContentError(error, isOnline));
    }
  };

  const bodyLength = typeof watched.body === 'string' ? watched.body.length : 0;
  const bodyType = theme.typography('body');

  return (
    <Screen edges={[]} style={{ paddingTop: 0, paddingBottom: 0 }}>
      <ReviewComposerBar
        onCancel={requestClose}
        publishLabel={mode === 'create' ? 'Publish' : 'Save'}
        onPublish={() => {
          void onSubmit();
        }}
        publishDisabled={!canSave}
        publishing={saving}
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            padding: theme.space('space.5'),
            gap: theme.space('space.5'),
            paddingBottom: theme.space('space.8'),
          }}
        >
          {banner ? <ErrorBanner title={banner.title} description={banner.description} /> : null}

          <ReviewGameStrip gameId={gameId} />

          <Controller
            control={control}
            name="rating"
            render={({ field: { value, onChange } }) => (
              <StarRating
                value={value}
                onChange={onChange}
                disabled={saving || deleting}
                error={errors.rating?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="body"
            render={({ field: { value, onChange, onBlur } }) => (
              <View style={{ gap: theme.space('space.2') }}>
                <TextInput
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  editable={!saving && !deleting}
                  multiline
                  textAlignVertical="top"
                  maxLength={REVIEW_BODY_MAX}
                  placeholder="What stayed with you?"
                  placeholderTextColor={theme.color('color.text.tertiary')}
                  onContentSizeChange={(
                    event: NativeSyntheticEvent<TextInputContentSizeChangeEventData>,
                  ) => {
                    setBodyHeight(Math.max(BODY_MIN_HEIGHT, event.nativeEvent.contentSize.height));
                  }}
                  accessibilityLabel="Review text"
                  autoFocus
                  style={{
                    color: theme.color('color.text.primary'),
                    fontSize: bodyType.fontSize,
                    lineHeight: bodyType.lineHeight,
                    fontWeight: bodyType.fontWeight,
                    letterSpacing: bodyType.letterSpacing,
                    ...(bodyType.fontFamily === undefined
                      ? null
                      : { fontFamily: bodyType.fontFamily }),
                    backgroundColor: 'transparent',
                    borderWidth: 0,
                    padding: 0,
                    minHeight: BODY_MIN_HEIGHT,
                    height: bodyHeight,
                  }}
                />
                {errors.body ? (
                  <Text role="caption" color="color.status.error">
                    {errors.body.message}
                  </Text>
                ) : null}
              </View>
            )}
          />

          <Text role="meta" color="color.text.tertiary">
            {bodyLength} / {REVIEW_BODY_MAX}
          </Text>

          <View style={{ gap: theme.space('space.2') }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space('space.2') }}>
              <Controller
                control={control}
                name="containsSpoilers"
                render={({ field: { value, onChange } }) => (
                  <Chip
                    selected={value}
                    disabled={saving || deleting}
                    accessibilityLabel="Contains spoilers"
                    onPress={() => {
                      onChange(!value);
                    }}
                  >
                    Contains spoilers
                  </Chip>
                )}
              />
              <Chip
                selected={finishedIt}
                disabled={saving || deleting}
                accessibilityLabel="Finished it"
                onPress={() => {
                  setFinishedIt((current) => !current);
                }}
              >
                Finished it
              </Chip>
              <Chip
                selected={replay}
                disabled={saving || deleting}
                accessibilityLabel="Replay"
                onPress={() => {
                  setReplay((current) => !current);
                }}
              >
                Replay
              </Chip>
            </View>
            <Text role="caption" color="color.text.tertiary">
              Finished it and Replay aren't saved with the review yet.
            </Text>
          </View>

          <ReviewAttachmentsRow />

          <Controller
            control={control}
            name="visibility"
            render={({ field: { value, onChange } }) => (
              <VisibilitySelector value={value} onChange={onChange} disabled={saving || deleting} />
            )}
          />

          {mode === 'edit' ? (
            <Button
              variant="danger"
              size="sm"
              accessibilityLabel="Delete review"
              loading={deleting}
              disabled={saving}
              onPress={() => {
                setDeleteOpen(true);
              }}
            >
              Delete review
            </Button>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>

      <ConfirmDialog
        visible={discardOpen}
        title="Discard changes?"
        description="You have unsaved edits. Close without saving?"
        confirmLabel="Discard"
        danger
        onCancel={() => {
          setDiscardOpen(false);
        }}
        onConfirm={() => {
          setDiscardOpen(false);
          onClose();
        }}
      />

      <ConfirmDialog
        visible={deleteOpen}
        title="Delete review?"
        description="This removes your review from the game. You can write a new one later."
        confirmLabel="Delete"
        danger
        loading={deleting}
        onCancel={() => {
          setDeleteOpen(false);
        }}
        onConfirm={() => {
          void confirmDelete();
        }}
      />
    </Screen>
  );
}
