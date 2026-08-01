import { TextInput, View, type TextInputProps, type ViewStyle } from 'react-native';

import { useTheme } from '../theme/theme-provider';

import { Text } from './text';

export interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  secureTextEntry?: boolean;
  style?: ViewStyle | ViewStyle[];
}

/**
 * Single-line text capture — label + error (S4 TextField · F4.7).
 */
export function TextField({
  label,
  error,
  secureTextEntry,
  editable = true,
  style,
  ...rest
}: TextFieldProps) {
  const theme = useTheme();
  const hasError = Boolean(error);

  return (
    <View style={[{ gap: theme.space('space.1') }, style]}>
      {label ? (
        <Text role="label" color="color.text.secondary">
          {label}
        </Text>
      ) : null}
      <TextInput
        {...rest}
        editable={editable}
        secureTextEntry={secureTextEntry}
        placeholderTextColor={theme.color('color.text.tertiary')}
        style={{
          color: theme.color(editable ? 'color.text.primary' : 'color.text.disabled'),
          backgroundColor: theme.color('color.surface.secondary'),
          borderWidth: 1,
          borderColor: theme.color(hasError ? 'color.border.error' : 'color.border.default'),
          borderRadius: theme.radius('radius.md'),
          paddingHorizontal: theme.space('space.3'),
          paddingVertical: theme.space('space.2'),
          fontSize: theme.typography('body').fontSize,
          lineHeight: theme.typography('body').lineHeight,
        }}
        accessibilityState={{ disabled: !editable }}
      />
      {hasError ? (
        <Text role="caption" color="color.status.error">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
