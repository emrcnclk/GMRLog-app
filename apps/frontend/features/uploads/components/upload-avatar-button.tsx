import type { UploadPurposeValue, UploadResponse } from '@gmrlog/types';
import { Button, Text, useTheme } from '@gmrlog/ui';
import { View } from 'react-native';

import { useUpload } from '../hooks/use-upload';

import { UploadProgressOverlay } from './upload-progress-overlay';

export interface UploadPurposeButtonProps {
  purpose: UploadPurposeValue;
  label: string;
  accessibilityLabel: string;
  helperText?: string;
  disabled?: boolean;
  onUploaded: (upload: UploadResponse) => void | Promise<void>;
  onError?: (message: string) => void;
}

export function UploadPurposeButton({
  purpose,
  label,
  accessibilityLabel,
  helperText,
  disabled = false,
  onUploaded,
  onError,
}: UploadPurposeButtonProps) {
  const theme = useTheme();
  const upload = useUpload();

  const showOverlay =
    upload.phase !== 'idle' &&
    (upload.isBusy || upload.phase === 'failure' || upload.phase === 'success');

  return (
    <View style={{ gap: theme.space('space.2') }}>
      <Text role="label" color="color.text.secondary">
        {label}
      </Text>
      {helperText ? (
        <Text role="caption" color="color.text.tertiary">
          {helperText}
        </Text>
      ) : null}
      <Button
        variant="secondary"
        accessibilityLabel={accessibilityLabel}
        disabled={disabled || upload.isBusy}
        loading={upload.isBusy}
        onPress={() => {
          void (async () => {
            const result = await upload.pickAndUpload(purpose);
            if (!result) {
              if (upload.phase === 'failure' && upload.error) {
                onError?.(upload.error);
              }
              return;
            }
            try {
              await onUploaded(result);
            } catch (error) {
              onError?.(error instanceof Error ? error.message : 'Could not apply upload');
            }
          })();
        }}
      >
        {label}
      </Button>
      <UploadProgressOverlay
        visible={showOverlay}
        phase={upload.phase}
        progress={upload.progress}
        error={upload.error}
        onRetry={() => {
          void (async () => {
            const result = await upload.retry();
            if (!result) {
              if (upload.error) {
                onError?.(upload.error);
              }
              return;
            }
            try {
              await onUploaded(result);
            } catch (error) {
              onError?.(error instanceof Error ? error.message : 'Could not apply upload');
            }
          })();
        }}
        onDismiss={() => {
          upload.reset();
        }}
      />
      {upload.uploadId && upload.phase === 'success' ? (
        <Text role="meta" color="color.text.tertiary">
          Confirmed upload id ready
        </Text>
      ) : null}
    </View>
  );
}

export interface UploadAvatarButtonProps {
  disabled?: boolean;
  onUploaded: (upload: UploadResponse) => void | Promise<void>;
  onError?: (message: string) => void;
}

export function UploadAvatarButton({ disabled, onUploaded, onError }: UploadAvatarButtonProps) {
  return (
    <UploadPurposeButton
      purpose="avatar"
      label="Upload avatar"
      accessibilityLabel="Upload avatar"
      helperText="Select an image · grant · upload · confirm."
      disabled={disabled}
      onUploaded={onUploaded}
      onError={onError}
    />
  );
}

export interface UploadBannerButtonProps {
  purpose?: Extract<UploadPurposeValue, 'banner' | 'community_banner' | 'post_media'>;
  label?: string;
  disabled?: boolean;
  onUploaded: (upload: UploadResponse) => void | Promise<void>;
  onError?: (message: string) => void;
}

export function UploadBannerButton({
  purpose = 'banner',
  label = 'Upload banner',
  disabled,
  onUploaded,
  onError,
}: UploadBannerButtonProps) {
  return (
    <UploadPurposeButton
      purpose={purpose}
      label={label}
      accessibilityLabel={label}
      helperText="Select an image · grant · upload · confirm."
      disabled={disabled}
      onUploaded={onUploaded}
      onError={onError}
    />
  );
}
