import { Icon, IconButton, useTheme } from '@gmrlog/ui';
import { View } from 'react-native';

import { ScreenHeader } from '../../../src/navigation/screen-header';

export interface HomeHeaderProps {
  onPressSearch: () => void;
  onPressNotifications: () => void;
}

/**
 * Home top bar — logo · search shortcut · notifications shortcut.
 */
export function HomeHeader({ onPressSearch, onPressNotifications }: HomeHeaderProps) {
  const theme = useTheme();

  return (
    <ScreenHeader
      title="GMRLOG"
      trailing={
        <View style={{ flexDirection: 'row', gap: theme.space('space.1') }}>
          <IconButton accessibilityLabel="Search" size="lg" onPress={onPressSearch} hitSlop={8}>
            <Icon name="search" decorative size={22} color="color.text.primary" />
          </IconButton>
          <IconButton
            accessibilityLabel="Notifications"
            size="lg"
            onPress={onPressNotifications}
            hitSlop={8}
          >
            <Icon name="bell" decorative size={22} color="color.text.primary" />
          </IconButton>
        </View>
      }
    />
  );
}
