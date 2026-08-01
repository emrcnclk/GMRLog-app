import type { LibraryEntryResponse, PostResponse } from '@gmrlog/types';
import { ErrorBanner, Screen, Text, TextField, useTheme } from '@gmrlog/ui';
import { postCreateSchema, postPatchSchema } from '@gmrlog/validators';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useWatch } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';

import { useAppForm } from '../../../src/forms/use-app-form';
import { useConnectivityStore } from '../../../src/state/stores';
import { useLibrary } from '../../profile/hooks/use-library';
import {
  buildPollOptions,
  isDirtyValues,
  normalizePostGameId,
  POST_BODY_MAX,
  postComposerFormSchema,
  type PostComposerFormValues,
} from '../hooks/content-model';
import { mapContentError } from '../hooks/map-content-error';
import { useCreatePost, useDeletePost, useUpdatePost } from '../hooks/use-posts';

import { ComposerFooter } from './composer-footer';
import { ComposerHeader } from './composer-header';
import { ConfirmDialog } from './confirm-dialog';
import { VisibilitySelector } from './visibility-selector';

export interface PostComposerProps {
  mode: 'create' | 'edit';
  initialGameId?: string | null;
  post?: PostResponse;
  onClose: () => void;
  onSaved?: (post: PostResponse) => void;
  onDeleted?: () => void;
}

