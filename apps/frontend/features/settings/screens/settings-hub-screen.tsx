import { SCREEN_GUTTER, Section, useTheme } from '@gmrlog/ui';
import { useRouter } from 'expo-router';
import { Activity, Bell, HardDrive, Info, Plug, Settings, User } from 'lucide-react-native';
import { useCallback } from 'react';

import { useAuthStore } from '../../../src/state/auth-store';
import { ProCard } from '../components/pro-card';
import { SettingsGroupCard } from '../components/settings-group-card';
import { SettingsNavRow } from '../components/settings-nav-row';
import type { SettingsRowIcon } from '../components/settings-row';
import { SettingsScreenChrome } from '../components/settings-screen-chrome';
import { VersionFooter } from '../components/version-footer';
import { useDiagnostics } from '../hooks/use-diagnostics';
import { SETTINGS_HUB_NAV, type SettingsRouteKey } from '../navigation/settings-routes';

const HUB_ICONS: Record<
  Exclude<SettingsRouteKey, 'hub' | 'appearance' | 'accessibility' | 'subscription'>,
  SettingsRowIcon
> = {
  general: Settings,
  account: User,
  integrations: Plug,
  notifications: Bell,
  storage: HardDrive,
  diagnostics: Activity,
  about: Info,
};

export function SettingsHubScreen() {
  const theme = useTheme();
  const router = useRouter();
  const diagnostics = useDiagnostics();
  const handle = useAuthStore((s) => s.user?.handle);

  const onBack = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <SettingsScreenChrome
      title="Settings"
      backLabel="← Profile"
      onBack={onBack}
      footer={
        <VersionFooter
          version={diagnostics.appVersion}
          build={diagnostics.buildNumber}
          handle={handle}
        />
      }
    >
      <ProCard />
      <Section
        title="Application"
        description="Configure your Digital Home."
        style={{ paddingHorizontal: theme.space(SCREEN_GUTTER) }}
      >
        <SettingsGroupCard>
          {SETTINGS_HUB_NAV.map((item) => (
            <SettingsNavRow
              key={item.key}
              icon={HUB_ICONS[item.key]}
              title={item.title}
              subtitle={item.subtitle}
              onPress={() => {
                router.push(item.href);
              }}
            />
          ))}
        </SettingsGroupCard>
      </Section>
    </SettingsScreenChrome>
  );
}
