import { Text, useTheme } from '@gmrlog/ui';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { View } from 'react-native';

import { NotificationPrefRow } from '../components/notification-pref-row';
import { SettingsScreenChrome } from '../components/settings-screen-chrome';
import { SettingsSectionHeader } from '../components/settings-section-header';

export function NotificationsSettingsScreen() {
  const theme = useTheme();
  const router = useRouter();

  const onBack = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <SettingsScreenChrome title="Notifications" backLabel="← Settings" onBack={onBack}>
      <SettingsSectionHeader
        title="Preferences"
        description="Backend has no notification preference PATCH — controls stay disabled."
      />
      <View
        style={{ paddingHorizontal: theme.space('space.4'), paddingBottom: theme.space('space.2') }}
      >
        <Text role="caption" color="color.text.tertiary">
          Existing APIs: GET /notifications · POST /notifications/read only.
        </Text>
      </View>
      <NotificationPrefRow
        title="Push notifications"
        subtitle="No preferences endpoint on frozen backend"
      />
      <NotificationPrefRow
        title="Email digests"
        subtitle="No preferences endpoint on frozen backend"
      />
      <NotificationPrefRow
        title="In-app alerts"
        subtitle="Managed via read state only — not preference toggles"
      />
    </SettingsScreenChrome>
  );
}
