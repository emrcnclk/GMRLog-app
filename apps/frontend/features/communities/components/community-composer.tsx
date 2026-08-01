import type { CommunityResponse } from '@gmrlog/types';
import { Button, ErrorBanner, Screen, Text, TextField, useTheme } from '@gmrlog/ui';
import { communityCreateSchema } from '@gmrlog/validators';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Controller, useWatch } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { mapAuthError } from '../../../src/auth/map-auth-error';
import { useAppForm } from '../../../src/forms/use-app-form';
import { queryKeys } from '../../../src/query/query-client';
import { useConnectivityStore } from '../../../src/state/stores';
import { ConfirmDialog } from '../../content/components/confirm-dialog';
import { VisibilitySelector } from '../../content/components/visibility-selector';
import { UploadBannerButton } from '../../uploads';
import {
  communityComposerEditSchema,
  isDirtyValues,
  toCommunityPatchPayload,
  type CommunityComposerCreateValues,
  type CommunityComposerEditValues,
} from '../hooks/community-model';
import { useCreateCommunity, useUpdateCommunity } from '../hooks/use-communities';

import { VisibilityBadge } from './visibility-badge';

export interface CommunityComposerProps {
  mode: 'create' | 'edit';
  community?: CommunityResponse;
  onClose: () => void;
  onSaved?: (community: CommunityResponse) => void;
}

export function CommunityComposer({ mode, community, onClose, onSaved }: CommunityComposerProps) {
  if (mode === 'edit' && community) {
    return <EditCommunityForm community={community} onClose={onClose} onSaved={onSaved} />;
  }
  return <CreateCommunityForm onClose={onClose} onSaved={onSaved} />;
}

function CommunityBannerUpload({
  communityId,
  disabled,
  onError,
}: {
  communityId?: string;
  disabled?: boolean;
  onError: (message: string) => void;
}) {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [confirmedId, setConfirmedId] = useState<string | null>(null);

  return (
    <View style={{ gap: theme.space('space.2') }}>
      <UploadBannerButton
        purpose="community_banner"
        label="Upload community banner"
        disabled={disabled}
        onUploaded={async (upload) => {
          setConfirmedId(upload.id);
          if (communityId) {
            await queryClient.invalidateQueries({
              queryKey: queryKeys.communities.detail(communityId),
            });
          }
          await queryClient.invalidateQueries({ queryKey: queryKeys.communities.list() });
        }}
        onError={onError}
      />
      <Text role="caption" color="color.text.tertiary">
        Community create/patch schemas have no bannerUploadId — confirmed id is held locally only.
        {confirmedId ? ` Confirmed: ${confirmedId}` : ''}
      </Text>
    </View>
  );
}

function CreateCommunityForm({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved?: (community: CommunityResponse) => void;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const isOnline = useConnectivityStore((s) => s.isOnline);
  const createMutation = useCreateCommunity();
  const [banner, setBanner] = useState<{ title: string; description: string } | null>(null);

  const form = useAppForm(communityCreateSchema, {
    defaultValues: {
      name: '',
      slug: '',
      description: null,
      visibility: 'public',
    },
    mode: 'onChange',
  });

  const {
    control,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
  } = form;
  const visibility = useWatch({ control, name: 'visibility' });
  const saving = isSubmitting || createMutation.isPending;

  const onSubmit = handleSubmit(async (values: CommunityComposerCreateValues) => {
    setBanner(null);
    try {
      const created = await createMutation.mutateAsync(values);
      if (onSaved) {
        onSaved(created);
      } else {
        onClose();
      }
    } catch (error) {
      const mapped = mapAuthError(error, isOnline);
      setBanner({ title: mapped.title, description: mapped.description });
    }
  });

  return (
    <ComposerChrome
      title="Create Community"
      onClose={onClose}
      banner={banner}
      footer={
        <Button
          variant="primary"
          accessibilityLabel="Create community"
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
        name="name"
        render={({ field: { value, onChange, onBlur } }) => (
          <TextField
            label="Name"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.name?.message}
            editable={!saving}
            autoFocus
            maxLength={80}
          />
        )}
      />
      <Controller
        control={control}
        name="slug"
        render={({ field: { value, onChange, onBlur } }) => (
          <TextField
            label="Slug"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.slug?.message}
            editable={!saving}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={64}
            placeholder="culture-room"
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
          <View style={{ gap: theme.space('space.2') }}>
            <VisibilitySelector value={value} onChange={onChange} disabled={saving} />
            <VisibilityBadge visibility={visibility} />
          </View>
        )}
      />
      <CommunityBannerUpload
        disabled={saving}
        onError={(message) => {
          const mapped = mapAuthError(new Error(message), isOnline);
          setBanner({ title: mapped.title, description: mapped.description });
        }}
      />
      <View style={{ height: insets.bottom }} />
    </ComposerChrome>
  );
}

function EditCommunityForm({
  community,
  onClose,
  onSaved,
}: {
  community: CommunityResponse;
  onClose: () => void;
  onSaved?: (community: CommunityResponse) => void;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const isOnline = useConnectivityStore((s) => s.isOnline);
  const updateMutation = useUpdateCommunity(community.id);
  const [banner, setBanner] = useState<{ title: string; description: string } | null>(null);
  const [discardOpen, setDiscardOpen] = useState(false);

  const defaults: CommunityComposerEditValues = useMemo(
    () => ({
      name: community.name,
      description: community.description ?? '',
      visibility: 'public',
    }),
    [community.name, community.description],
  );

  const form = useAppForm(communityComposerEditSchema, {
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
      name: watched.name,
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

  const onSubmit = handleSubmit(async (values: CommunityComposerEditValues) => {
    setBanner(null);
    try {
      const updated = await updateMutation.mutateAsync(toCommunityPatchPayload(values));
      onSaved?.(updated);
      if (!onSaved) {
        onClose();
      }
    } catch (error) {
      const mapped = mapAuthError(error, isOnline);
      setBanner({ title: mapped.title, description: mapped.description });
    }
  });

  return (
    <>
      <ComposerChrome
        title="Edit Community"
        onClose={requestClose}
        banner={banner}
        footer={
          <Button
            variant="primary"
            accessibilityLabel="Save community"
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
        <Text role="caption" color="color.text.tertiary">
          Visibility is not projected on CommunityResponse — choose a value to update.
        </Text>
        <Controller
          control={control}
          name="name"
          render={({ field: { value, onChange, onBlur } }) => (
            <TextField
              label="Name"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.name?.message}
              editable={!saving}
              autoFocus
              maxLength={80}
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
        <CommunityBannerUpload
          communityId={community.id}
          disabled={saving}
          onError={(message) => {
            const mapped = mapAuthError(new Error(message), isOnline);
            setBanner({ title: mapped.title, description: mapped.description });
          }}
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
