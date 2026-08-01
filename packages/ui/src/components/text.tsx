import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';

import { useTheme } from '../theme/theme-provider';
import type { SemanticColorToken, SemanticTypeRole } from '../theme/tokens';

export interface TextProps extends Omit<RNTextProps, 'style' | 'role'> {
  role?: SemanticTypeRole;
  color?: SemanticColorToken;
  style?: TextStyle | TextStyle[];
}

/**
 * Semantic text atom — consumes typography roles (F4.3 · reading before decoration).
 */
export function Text({
  role = 'body',
  color = 'color.text.primary',
  style,
  children,
  ...rest
}: TextProps) {
  const theme = useTheme();
  const type = theme.typography(role);

  return (
    <RNText
      {...rest}
      style={[
        {
          color: theme.color(color),
          fontSize: type.fontSize,
          lineHeight: type.lineHeight,
          fontWeight: type.fontWeight,
          letterSpacing: type.letterSpacing,
        },
        style,
      ]}
    >
      {children}
    </RNText>
  );
}
