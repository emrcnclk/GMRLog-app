import { Text, useTheme } from '@gmrlog/ui';
import { Pressable, ScrollView, View } from 'react-native';

import { PROFILE_TAB_LABELS, PROFILE_TABS, type ProfileTabId } from '../hooks/profile-model';

export interface ProfileTabsProps {
  activeTab: ProfileTabId;
  onChange: (tab: ProfileTabId) => void;
}

export function ProfileTabs({ activeTab, onChange }: ProfileTabsProps) {
  const theme = useTheme();
  const hit = theme.space('space.12');

  return (
    <View
      style={{
        borderBottomWidth: 1,
        borderBottomColor: theme.color('color.border.default'),
        backgroundColor: theme.color('color.background.primary'),
      }}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: theme.space('space.2'),
          gap: theme.space('space.1'),
        }}
      >
        {PROFILE_TABS.map((tab) => {
          const selected = tab === activeTab;
          return (
            <Pressable
              key={tab}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              aria-selected={selected}
              accessibilityLabel={PROFILE_TAB_LABELS[tab]}
              onPress={() => {
                onChange(tab);
              }}
              style={{
                minHeight: hit,
                paddingHorizontal: theme.space('space.3'),
                justifyContent: 'center',
                borderBottomWidth: 2,
                borderBottomColor: selected
                  ? theme.color('color.interactive.primary')
                  : 'transparent',
              }}
            >
              <Text role="label" color={selected ? 'color.text.primary' : 'color.text.secondary'}>
                {PROFILE_TAB_LABELS[tab]}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
