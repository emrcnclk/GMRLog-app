import { Pressable, View, type TextInputProps, type ViewStyle } from 'react-native';

import { useTheme } from '../theme/theme-provider';

import { Text } from './text';
import { TextField } from './text-field';

export interface SearchFieldProps extends Omit<TextInputProps, 'style' | 'secureTextEntry'> {
  label?: string;
  error?: string;
  onClear?: () => void;
  style?: ViewStyle | ViewStyle[];
}

/**
 * Search query entry — TextField + optional clear (S4 SearchField).
 */
export function SearchField({ label, error, value, onClear, style, ...rest }: SearchFieldProps) {
  const theme = useTheme();
  const hasValue = typeof value === 'string' && value.length > 0;

  return (
    <View style={[{ gap: theme.space('space.1') }, style]}>
      <TextField
        {...rest}
        label={label}
        error={error}
        value={value}
        accessibilityRole="search"
        returnKeyType="search"
      />
      {hasValue && onClear ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          onPress={onClear}
          style={{ alignSelf: 'flex-end', paddingVertical: theme.space('space.1') }}
        >
          <Text role="label" color="color.text.secondary">
            Clear
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
