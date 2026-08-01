import { Button, Text, TextField, useTheme } from '@gmrlog/ui';
import { memo, useState } from 'react';
import { View } from 'react-native';

import { isSteamIdOrUrlValid } from '../hooks/integrations-model';
import { useConnectSteam, useDisconnectSteam } from '../hooks/use-integrations';

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
  const [steamIdOrUrl, setSteamIdOrUrl] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const busy = connect.isPending || disconnect.isPending;
  const canSubmit = isSteamIdOrUrlValid(steamIdOrUrl) && !busy && !disabled;

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
        Connect with SteamID64, vanity URL, or profile URL.
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
            variant="primary"
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
