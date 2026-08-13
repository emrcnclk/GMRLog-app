import { Button, Text, TextField, useTheme } from '@gmrlog/ui';
import { memo, useState } from 'react';
import { View } from 'react-native';

import { isSteamIdOrUrlValid } from '../hooks/integrations-model';
import { useConnectSteam, useDisconnectSteam } from '../hooks/use-integrations';
import { useSteamConnectOpenId } from '../hooks/use-steam-connect-openid';

export interface SteamConnectFormProps {
  connected: boolean;
  displayName?: string | null;
  disabled?: boolean;
  onError?: (message: string) => void;
}

function SteamConnectFormComponent({
  connected,
  displayName,
  disabled = false,
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

  const onConnectVerified = () => {
    setLocalError(null);
    openId
      .connect()
      .then((result) => {
        if (result.status === 'error') {
          const message = result.error instanceof Error ? result.error.message : 'Connect failed';
          setLocalError(message);
          onError?.(message);
        }
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : 'Connect failed';
        setLocalError(message);
        onError?.(message);
      });
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
          <Button
            variant="secondary"
            accessibilityLabel="Disconnect Steam"
            disabled={busy || disabled}
            loading={disconnect.isPending}
            onPress={() => {
              setLocalError(null);
              disconnect.mutate(undefined, {
                onError: (error) => {
                  const message = error instanceof Error ? error.message : 'Disconnect failed';
                  setLocalError(message);
                  onError?.(message);
                },
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
            Or link manually, without signing in
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
                onError: (error) => {
                  const message = error instanceof Error ? error.message : 'Connect failed';
                  setLocalError(message);
                  onError?.(message);
                },
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
