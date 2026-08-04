import { useRouter } from 'expo-router';
import { useCallback } from 'react';

import { SettingsNavRow } from '../components/settings-nav-row';
import { SettingsScreenChrome } from '../components/settings-screen-chrome';
import { SettingsSectionHeader } from '../components/settings-section-header';
import { VersionFooter } from '../components/version-footer';
import { useDiagnostics } from '../hooks/use-diagnostics';
import { SETTINGS_HUB_NAV } from '../navigation/settings-routes';

export function SettingsHubScreen() {
  const router = useRouter();
  const diagnostics = useDiagnostics();

  const onBack = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <SettingsScreenChrome
      title="Settings"
      backLabel="← Profile"
      onBack={onBack}
      footer={<VersionFooter version={diagnostics.appVersion} build={diagnostics.buildNumber} />}
    >
      <SettingsSectionHeader title="Application" description="Configure your Digital Home." />
      {SETTINGS_HUB_NAV.map((item) => (
        <SettingsNavRow
          key={item.key}
          title={item.title}
          subtitle={item.subtitle}
          onPress={() => {
            router.push(item.href);
          }}
        />
      ))}
    </SettingsScreenChrome>
  );
}
