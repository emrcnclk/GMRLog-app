import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, type PressableProps, type ViewStyle } from 'react-native';

import { useReduceMotion } from '../motion/motion-provider';
import { MIN_TOUCH_TARGET, pressableMotionStyle } from '../motion/pressable';
import { useTheme } from '../theme/theme-provider';
import type { SemanticSpaceToken } from '../theme/tokens';

import { Text } from './text';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  children: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  /** Leading glyph — the accent CTA's pencil, for instance. Decorative. */
  icon?: ReactNode;
  style?: ViewStyle | ViewStyle[];
}

const SIZE_PADDING_Y: Record<ButtonSize, SemanticSpaceToken> = {
  sm: 'space.1',
  md: 'space.2',
  lg: 'space.3',
};

const SIZE_PADDING_X: Record<ButtonSize, SemanticSpaceToken> = {
  sm: 'space.3',
  md: 'space.4',
  lg: 'space.5',
};

/**
 * Action button — primary / secondary / ghost / danger (F4.7 · function before form).
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  style,
  ...rest
}: ButtonProps) {
  const theme = useTheme();
  const reduceMotion = useReduceMotion();
  const isDisabled = disabled || loading;

  const backgroundColor = (() => {
    if (isDisabled) {
      // An outlined button stays outlined when it is disabled. Filling it would
      // change its shape, not just its state, and `accent` is outlined on
      // purpose — CLAUDE.md prefers the outlined treatment even for a primary
      // CTA. Found on Login (§1), where the submit is disabled on first paint.
      return variant === 'accent' || variant === 'ghost'
        ? 'transparent'
        : theme.color('color.interactive.disabled');
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

  const textColor = (() => {
    if (isDisabled) {
      return variant === 'accent' || variant === 'ghost'
        ? ('color.text.disabled' as const)
        : ('color.text.inverse' as const);
    }
    switch (variant) {
      case 'primary':
      case 'danger':
        return 'color.text.inverse' as const;
      case 'secondary':
      case 'ghost':
        return 'color.text.primary' as const;
      case 'accent':
        return 'color.accent.default' as const;
      default: {
        const _exhaustive: never = variant;
        return _exhaustive;
      }
    }
  })();

  const borderColor = (() => {
    if (isDisabled) {
      // The outlined variants keep a visible edge so a disabled CTA still reads
      // as a button; the filled ones have no border to keep.
      return variant === 'accent' || variant === 'ghost'
        ? theme.color('color.border.default')
        : 'transparent';
    }
    switch (variant) {
      case 'secondary':
      case 'ghost':
        return theme.color('color.border.default');
      case 'accent':
        return theme.color('color.accent.default');
      default:
        return 'transparent';
    }
  })();

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      style={({ pressed }) => [
        {
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: theme.space('space.2'),
          paddingVertical: theme.space(SIZE_PADDING_Y[size]),
          paddingHorizontal: theme.space(SIZE_PADDING_X[size]),
          minHeight: MIN_TOUCH_TARGET,
          borderRadius: theme.radius('radius.md'),
          backgroundColor,
          borderWidth:
            variant === 'secondary' || variant === 'ghost' || variant === 'accent' ? 1 : 0,
          borderColor,
        },
        pressableMotionStyle(pressed && !isDisabled, reduceMotion),
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={theme.color(textColor)} />
      ) : (
        <>
          {icon}
          <Text role="label" color={textColor}>
            {children}
          </Text>
        </>
      )}
    </Pressable>
  );
}
