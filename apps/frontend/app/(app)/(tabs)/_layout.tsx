import { useTheme } from '@gmrlog/ui';
import { Tabs } from 'expo-router';
import { Bell, Compass, Home, Search, User, type LucideIcon } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function tabIcon(Icon: LucideIcon, color: string) {
  return <Icon color={color} size={22} strokeWidth={1.75} />;
}

/**
 * Main player tabs — Home · Discover · Search · Notifications · Profile.
 */
export default function TabsLayout() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const active = theme.color('color.interactive.primary');
  const inactive = theme.color('color.text.tertiary');
  const minTabHeight = theme.space('space.12');
  const labelType = theme.typography('label');

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: active,
        tabBarInactiveTintColor: inactive,
        tabBarStyle: {
          backgroundColor: theme.color('color.background.elevated'),
          borderTopColor: theme.color('color.border.default'),
          borderTopWidth: 1,
          height: minTabHeight + insets.bottom,
          paddingBottom: Math.max(insets.bottom, theme.space('space.2')),
          paddingTop: theme.space('space.2'),
        },
        // A tab label is a name, not metadata, so it takes `label` whole
        // rather than borrowing one field off `caption`. Weight 500 is the
        // ceiling the type scale allows (THEME_MIGRATION.md §4).
        tabBarLabelStyle: {
          fontSize: labelType.fontSize,
          fontWeight: labelType.fontWeight,
          letterSpacing: labelType.letterSpacing,
          fontFamily: labelType.fontFamily,
        },
        tabBarItemStyle: {
          minHeight: minTabHeight,
        },
      }}
    >
      <Tabs.Screen
        name="home/index"
        options={{
          title: 'Home',
          href: '/(app)/(tabs)/home',
          tabBarAccessibilityLabel: 'Home',
          tabBarIcon: ({ color }) => tabIcon(Home, color),
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: 'Discover',
          href: '/(app)/(tabs)/discover',
          tabBarAccessibilityLabel: 'Discover',
          tabBarIcon: ({ color }) => tabIcon(Compass, color),
        }}
      />
      <Tabs.Screen
        name="search/index"
        options={{
          title: 'Search',
          href: '/(app)/(tabs)/search',
          tabBarAccessibilityLabel: 'Search',
          tabBarIcon: ({ color }) => tabIcon(Search, color),
        }}
      />
      <Tabs.Screen
        name="notifications/index"
        options={{
          title: 'Notifications',
          href: '/(app)/(tabs)/notifications',
          tabBarAccessibilityLabel: 'Notifications',
          tabBarIcon: ({ color }) => tabIcon(Bell, color),
        }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{
          title: 'Profile',
          href: '/(app)/(tabs)/profile',
          tabBarAccessibilityLabel: 'Profile',
          tabBarIcon: ({ color }) => tabIcon(User, color),
        }}
      />
    </Tabs>
  );
}
