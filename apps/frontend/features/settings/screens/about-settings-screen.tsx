import { useRouter } from 'expo-router';
import { useCallback } from 'react';

import { AboutLinkRow } from '../components/about-link-row';
import { SettingsScreenChrome } from '../components/settings-screen-chrome';
import { SettingsSectionHeader } from '../components/settings-section-header';
import { VersionFooter } from '../components/version-footer';
import { useDiagnostics } from '../hooks/use-diagnostics';
import { ABOUT_LINKS } from '../model/about-model';

export function AboutSettingsScreen() {
  const router = useRouter();
  const diagnostics = useDiagnostics();

  const onBack = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <SettingsScreenChrome
      title="About"
      backLabel="← Settings"
      onBack={onBack}
      footer={<VersionFooter version={diagnostics.appVersion} build={diagnostics.buildNumber} />}
    >
      <SettingsSectionHeader title="Legal & contact" />
      {ABOUT_LINKS.map((link) => (
        <AboutLinkRow key={link.id} link={link} />
      ))}
    </SettingsScreenChrome>
  );
}
