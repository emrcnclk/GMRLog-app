import { Button, Dialog, ErrorBanner, Text, TextField, useTheme } from '@gmrlog/ui';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { useSetPassword } from '../hooks/use-set-password';

export interface SetPasswordDialogProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * Task 4.7's escape hatch (OAUTH.md §5). Submits password-only first — the
 * backend (`SessionsService.setPassword`) already has an email on file for
 * most oauth-only accounts (the verified-email claim placeholder 4.2
 * plants). The email field only appears once the server says it's actually
 * needed (an unverified-email OAuth signup that never got one), rather than
 * asking every caller for information most of them don't need to supply.
 */
export function SetPasswordDialog({ visible, onClose }: SetPasswordDialogProps) {
  const theme = useTheme();
  const { submit, busy, error, clearError } = useSetPassword();
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [needsEmail, setNeedsEmail] = useState(false);

  useEffect(() => {
    if (error?.title === 'Email required') {
      setNeedsEmail(true);
    }
  }, [error]);

  const reset = () => {
    setPassword('');
    setEmail('');
    setNeedsEmail(false);
    clearError();
  };

  return (
    <Dialog
      visible={visible}
      title="Set a password"
      onClose={() => {
        reset();
        onClose();
      }}
      actions={
        <>
          <Button
            variant="ghost"
            accessibilityLabel="Cancel"
            disabled={busy}
            onPress={() => {
              reset();
              onClose();
            }}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            accessibilityLabel="Save password"
            loading={busy}
            disabled={busy || password.length < 12 || (needsEmail && email.length === 0)}
            onPress={() => {
              void (async () => {
                const ok = await submit({
                  password,
                  email: needsEmail && email.length > 0 ? email : undefined,
                });
                if (ok) {
                  reset();
                  onClose();
                }
              })();
            }}
          >
            Save
          </Button>
        </>
      }
    >
      <View style={{ gap: theme.space('space.3') }}>
        <Text role="body" color="color.text.secondary">
          Add a password so you can still sign in if you disconnect a provider.
        </Text>
        {error ? <ErrorBanner title={error.title} description={error.description} /> : null}
        {needsEmail ? (
          <TextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@example.com"
          />
        ) : null}
        <TextField
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="At least 12 characters"
        />
      </View>
    </Dialog>
  );
}
