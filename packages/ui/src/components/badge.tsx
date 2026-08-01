import { View, type ViewStyle } from 'react-native';

import { useTheme } from '../theme/theme-provider';
import type { SemanticColorToken } from '../theme/tokens';

import { Text } from './text';

export type BadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

export interface BadgeProps {
  children: string;
  tone?: BadgeTone;
  style?: ViewStyle | ViewStyle[];
}

function toneColors(tone: BadgeTone): {
  background: SemanticColorToken;
  text: SemanticColorToken;
} {
  switch (tone) {
    case 'neutral':
      return { background: 'color.surface.secondary', text: 'color.text.secondary' };
    case 'info':
      return { background: 'color.status.info', text: 'color.text.inverse' };
    case 'success':
      return { background: 'color.status.success', text: 'color.text.inverse' };
    case 'warning':
      return { background: 'color.status.warning', text: 'color.text.inverse' };
    case 'danger':
      return { background: 'color.status.error', text: 'color.text.inverse' };
    default: {
      const _exhaustive: never = tone;
      return _exhaustive;
    }
  }
}

/**
 * Compact semantic status mark (S4 Badge · no engagement bait).
 */
export function Badge({ children, tone = 'neutral', style }: BadgeProps) {
  const theme = useTheme();
  const colors = toneColors(tone);

  return (
    <View
      style={[
        {
          alignSelf: 'flex-start',
          paddingHorizontal: theme.space('space.2'),
          paddingVertical: theme.space('space.1'),
          borderRadius: theme.radius('radius.full'),
          backgroundColor: theme.color(colors.background),
        },
        style,
      ]}
    >
      <Text role="caption" color={colors.text}>
        {children}
      </Text>
    </View>
  );
}
