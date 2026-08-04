import { SCREEN_GUTTER, Section, Text, useTheme } from '@gmrlog/ui';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { View } from 'react-native';

import { NotificationPrefRow } from '../components/notification-pref-row';
import { SettingsGroupCard } from '../components/settings-group-card';
import { SettingsScreenChrome } from '../components/settings-screen-chrome';

export function NotificationsSettingsScreen() {
  const theme = useTheme();
  const router = useRouter();

  const onBack = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <SettingsScreenChrome title="Notifications" backLabel="← Settings" onBack={onBack}>
      <Section
        title="Preferences"
        description="Backend has no notification preference PATCH — controls stay disabled."
        style={{ paddingHorizontal: theme.space(SCREEN_GUTTER) }}
      >
        <View style={{ paddingBottom: theme.space('space.2') }}>
          <Text role="bodySm" color="color.text.tertiary">
            Existing APIs: GET /notifications · POST /notifications/read only.
          </Text>
        </View>
        <SettingsGroupCard>
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
        </SettingsGroupCard>
      </Section>
    </SettingsScreenChrome>
  );
}
