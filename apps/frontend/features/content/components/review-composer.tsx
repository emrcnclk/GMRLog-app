import type { ReviewResponse } from '@gmrlog/types';
import { ErrorBanner, Screen, Text, TextField, useTheme } from '@gmrlog/ui';
import { reviewCreateSchema, reviewPatchSchema } from '@gmrlog/validators';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useWatch } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';

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

import { ComposerFooter } from './composer-footer';
import { ComposerHeader } from './composer-header';
import { ConfirmDialog } from './confirm-dialog';
import { RatingSelector } from './rating-selector';
import { SpoilerBadge } from './spoiler-badge';
import { VisibilitySelector } from './visibility-selector';

export interface ReviewComposerProps {
  mode: 'create' | 'edit';
  gameId: string;
  review?: ReviewResponse;
  onClose: () => void;
  onSaved?: (review: ReviewResponse) => void;
  onDeleted?: () => void;
}

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

  const defaults: ReviewComposerFormValues = useMemo(
    () => ({
      rating: review?.rating ?? 7,
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
  const canSave = isValid && !saving && !deleting && (mode === 'create' || dirty);

  const requestClose = () => {
    if (dirty && !saving) {
      setDiscardOpen(true);
      return;
    }
    onClose();
  };

  const onSubmit = handleSubmit(async (values: ReviewComposerFormValues) => {
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

  return (
    <Screen edges={[]} style={{ paddingTop: 0, paddingBottom: 0 }}>
      <ComposerHeader
        title={mode === 'create' ? 'Create Review' : 'Edit Review'}
        onClose={requestClose}
        closeLabel="Close"
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            padding: theme.space('space.4'),
            gap: theme.space('space.5'),
            paddingBottom: theme.space('space.8'),
          }}
        >
          {banner ? <ErrorBanner title={banner.title} description={banner.description} /> : null}

          <Controller
            control={control}
            name="rating"
            render={({ field: { value, onChange } }) => (
              <RatingSelector
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
              <View style={{ gap: theme.space('space.1') }}>
                <Text role="label" color="color.text.secondary">
                  Review
                </Text>
                <TextField
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  editable={!saving && !deleting}
                  multiline
                  numberOfLines={8}
                  textAlignVertical="top"
                  maxLength={REVIEW_BODY_MAX}
                  placeholder="Share your take…"
                  error={errors.body?.message}
                  style={{ minHeight: theme.space('space.24') }}
                  accessibilityLabel="Review text"
                  autoFocus
                />
              </View>
            )}
          />

          <Controller
            control={control}
            name="containsSpoilers"
            render={({ field: { value, onChange } }) => (
              <SpoilerBadge active={value} onChange={onChange} disabled={saving || deleting} />
            )}
          />

          <Controller
            control={control}
            name="visibility"
            render={({ field: { value, onChange } }) => (
              <VisibilitySelector value={value} onChange={onChange} disabled={saving || deleting} />
            )}
          />
        </ScrollView>

        <ComposerFooter
          onSave={() => {
            void onSubmit();
          }}
          saveLabel={mode === 'create' ? 'Publish' : 'Save'}
          disabled={!canSave}
          loading={saving}
          characterCount={bodyLength}
          characterMax={REVIEW_BODY_MAX}
          onDelete={
            mode === 'edit'
              ? () => {
                  setDeleteOpen(true);
                }
              : undefined
          }
          deleteLoading={deleting}
        />
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
