import { Button, Text, TextField, useTheme } from '@gmrlog/ui';
import { memo, useState } from 'react';
import { View } from 'react-native';

import { mapAuthError } from '../../../src/auth/map-auth-error';
import { isSteamIdOrUrlValid } from '../hooks/integrations-model';
import { useConnectSteam, useDisconnectSteam } from '../hooks/use-integrations';
import { useSteamConnectOpenId } from '../hooks/use-steam-connect-openid';

export interface SteamConnectFormProps {
  connected: boolean;
  displayName?: string | null;
  /** Task 4.5a — durable per-connection flag, not inferred from anything client-side. */
  verified?: boolean;
  disabled?: boolean;
  isOnline?: boolean;
  onError?: (message: string) => void;
}

function SteamConnectFormComponent({
  connected,
  displayName,
  verified = false,
  disabled = false,
  isOnline = true,
  onError,
}: SteamConnectFormProps) {
  const theme = useTheme();
  const connect = useConnectSteam();
  const disconnect = useDisconnectSteam();
  const openId = useSteamConnectOpenId();
  const [steamIdOrUrl, setSteamIdOrUrl] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const busy = connect.isPending || disconnect.isPending || openId.pending;
  const canSubmit = isSteamIdOrUrlValid(steamIdOrUrl) && !busy && !disabled;

  // Task 4.6 — same `mapAuthError` the login/register screens use, so a
  // forged Steam assertion, an expired connect state, or "already linked"
  // reads with the same precise, non-leaking copy everywhere it can occur.
  const reportError = (error: unknown) => {
    const { description } = mapAuthError(error, isOnline);
    setLocalError(description);
    onError?.(description);
  };

  const onConnectVerified = () => {
    setLocalError(null);
    openId
      .connect()
      .then((result) => {
        if (result.status === 'error') {
          reportError(result.error);
        }
      })
      .catch(reportError);
  };

  return (
    <View
      style={{
        paddingHorizontal: theme.space('space.4'),
        paddingVertical: theme.space('space.3'),
        gap: theme.space('space.3'),
        borderBottomWidth: 1,
        borderBottomColor: theme.color('color.border.default'),
      }}
    >
      <Text role="title" color="color.text.primary">
        Steam
      </Text>
      <Text role="caption" color="color.text.tertiary">
        Sign in with Steam to connect, or link an ID manually.
      </Text>

      {connected ? (
        <View style={{ gap: theme.space('space.2') }}>
          <Text role="body" color="color.text.secondary">
            {displayName ? `Connected as ${displayName}` : 'Steam is connected'}
          </Text>
          {verified ? null : (
            <Text role="meta" color="color.text.tertiary">
              Unverified — self-reported, not signed in via Steam
            </Text>
          )}
          <Button
            variant="secondary"
            accessibilityLabel="Disconnect Steam"
            disabled={busy || disabled}
            loading={disconnect.isPending}
            onPress={() => {
              setLocalError(null);
              disconnect.mutate(undefined, {
                onError: reportError,
              });
            }}
          >
            Disconnect
          </Button>
        </View>
      ) : (
        <View style={{ gap: theme.space('space.2') }}>
          <Button
            variant="primary"
            accessibilityLabel="Connect with Steam"
            disabled={busy || disabled}
            loading={openId.pending}
            onPress={onConnectVerified}
          >
            Connect with Steam
          </Button>
          <Text role="meta" color="color.text.tertiary">
            Or link manually, without signing in — stays unverified
          </Text>
          <TextField
            label="Steam ID or profile URL"
            value={steamIdOrUrl}
            onChangeText={setSteamIdOrUrl}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!busy && !disabled}
            placeholder="7656119… or steamcommunity.com/id/…"
            error={localError ?? undefined}
            accessibilityLabel="Steam ID or profile URL"
          />
          <Button
            variant="secondary"
            accessibilityLabel="Connect Steam"
            disabled={!canSubmit}
            loading={connect.isPending}
            onPress={() => {
              setLocalError(null);
              connect.mutate(steamIdOrUrl, {
                onSuccess: () => {
                  setSteamIdOrUrl('');
                },
                onError: reportError,
              });
            }}
          >
            Connect
          </Button>
        </View>
      )}
    </View>
  );
}

export const SteamConnectForm = memo(SteamConnectFormComponent);
