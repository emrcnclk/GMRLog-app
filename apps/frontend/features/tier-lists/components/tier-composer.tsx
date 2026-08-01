import type { TierListResponse } from '@gmrlog/types';
import { Button, ErrorBanner, Screen, Text, TextField, useTheme } from '@gmrlog/ui';
import { tierListCreateSchema } from '@gmrlog/validators';
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
  tierComposerEditSchema,
  toTierListPatchPayload,
  type TierComposerCreateValues,
  type TierComposerEditValues,
} from '../hooks/tier-list-model';
import { useCreateTierList, useUpdateTierList } from '../hooks/use-tier-lists';

export interface TierComposerProps {
  mode: 'create' | 'edit';
  tierList?: TierListResponse;
  onClose: () => void;
  onSaved?: (tierList: TierListResponse) => void;
}

export function TierComposer({ mode, tierList, onClose, onSaved }: TierComposerProps) {
  if (mode === 'edit' && tierList) {
    return <EditTierForm tierList={tierList} onClose={onClose} onSaved={onSaved} />;
  }
  return <CreateTierForm onClose={onClose} onSaved={onSaved} />;
}

function CreateTierForm({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved?: (tierList: TierListResponse) => void;
}) {
  const insets = useSafeAreaInsets();
  const isOnline = useConnectivityStore((s) => s.isOnline);
  const createMutation = useCreateTierList();
  const [banner, setBanner] = useState<{ title: string; description: string } | null>(null);
  const form = useAppForm(tierListCreateSchema, {
    defaultValues: { title: '', visibility: 'public' },
    mode: 'onChange',
  });
  const {
    control,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
  } = form;
  const saving = isSubmitting || createMutation.isPending;

  const onSubmit = handleSubmit(async (values: TierComposerCreateValues) => {
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
    <Chrome
      title="Create Tier List"
      onClose={onClose}
      banner={banner}
      footer={
        <Button
          variant="primary"
          accessibilityLabel="Create tier list"
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
        name="visibility"
        render={({ field: { value, onChange } }) => (
          <VisibilitySelector value={value ?? 'public'} onChange={onChange} disabled={saving} />
        )}
      />
      <View style={{ height: insets.bottom }} />
    </Chrome>
  );
}

function EditTierForm({
  tierList,
  onClose,
  onSaved,
}: {
  tierList: TierListResponse;
  onClose: () => void;
  onSaved?: (tierList: TierListResponse) => void;
}) {
  const insets = useSafeAreaInsets();
  const isOnline = useConnectivityStore((s) => s.isOnline);
  const updateMutation = useUpdateTierList(tierList.id);
  const [banner, setBanner] = useState<{ title: string; description: string } | null>(null);
  const [discardOpen, setDiscardOpen] = useState(false);
  const defaults: TierComposerEditValues = useMemo(
    () => ({ title: tierList.title, visibility: tierList.visibility }),
    [tierList.title, tierList.visibility],
  );
  const form = useAppForm(tierComposerEditSchema, { defaultValues: defaults, mode: 'onChange' });
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isValid, isSubmitting },
  } = form;
  const watched = useWatch({ control });
  const dirty = isDirtyValues({ title: watched.title, visibility: watched.visibility }, defaults);
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

  const onSubmit = handleSubmit(async (values: TierComposerEditValues) => {
    setBanner(null);
    try {
      const updated = await updateMutation.mutateAsync(toTierListPatchPayload(values));
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
      <Chrome
        title="Edit Tier List"
        onClose={requestClose}
        banner={banner}
        footer={
          <Button
            variant="primary"
            accessibilityLabel="Save tier list"
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
          name="visibility"
          render={({ field: { value, onChange } }) => (
            <VisibilitySelector value={value} onChange={onChange} disabled={saving} />
          )}
        />
        <View style={{ height: insets.bottom }} />
      </Chrome>
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

function Chrome({
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
