import { Text, useTheme } from '@gmrlog/ui';
import { View } from 'react-native';

export interface SearchSectionHeaderProps {
  title: string;
}

export function SearchSectionHeader({ title }: SearchSectionHeaderProps) {
  const theme = useTheme();

  return (
    <View
      style={{
        paddingHorizontal: theme.space('space.4'),
        paddingTop: theme.space('space.4'),
        paddingBottom: theme.space('space.2'),
      }}
    >
      <Text role="title" color="color.text.primary" accessibilityRole="header">
        {title}
      </Text>
    </View>
  );
}
