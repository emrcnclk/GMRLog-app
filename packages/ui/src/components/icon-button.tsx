import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, type PressableProps, type ViewStyle } from 'react-native';

import { useTheme } from '../theme/theme-provider';
import type { SemanticSpaceToken } from '../theme/tokens';

import type { ButtonSize, ButtonVariant } from './button';

export interface IconButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  children: ReactNode;
  accessibilityLabel: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle | ViewStyle[];
}

const SIZE_BOX: Record<ButtonSize, SemanticSpaceToken> = {
  sm: 'space.8',
  md: 'space.10',
  lg: 'space.12',
};

/**
 * Compact icon action — requires accessibilityLabel (S4 IconButton).
 */
export function IconButton({
  children,
  accessibilityLabel,
  variant = 'ghost',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  ...rest
}: IconButtonProps) {
  const theme = useTheme();
  const isDisabled = disabled || loading;
  const box = theme.space(SIZE_BOX[size]);

  const backgroundColor = (() => {
    if (isDisabled) {
      return theme.color('color.interactive.disabled');
    }
    switch (variant) {
      case 'primary':
        return theme.color('color.interactive.primary');
      case 'secondary':
        return theme.color('color.surface.secondary');
      case 'ghost':
      case 'accent':
        return 'transparent';
      case 'danger':
        return theme.color('color.status.error');
      default: {
        const _exhaustive: never = variant;
        return _exhaustive;
      }
    }
  })();

  const indicatorColor =
    variant === 'primary' || variant === 'danger'
      ? theme.color('color.text.inverse')
      : theme.color('color.text.primary');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      disabled={isDisabled}
      style={({ pressed }) => [
        {
          width: box,
          height: box,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: theme.radius('radius.full'),
          backgroundColor,
          opacity: pressed && !isDisabled ? 0.85 : 1,
        },
        style,
      ]}
      {...rest}
    >
      {loading ? <ActivityIndicator color={indicatorColor} /> : children}
    </Pressable>
  );
}
