import { Badge, Text, useTheme } from '@gmrlog/ui';
import { memo } from 'react';
import { View } from 'react-native';

import type { FeatureFlagRow } from '../model/diagnostics-model';

export interface FeatureFlagsListProps {
  flags: readonly FeatureFlagRow[];
}

function FeatureFlagsListComponent({ flags }: FeatureFlagsListProps) {
  const theme = useTheme();
  return (
    <View style={{ gap: 0 }}>
      {flags.map((flag) => (
        <View
          key={flag.id}
          accessibilityLabel={`${flag.label} ${flag.enabled ? 'enabled' : 'disabled'}`}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.space('space.2'),
            paddingHorizontal: theme.space('space.4'),
            paddingVertical: theme.space('space.3'),
            borderBottomWidth: 1,
            borderBottomColor: theme.color('color.border.default'),
          }}
        >
          <View style={{ flex: 1, gap: theme.space('space.1') }}>
            <Text role="title" color="color.text.primary">
              {flag.label}
            </Text>
            <Text role="caption" color="color.text.tertiary">
              {flag.id} · {flag.source}
            </Text>
          </View>
          <Badge tone={flag.enabled ? 'success' : 'neutral'}>{flag.enabled ? 'On' : 'Off'}</Badge>
        </View>
      ))}
    </View>
  );
}

export const FeatureFlagsList = memo(FeatureFlagsListComponent);