export function PostComposer({
  mode,
  initialGameId = null,
  post,
  onClose,
  onSaved,
  onDeleted,
}: PostComposerProps) {
  const theme = useTheme();
  const isOnline = useConnectivityStore((s) => s.isOnline);
  const library = useLibrary();
  const createMutation = useCreatePost();
  const updateMutation = useUpdatePost(post?.id ?? '');
  const deleteMutation = useDeletePost();
  const [banner, setBanner] = useState<ReturnType<typeof mapContentError> | null>(null);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const defaults: PostComposerFormValues = useMemo(
    () => ({
      body: post?.body ?? '',
      visibility: post?.visibility ?? 'public',
      gameId: post?.gameId ?? initialGameId ?? '',
      includePoll: post?.postKind === 'poll',
      pollQuestion: post?.poll?.question ?? '',
      pollOptionA: post?.poll?.options[0]?.label ?? '',
      pollOptionB: post?.poll?.options[1]?.label ?? '',
      pollOptionC: post?.poll?.options[2]?.label ?? '',
      pollOptionD: post?.poll?.options[3]?.label ?? '',
    }),
    [post, initialGameId],
  );

  const form = useAppForm(postComposerFormSchema, {
    defaultValues: defaults,
    mode: 'onChange',
  });

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isValid, isSubmitting },
  } = form;

  const watched = useWatch({ control });
  const dirty = isDirtyValues(
    {
      body: watched.body,
      visibility: watched.visibility,
      gameId: watched.gameId,
      includePoll: watched.includePoll,
      pollQuestion: watched.pollQuestion,
      pollOptionA: watched.pollOptionA,
      pollOptionB: watched.pollOptionB,
      pollOptionC: watched.pollOptionC,
      pollOptionD: watched.pollOptionD,
    },
    defaults,
  );

  useEffect(() => {
    reset(defaults);
  }, [defaults, reset]);

  const saving = isSubmitting || createMutation.isPending || updateMutation.isPending;
  const deleting = deleteMutation.isPending;
  const canSave = isValid && !saving && !deleting && (mode === 'create' || dirty);

  const selectedGameId = typeof watched.gameId === 'string' ? watched.gameId : '';
  const selectedEntry = findLibraryEntry(
    library.sections.flatMap((s) => s.entries),
    selectedGameId,
  );
  const selectedTitle =
    post?.game?.title ?? selectedEntry?.game.title ?? (selectedGameId ? 'Linked game' : null);

  const requestClose = () => {
    if (dirty && !saving) {
      setDiscardOpen(true);
      return;
    }
    onClose();
  };

  const onSubmit = handleSubmit(async (values: PostComposerFormValues) => {
    setBanner(null);
    const gameId = normalizePostGameId(values.gameId);
    try {
      if (mode === 'create') {
        const pollOptions = watched.includePoll
          ? buildPollOptions(watched as PostComposerFormValues)
          : [];
        const payload = postCreateSchema.parse({
          body: values.body,
          visibility: values.visibility,
          ...(gameId !== undefined ? { gameId } : {}),
          ...(watched.includePoll
            ? {
                postKind: 'poll' as const,
                poll: {
                  question: watched.pollQuestion,
                  options: pollOptions,
                },
              }
            : {}),
        });
        const created = await createMutation.mutateAsync(payload);
        onSaved?.(created);
        onClose();
        return;
      }
      const payload = postPatchSchema.parse({
        body: values.body,
        visibility: values.visibility,
        gameId: gameId ?? null,
      });
      const updated = await updateMutation.mutateAsync(payload);
      onSaved?.(updated);
      onClose();
    } catch (error) {
      setBanner(mapContentError(error, isOnline));
    }
  });

  const confirmDelete = async () => {
    if (!post) {
      return;
    }
    setBanner(null);
    try {
      await deleteMutation.mutateAsync({ id: post.id, gameId: post.gameId });
      setDeleteOpen(false);
      onDeleted?.();
      onClose();
    } catch (error) {
      setDeleteOpen(false);
      setBanner(mapContentError(error, isOnline));
    }
  };

  const bodyLength = typeof watched.body === 'string' ? watched.body.length : 0;
  const libraryEntries = library.sections.flatMap((section) => section.entries);

  return (
    <Screen edges={[]} style={{ paddingTop: 0, paddingBottom: 0 }}>
      <ComposerHeader
        title={mode === 'create' ? 'Create Post' : 'Edit Post'}
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
            name="body"
            render={({ field: { value, onChange, onBlur } }) => (
              <View style={{ gap: theme.space('space.1') }}>
                <Text role="label" color="color.text.secondary">
                  Post
                </Text>
                <TextField
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  editable={!saving && !deleting}
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                  maxLength={POST_BODY_MAX}
                  placeholder="What’s on your mind…"
                  error={errors.body?.message}
                  style={{ minHeight: theme.space('space.20') }}
                  accessibilityLabel="Post text"
                  autoFocus
                />
              </View>
            )}
          />

          <Controller
            control={control}
            name="visibility"
            render={({ field: { value, onChange } }) => (
              <VisibilitySelector value={value} onChange={onChange} disabled={saving || deleting} />
            )}
          />

          <Controller
            control={control}
            name="includePoll"
            render={({ field: { value, onChange } }) => (
              <Pressable
                accessibilityRole="switch"
                accessibilityState={{ checked: value }}
                accessibilityLabel="Attach poll"
                disabled={saving || deleting || mode === 'edit'}
                onPress={() => {
                  onChange(!value);
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  minHeight: theme.space('space.12'),
                  paddingHorizontal: theme.space('space.3'),
                  borderRadius: theme.radius('radius.md'),
                  borderWidth: 1,
                  borderColor: theme.color('color.border.default'),
                  opacity: mode === 'edit' ? 0.5 : 1,
                }}
              >
                <Text role="label" color="color.text.primary">
                  Attach poll
                </Text>
                <Text role="meta" color="color.text.secondary">
                  {value ? 'On' : 'Off'}
                </Text>
              </Pressable>
            )}
          />

          {watched.includePoll && mode === 'create' ? (
            <View style={{ gap: theme.space('space.3') }}>
              <Controller
                control={control}
                name="pollQuestion"
                render={({ field: { value, onChange, onBlur } }) => (
                  <View style={{ gap: theme.space('space.1') }}>
                    <Text role="label" color="color.text.secondary">
                      Poll question
                    </Text>
                    <TextField
                      value={value}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      editable={!saving && !deleting}
                      maxLength={280}
                      placeholder="Ask the community…"
                      accessibilityLabel="Poll question"
                    />
                  </View>
                )}
              />
              {(['pollOptionA', 'pollOptionB', 'pollOptionC', 'pollOptionD'] as const).map(
                (fieldName, index) => (
                  <Controller
                    key={fieldName}
                    control={control}
                    name={fieldName}
                    render={({ field: { value, onChange, onBlur } }) => (
                      <View style={{ gap: theme.space('space.1') }}>
                        <Text role="label" color="color.text.secondary">
                          Option {index + 1}
                          {index < 2 ? ' (required)' : ' (optional)'}
                        </Text>
                        <TextField
                          value={value}
                          onBlur={onBlur}
                          onChangeText={onChange}
                          editable={!saving && !deleting}
                          maxLength={100}
                          placeholder={`Option ${String(index + 1)}`}
                          accessibilityLabel={`Poll option ${String(index + 1)}`}
                        />
                      </View>
                    )}
                  />
                ),
              )}
            </View>
          ) : null}

          <View style={{ gap: theme.space('space.2') }}>
            <Text role="label" color="color.text.secondary">
              Game (optional)
            </Text>
            {selectedTitle ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: theme.space('space.2'),
                  minHeight: theme.space('space.12'),
                  paddingHorizontal: theme.space('space.3'),
                  borderRadius: theme.radius('radius.md'),
                  backgroundColor: theme.color('color.surface.secondary'),
                }}
              >
                <Text role="body" color="color.text.primary" style={{ flex: 1 }} numberOfLines={1}>
                  {selectedTitle}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Clear linked game"
                  disabled={saving || deleting}
                  onPress={() => {
                    setValue('gameId', '', { shouldDirty: true, shouldValidate: true });
                  }}
                  hitSlop={8}
                >
                  <Text role="label" color="color.interactive.primary">
                    Clear
                  </Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Choose game from library"
                disabled={saving || deleting}
                onPress={() => {
                  setPickerOpen((open) => !open);
                }}
                style={{
                  minHeight: theme.space('space.12'),
                  justifyContent: 'center',
                  paddingHorizontal: theme.space('space.3'),
                  borderRadius: theme.radius('radius.md'),
                  borderWidth: 1,
                  borderColor: theme.color('color.border.default'),
                }}
              >
                <Text role="body" color="color.text.secondary">
                  {pickerOpen ? 'Hide library' : 'Choose from your library'}
                </Text>
              </Pressable>
            )}

            {pickerOpen && !selectedTitle ? (
              <View style={{ gap: theme.space('space.1') }}>
                {library.status === 'loading' ? (
                  <Text role="meta" color="color.text.tertiary">
                    Loading library…
                  </Text>
                ) : null}
                {library.status === 'empty' ? (
                  <Text role="meta" color="color.text.tertiary">
                    Your library is empty. Add games first, or publish without a link.
                  </Text>
                ) : null}
                {libraryEntries.map((entry) => (
                  <Pressable
                    key={entry.gameId}
                    accessibilityRole="button"
                    accessibilityLabel={`Link ${entry.game.title}`}
                    onPress={() => {
                      setValue('gameId', entry.gameId, {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                      setPickerOpen(false);
                    }}
                    style={{
                      minHeight: theme.space('space.12'),
                      justifyContent: 'center',
                      paddingHorizontal: theme.space('space.3'),
                      borderBottomWidth: 1,
                      borderBottomColor: theme.color('color.border.default'),
                    }}
                  >
                    <Text role="body" color="color.text.primary" numberOfLines={1}>
                      {entry.game.title}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>

          <View
            accessibilityLabel="Media attachment unavailable"
            style={{
              gap: theme.space('space.1'),
              padding: theme.space('space.3'),
              borderRadius: theme.radius('radius.md'),
              backgroundColor: theme.color('color.surface.secondary'),
            }}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: true }}
              disabled
              style={{
                minHeight: theme.space('space.12'),
                justifyContent: 'center',
                opacity: 0.5,
              }}
            >
              <Text role="label" color="color.text.secondary">
                Attach media
              </Text>
            </Pressable>
            <Text role="caption" color="color.text.tertiary">
              Media uploads are not available yet. Text posts publish without attachments.
            </Text>
          </View>
        </ScrollView>

        <ComposerFooter
          onSave={() => {
            void onSubmit();
          }}
          saveLabel={mode === 'create' ? 'Publish' : 'Save'}
          disabled={!canSave}
          loading={saving}
          characterCount={bodyLength}
          characterMax={POST_BODY_MAX}
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
        title="Delete post?"
        description="This removes your post. This cannot be undone from the app."
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

function findLibraryEntry(
  entries: LibraryEntryResponse[],
  gameId: string,
): LibraryEntryResponse | undefined {
  if (gameId.length === 0) {
    return undefined;
  }
  return entries.find((entry) => entry.gameId === gameId);
}
