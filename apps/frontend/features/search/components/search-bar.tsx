import { SearchField, useTheme } from '@gmrlog/ui';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface SearchBarProps {
  value: string;
  onChangeText: (value: string) => void;
  onSubmit?: () => void;
  onClear?: () => void;
}

/** Search header input — labeled · clearable · min touch-friendly chrome. */
export function SearchBar({ value, onChangeText, onSubmit, onClear }: SearchBarProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        paddingTop: insets.top + theme.space('space.2'),
        paddingHorizontal: theme.space('space.4'),
        paddingBottom: theme.space('space.3'),
        backgroundColor: theme.color('color.background.primary'),
        borderBottomWidth: 1,
        borderBottomColor: theme.color('color.border.default'),
      }}
    >
      <SearchField
        label="Search"
        placeholder="Search games, people, culture…"
        value={value}
        onChangeText={onChangeText}
        onClear={onClear}
        onSubmitEditing={onSubmit}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="off"
        returnKeyType="search"
        accessibilityLabel="Search GMRLOG"
      />
    </View>
  );
}
