import { useTheme } from '@gmrlog/ui';
import type { ReactElement, ReactNode } from 'react';
import { RefreshControl, ScrollView, type StyleProp, type ViewStyle } from 'react-native';

export interface DiscoverRefreshContainerProps {
  refreshing: boolean;
  onRefresh: () => void | Promise<void>;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
}

export function DiscoverRefreshContainer({
  refreshing,
  onRefresh,
  children,
  style,
  contentContainerStyle,
}: DiscoverRefreshContainerProps): ReactElement {
  const theme = useTheme();

  return (
    <ScrollView
      style={[{ flex: 1 }, style]}
      contentContainerStyle={[{ flexGrow: 1 }, contentContainerStyle]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            void onRefresh();
          }}
          tintColor={theme.color('color.interactive.primary')}
          colors={[theme.color('color.interactive.primary')]}
        />
      }
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}
