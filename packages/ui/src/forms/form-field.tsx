import type { ReactNode } from 'react';
import { View, type ViewStyle } from 'react-native';

import { Text } from '../components/text';
import { useTheme } from '../theme/theme-provider';

export interface FormFieldProps {
  label?: string;
  error?: string;
  children: ReactNode;
  style?: ViewStyle | ViewStyle[];
}

/**
 * Label + control + error wrapper for RHF consumers (S4 form composition).
 */
export function FormField({ label, error, children, style }: FormFieldProps) {
  const theme = useTheme();
  const hasError = Boolean(error);

  return (
    <View style={[{ gap: theme.space('space.1') }, style]}>
      {label ? (
        <Text role="label" color="color.text.secondary">
          {label}
        </Text>
      ) : null}
      {children}
      {hasError ? (
        <Text role="caption" color="color.status.error">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
