import { Button, Text, TextField, useTheme } from '@gmrlog/ui';
import { messageCreateSchema } from '@gmrlog/validators';
import { useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MESSAGE_BODY_MAX } from '../hooks/messaging-model';

export interface MessageComposerProps {
  disabled?: boolean;
  sending?: boolean;
  onSend: (body: string) => Promise<void> | void;
  error?: string | null;
}

export function MessageComposer({
  disabled = false,
  sending = false,
  onSend,
  error = null,
}: MessageComposerProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [body, setBody] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const trimmed = body.trim();
  const canSend = trimmed.length > 0 && !disabled && !sending;

  const submit = async () => {
    setLocalError(null);
    const parsed = messageCreateSchema.safeParse({ body: trimmed });
    if (!parsed.success) {
      setLocalError(parsed.error.issues[0]?.message ?? 'Invalid message');
      return;
    }
    try {
      await onSend(parsed.data.body);
      setBody('');
    } catch {
      // Parent surfaces transport errors.
    }
  };

  return (
    <View
      style={{
        borderTopWidth: 1,
        borderTopColor: theme.color('color.border.default'),
        paddingHorizontal: theme.space('space.4'),
        paddingTop: theme.space('space.3'),
        paddingBottom: insets.bottom + theme.space('space.3'),
        gap: theme.space('space.2'),
        backgroundColor: theme.color('color.background.primary'),
      }}
    >
      <TextField
        value={body}
        onChangeText={setBody}
        editable={!disabled && !sending}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
        maxLength={MESSAGE_BODY_MAX}
        placeholder="Write a message…"
        accessibilityLabel="Message body"
        autoFocus={false}
        style={{ minHeight: theme.space('space.16') }}
        error={localError ?? error ?? undefined}
      />
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: theme.space('space.3'),
        }}
      >
        <Text role="caption" color="color.text.tertiary">
          {String(body.length)} / {String(MESSAGE_BODY_MAX)}
        </Text>
        <Button
          variant="primary"
          accessibilityLabel="Send message"
          disabled={!canSend}
          loading={sending}
          onPress={() => {
            void submit();
          }}
        >
          Send
        </Button>
      </View>
    </View>
  );
}
