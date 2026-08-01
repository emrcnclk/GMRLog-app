import { Image } from 'expo-image';
import { View, type ViewStyle } from 'react-native';

import { FADE_IMAGE_TRANSITION_MS } from '../motion/fade';
import { useReduceMotion } from '../motion/motion-provider';
import { useTheme } from '../theme/theme-provider';
import type { SemanticSpaceToken } from '../theme/tokens';

import { Text } from './text';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface AvatarProps {
  size?: AvatarSize;
  initials?: string;
  uri?: string;
  accessibilityLabel?: string;
  style?: ViewStyle | ViewStyle[];
  /** expo-image priority — avatars default to normal. */
  priority?: 'low' | 'normal' | 'high';
}

const SIZE_TOKEN: Record<AvatarSize, SemanticSpaceToken> = {
  sm: 'space.8',
  md: 'space.10',
  lg: 'space.12',
  /** D3.27 — profile hero scale (PROFILE_V2.md "large avatar"). */
  xl: 'space.20',
  '2xl': 'space.24',
};

/**
 * Person / image identity mark (S4 Avatar · F4.6).
 * Uses expo-image memory+disk cache with reduce-motion-aware transition.
 */
export function Avatar({
  size = 'md',
  initials,
  uri,
  accessibilityLabel,
  style,
  priority = 'normal',
}: AvatarProps) {
  const theme = useTheme();
  const reduceMotion = useReduceMotion();
  const dimension = theme.space(SIZE_TOKEN[size]);
  const label = accessibilityLabel ?? initials ?? 'Avatar';

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={label}
      style={[
        {
          width: dimension,
          height: dimension,
          borderRadius: theme.radius('radius.full'),
          backgroundColor: theme.color('color.surface.secondary'),
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        },
        style,
      ]}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: dimension, height: dimension }}
          cachePolicy="memory-disk"
          contentFit="cover"
          transition={reduceMotion ? 0 : FADE_IMAGE_TRANSITION_MS}
          priority={priority}
          accessibilityIgnoresInvertColors
        />
      ) : (
        <Text role={size === 'lg' ? 'title' : 'label'} color="color.text.secondary">
          {(initials ?? '?').slice(0, 2).toUpperCase()}
        </Text>
      )}
    </View>
  );
}
