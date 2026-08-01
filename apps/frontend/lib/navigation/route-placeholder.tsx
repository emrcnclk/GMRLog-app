import { useTheme } from '@gmrlog/ui';
import { StyleSheet, Text, View } from 'react-native';

export interface RoutePlaceholderProps {
  title: string;
  description?: string;
}

/**
 * Non-product route placeholder for foundation route assemblies.
 * Never used as a shippable screen composition.
 */
export function RoutePlaceholder({ title, description }: RoutePlaceholderProps) {
  const theme = useTheme();
  return (
    <View
      style={[styles.root, { backgroundColor: theme.color('color.background.primary') }]}
      accessibilityRole="summary"
    >
      <Text style={[styles.title, { color: theme.color('color.text.primary') }]}>{title}</Text>
      {description ? (
        <Text style={{ color: theme.color('color.text.secondary') }}>{description}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
});
