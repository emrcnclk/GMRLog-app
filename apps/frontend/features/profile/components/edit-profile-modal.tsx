import type { UploadResponse, UserSelfResponse } from '@gmrlog/types';
import { Button, Dialog, ErrorBanner, TextField, useTheme } from '@gmrlog/ui';
import { mePatchSchema } from '@gmrlog/validators';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Controller } from 'react-hook-form';
import { View } from 'react-native';

import { mapAuthError, type AuthUiError } from '../../../src/auth/map-auth-error';
import { useAppForm } from '../../../src/forms/use-app-form';
import { queryKeys } from '../../../src/query/query-client';
import { useConnectivityStore } from '../../../src/state/stores';
import { UploadAvatarButton, UploadBannerButton } from '../../uploads';
import { editProfileFormSchema, type EditProfileFormValues } from '../hooks/edit-profile-form';
import { useEditProfile } from '../hooks/use-profile';

export type { EditProfileFormValues } from '../hooks/edit-profile-form';
export { editProfileFormSchema } from '../hooks/edit-profile-form';

export interface EditProfileModalProps {
  visible: boolean;
  user: UserSelfResponse;
  onClose: () => void;
}

export function EditProfileModal({ visible, user, onClose }: EditProfileModalProps) {
  const theme = useTheme();
  const isOnline = useConnectivityStore((s) => s.isOnline);
  const mutation = useEditProfile();
  const queryClient = useQueryClient();
  const [banner, setBanner] = useState<AuthUiError | null>(null);
  const [avatarUploadId, setAvatarUploadId] = useState<string | null>(null);
  const [bannerUploadId, setBannerUploadId] = useState<string | null>(null);

  const form = useAppForm(editProfileFormSchema, {
    defaultValues: {
      displayName: user.displayName,
      bio: user.bio ?? '',
    },
    mode: 'onChange',
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isValid, isSubmitting },
  } = form;

  useEffect(() => {
    if (visible) {
      reset({
        displayName: user.displayName,
        bio: user.bio ?? '',
      });
      setBanner(null);
      setAvatarUploadId(null);
      setBannerUploadId(null);
    }
  }, [visible, user.displayName, user.bio, reset]);

  const disabled = isSubmitting || mutation.isPending || !isValid;

  const applyUploadToMe = async (
    field: 'avatarUploadId' | 'bannerUploadId',
    upload: UploadResponse,
  ) => {
    setBanner(null);
    try {
      await mutation.mutateAsync(
        mePatchSchema.parse({
          [field]: upload.id,
        }),
      );
      await queryClient.invalidateQueries({ queryKey: queryKeys.me });
      if (field === 'avatarUploadId') {
        setAvatarUploadId(upload.id);
      } else {
        setBannerUploadId(upload.id);
      }
    } catch (error) {
      setBanner(mapAuthError(error, isOnline));
      throw error;
    }
  };

  const onSubmit = handleSubmit(async (values: EditProfileFormValues) => {
    setBanner(null);
    const payload = mePatchSchema.parse({
      displayName: values.displayName,
      bio: values.bio.trim().length === 0 ? null : values.bio,
      ...(avatarUploadId ? { avatarUploadId } : {}),
      ...(bannerUploadId ? { bannerUploadId } : {}),
    });
    try {
      await mutation.mutateAsync(payload);
      await queryClient.invalidateQueries({ queryKey: queryKeys.me });
      onClose();
    } catch (error) {
      setBanner(mapAuthError(error, isOnline));
    }
  });

  return (
    <Dialog
      visible={visible}
      title="Edit Profile"
      onClose={onClose}
      actions={
        <>
          <Button variant="ghost" accessibilityLabel="Cancel edit profile" onPress={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            accessibilityLabel="Save profile"
            disabled={disabled}
            onPress={() => {
              void onSubmit();
            }}
          >
            Save
          </Button>
        </>
      }
    >
      <View style={{ gap: theme.space('space.4') }}>
        {banner ? <ErrorBanner title={banner.title} description={banner.description} /> : null}

        <Controller
          control={control}
          name="displayName"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextField
              label="Display name"
              value={value}
              onBlur={onBlur}
              onChangeText={onChange}
              error={errors.displayName?.message}
              editable={!mutation.isPending}
              maxLength={40}
              autoCapitalize="words"
              returnKeyType="next"
            />
          )}
        />

        <Controller
          control={control}
          name="bio"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextField
              label="Bio"
              value={value}
              onBlur={onBlur}
              onChangeText={onChange}
              error={errors.bio?.message}
              editable={!mutation.isPending}
              maxLength={500}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              style={{ minHeight: theme.space('space.20') }}
            />
          )}
        />

        <UploadAvatarButton
          disabled={mutation.isPending}
          onUploaded={async (upload) => {
            await applyUploadToMe('avatarUploadId', upload);
          }}
          onError={(message) => {
            setBanner(mapAuthError(new Error(message), isOnline));
          }}
        />

        <UploadBannerButton
          purpose="banner"
          disabled={mutation.isPending}
          onUploaded={async (upload) => {
            await applyUploadToMe('bannerUploadId', upload);
          }}
          onError={(message) => {
            setBanner(mapAuthError(new Error(message), isOnline));
          }}
        />
      </View>
    </Dialog>
  );
}
