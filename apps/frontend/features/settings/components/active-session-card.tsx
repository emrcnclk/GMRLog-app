import type { UserSelfResponse } from '@gmrlog/types';
import { Text, useTheme } from '@gmrlog/ui';
import { memo } from 'react';
import { View } from 'react-native';

export interface ActiveSessionCardProps {
  user: UserSelfResponse | null;
}

function ActiveSessionCardComponent({ user }: ActiveSessionCardProps) {
  const theme = useTheme();
  return (
    <View
      accessibilityLabel="Active session"
      style={{
        marginHorizontal: theme.space('space.4'),
        padding: theme.space('space.4'),
        borderRadius: theme.radius('radius.md'),
        backgroundColor: theme.color('color.surface.secondary'),
        gap: theme.space('space.1'),
      }}
    >
      <Text role="label" color="color.text.secondary">
        Active session
      </Text>
      {user ? (
        <>
          <Text role="title" color="color.text.primary">
            @{user.handle}
          </Text>
          <Text role="meta" color="color.text.tertiary">
            Signed in as {user.displayName}
          </Text>
        </>
      ) : (
        <Text role="body" color="color.text.secondary">
          No active session details.
        </Text>
      )}
    </View>
  );
}

export const ActiveSessionCard = memo(ActiveSessionCardComponent);
