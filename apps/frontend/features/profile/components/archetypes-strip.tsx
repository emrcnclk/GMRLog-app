import type { PlayerArchetypeResponse } from '@gmrlog/types';
import { Text, useTheme } from '@gmrlog/ui';
import { View } from 'react-native';

import { archetypeLabel } from '../hooks/profile-model';

export interface ArchetypesStripProps {
  archetypes: PlayerArchetypeResponse[];
}

/** Quiet text chips — theme tokens only · no glow · no emoji. */
export function ArchetypesStrip({ archetypes }: ArchetypesStripProps) {
  const theme = useTheme();

  if (archetypes.length === 0) {
    return null;
  }

  return (
    <View
      accessibilityRole="summary"
      accessibilityLabel="Player archetypes"
      style={{
        paddingHorizontal: theme.space('space.4'),
        paddingBottom: theme.space('space.3'),
        gap: theme.space('space.2'),
      }}
    >
      <Text role="caption" color="color.text.secondary">
        Archetypes
      </Text>
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: theme.space('space.2'),
        }}
      >
        {archetypes.map((item) => (
          <View
            key={item.key}
            accessibilityRole="text"
            accessibilityLabel={archetypeLabel(item.key)}
            style={{
              paddingHorizontal: theme.space('space.3'),
              paddingVertical: theme.space('space.1'),
              borderRadius: theme.radius('radius.md'),
              borderWidth: 1,
              borderColor: theme.color('color.border.default'),
              backgroundColor: theme.color('color.surface.secondary'),
            }}
          >
            <Text role="label" color="color.text.primary">
              {archetypeLabel(item.key)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
