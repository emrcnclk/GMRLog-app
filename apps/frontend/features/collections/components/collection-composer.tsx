import type { CollectionResponse } from '@gmrlog/types';
import { Button, ErrorBanner, Screen, Text, TextField, useTheme } from '@gmrlog/ui';
import { collectionCreateSchema } from '@gmrlog/validators';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Controller, useWatch } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppForm } from '../../../src/forms/use-app-form';
import { useConnectivityStore } from '../../../src/state/stores';
import { isDirtyValues, mapBoardError } from '../../boards/shared/board-model';
import { VisibilitySelector } from '../../boards/shared/visibility-selector';
import { ConfirmDialog } from '../../content/components/confirm-dialog';
import {
  collectionComposerEditSchema,
  toCollectionPatchPayload,
  type CollectionComposerCreateValues,
  type CollectionComposerEditValues,
} from '../hooks/collection-model';
import { useCreateCollection, useUpdateCollection } from '../hooks/use-collections';

export interface CollectionComposerProps {
  mode: 'create' | 'edit';
  collection?: CollectionResponse;
  onClose: () => void;
  onSaved?: (collection: CollectionResponse) => void;
}

export function CollectionComposer({
  mode,
  collection,
  onClose,
  onSaved,
}: CollectionComposerProps) {
  if (mode === 'edit' && collection) {
    return <EditCollectionForm collection={collection} onClose={onClose} onSaved={onSaved} />;
  }
  return <CreateCollectionForm onClose={onClose} onSaved={onSaved} />;
}

function CreateCollectionForm({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved?: (collection: CollectionResponse) => void;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const isOnline = useConnectivityStore((s) => s.isOnline);
  const createMutation = useCreateCollection();
  const [banner, setBanner] = useState<{ title: string; description: string } | null>(null);

  const form = useAppForm(collectionCreateSchema, {
    defaultValues: { title: '', description: null, visibility: 'public' },
    mode: 'onChange',
  });
  const {
    control,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
  } = form;
  const saving = isSubmitting || createMutation.isPending;

  const onSubmit = handleSubmit(async (values: CollectionComposerCreateValues) => {
    setBanner(null);
    try {
      const created = await createMutation.mutateAsync(values);
      if (onSaved) {
        onSaved(created);
      } else {
        onClose();
      }
    } catch (error) {
      setBanner(mapBoardError(error, isOnline));
    }
  });

  return (
    <ComposerChrome
      title="Create Collection"
      onClose={onClose}
      banner={banner}
      footer={
        <Button
          variant="primary"
          accessibilityLabel="Create collection"
          disabled={!isValid || saving}
          loading={saving}
          onPress={() => {
            void onSubmit();
          }}
        >
          Create
        </Button>
      }
    >
      <Controller
        control={control}
        name="title"
        render={({ field: { value, onChange, onBlur } }) => (
          <TextField
            label="Title"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.title?.message}
            editable={!saving}
            autoFocus
            maxLength={100}
          />
        )}
      />
      <Controller
        control={control}
        name="description"
        render={({ field: { value, onChange, onBlur } }) => (
          <TextField
            label="Description"
            value={value ?? ''}
            onChangeText={(text) => {
              onChange(text.length === 0 ? null : text);
            }}
            onBlur={onBlur}
            error={errors.description?.message}
            editable={!saving}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            style={{ minHeight: theme.space('space.20') }}
          />
        )}
      />
      <Controller
        control={control}
        name="visibility"
        render={({ field: { value, onChange } }) => (
          <VisibilitySelector value={value ?? 'public'} onChange={onChange} disabled={saving} />
        )}
      />
      <View style={{ height: insets.bottom }} />
    </ComposerChrome>
  );
}

function EditCollectionForm({
  collection,
  onClose,
  onSaved,
}: {
  collection: CollectionResponse;
  onClose: () => void;
  onSaved?: (collection: CollectionResponse) => void;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const isOnline = useConnectivityStore((s) => s.isOnline);
  const updateMutation = useUpdateCollection(collection.id);
  const [banner, setBanner] = useState<{ title: string; description: string } | null>(null);
  const [discardOpen, setDiscardOpen] = useState(false);

  const defaults: CollectionComposerEditValues = useMemo(
    () => ({
      title: collection.title,
      description: collection.description ?? '',
      visibility: collection.visibility,
    }),
    [collection.title, collection.description, collection.visibility],
  );

  const form = useAppForm(collectionComposerEditSchema, {
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
      title: watched.title,
      description: watched.description,
      visibility: watched.visibility,
    },
    defaults,
  );

  useEffect(() => {
    reset(defaults);
  }, [defaults, reset]);

  const saving = isSubmitting || updateMutation.isPending;

  const requestClose = () => {
    if (dirty && !saving) {
      setDiscardOpen(true);
      return;
    }
    onClose();
  };

  const onSubmit = handleSubmit(async (values: CollectionComposerEditValues) => {
    setBanner(null);
    try {
      const updated = await updateMutation.mutateAsync(toCollectionPatchPayload(values));
      onSaved?.(updated);
      if (!onSaved) {
        onClose();
      }
    } catch (error) {
      setBanner(mapBoardError(error, isOnline));
    }
  });

  return (
    <>
      <ComposerChrome
        title="Edit Collection"
        onClose={requestClose}
        banner={banner}
        footer={
          <Button
            variant="primary"
            accessibilityLabel="Save collection"
            disabled={!isValid || !dirty || saving}
            loading={saving}
            onPress={() => {
              void onSubmit();
            }}
          >
            Save
          </Button>
        }
      >
        <Controller
          control={control}
          name="title"
          render={({ field: { value, onChange, onBlur } }) => (
            <TextField
              label="Title"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.title?.message}
              editable={!saving}
              autoFocus
              maxLength={100}
            />
          )}
        />
        <Controller
          control={control}
          name="description"
          render={({ field: { value, onChange, onBlur } }) => (
            <TextField
              label="Description"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.description?.message}
              editable={!saving}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              style={{ minHeight: theme.space('space.20') }}
            />
          )}
        />
        <Controller
          control={control}
          name="visibility"
          render={({ field: { value, onChange } }) => (
            <VisibilitySelector value={value} onChange={onChange} disabled={saving} />
          )}
        />
        <View style={{ height: insets.bottom }} />
      </ComposerChrome>
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
    </>
  );
}

function ComposerChrome({
  title,
  onClose,
  banner,
  children,
  footer,
}: {
  title: string;
  onClose: () => void;
  banner: { title: string; description: string } | null;
  children: ReactNode;
  footer: ReactNode;
}) {
  const theme = useTheme();
  return (
    <Screen edges={['top']} style={{ paddingTop: 0, paddingBottom: 0 }}>
      <View
        style={{
          borderBottomWidth: 1,
          borderBottomColor: theme.color('color.border.default'),
          minHeight: theme.space('space.12'),
          paddingHorizontal: theme.space('space.4'),
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.space('space.2'),
        }}
      >
        <Button variant="ghost" size="sm" accessibilityLabel="Close" onPress={onClose}>
          Close
        </Button>
        <Text role="heading" style={{ flex: 1 }} numberOfLines={1}>
          {title}
        </Text>
      </View>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            padding: theme.space('space.4'),
            gap: theme.space('space.4'),
          }}
        >
          {banner ? <ErrorBanner title={banner.title} description={banner.description} /> : null}
          {children}
          {footer}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
