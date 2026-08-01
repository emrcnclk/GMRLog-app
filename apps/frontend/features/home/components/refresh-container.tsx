import { useTheme } from '@gmrlog/ui';
import type { ReactElement, ReactNode } from 'react';
import { RefreshControl, ScrollView, type StyleProp, type ViewStyle } from 'react-native';

export interface RefreshContainerProps {
  refreshing: boolean;
  onRefresh: () => void | Promise<void>;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
}

/**
 * Pull-to-refresh shell for non-list empty/error states.
 * Feed list uses FlatList RefreshControl directly to avoid nested scroll.
 */
export function RefreshContainer({
  refreshing,
  onRefresh,
  children,
  style,
  contentContainerStyle,
}: RefreshContainerProps): ReactElement {
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
