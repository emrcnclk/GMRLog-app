import { Text, useTheme } from '@gmrlog/ui';
import { ActivityIndicator, Pressable, View } from 'react-native';

import type { UploadUiPhase } from '../upload-types';

export interface UploadProgressOverlayProps {
  visible: boolean;
  phase: UploadUiPhase;
  progress: number;
  error?: string | null;
  onRetry?: () => void;
  onDismiss?: () => void;
}

function phaseLabel(phase: UploadUiPhase): string {
  switch (phase) {
    case 'picking':
      return 'Opening library…';
    case 'granting':
      return 'Requesting upload grant…';
    case 'uploading':
      return 'Uploading…';
    case 'confirming':
      return 'Confirming upload…';
    case 'success':
      return 'Upload confirmed';
    case 'failure':
      return 'Upload failed';
    default:
      return 'Working…';
  }
}

export function UploadProgressOverlay({
  visible,
  phase,
  progress,
  error,
  onRetry,
  onDismiss,
}: UploadProgressOverlayProps) {
  const theme = useTheme();

  if (!visible) {
    return null;
  }

  const busy =
    phase === 'picking' || phase === 'granting' || phase === 'uploading' || phase === 'confirming';
  const pct = Math.round(Math.min(1, Math.max(0, progress)) * 100);

  return (
    <View
      accessibilityLabel="Upload progress"
      style={{
        padding: theme.space('space.3'),
        borderRadius: theme.radius('radius.md'),
        backgroundColor: theme.color('color.surface.secondary'),
        gap: theme.space('space.2'),
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space('space.2') }}>
        {busy ? <ActivityIndicator color={theme.color('color.interactive.primary')} /> : null}
        <Text role="label" color="color.text.primary" style={{ flex: 1 }}>
          {phaseLabel(phase)}
        </Text>
        {busy ? (
          <Text role="meta" color="color.text.tertiary">
            {String(pct)}%
          </Text>
        ) : null}
      </View>

      {busy ? (
        <View
          style={{
            height: 4,
            borderRadius: theme.radius('radius.full'),
            backgroundColor: theme.color('color.border.default'),
            overflow: 'hidden',
            flexDirection: 'row',
          }}
        >
          <View
            style={{
              flex: Math.max(pct, 1),
              height: '100%',
              backgroundColor: theme.color('color.interactive.primary'),
            }}
          />
          <View style={{ flex: Math.max(100 - pct, 0) }} />
        </View>
      ) : null}

      {phase === 'failure' && error ? (
        <Text role="caption" color="color.text.secondary">
          {error}
        </Text>
      ) : null}

      {phase === 'failure' ? (
        <View style={{ flexDirection: 'row', gap: theme.space('space.3') }}>
          {onRetry ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Retry upload"
              onPress={onRetry}
            >
              <Text role="label" color="color.interactive.primary">
                Retry
              </Text>
            </Pressable>
          ) : null}
          {onDismiss ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Dismiss upload error"
              onPress={onDismiss}
            >
              <Text role="label" color="color.text.secondary">
                Dismiss
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {phase === 'success' && onDismiss ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss upload success"
          onPress={onDismiss}
        >
          <Text role="label" color="color.interactive.primary">
            Done
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
