import { useRouter } from 'expo-router';
import { useCallback } from 'react';

import { DateTimeFormatRow } from '../components/date-time-format-row';
import { RegionField } from '../components/region-field';
import { SettingsNavRow } from '../components/settings-nav-row';
import { SettingsScreenChrome } from '../components/settings-screen-chrome';
import { SettingsSectionHeader } from '../components/settings-section-header';
import { GENERAL_SUBNAV } from '../navigation/settings-routes';
import { useLocalUiPrefsStore } from '../storage/local-ui-prefs-store';

export function GeneralSettingsScreen() {
  const router = useRouter();
  const dateFormat = useLocalUiPrefsStore((s) => s.dateFormat);
  const setDateFormat = useLocalUiPrefsStore((s) => s.setDateFormat);
  const region = useLocalUiPrefsStore((s) => s.region);
  const setRegion = useLocalUiPrefsStore((s) => s.setRegion);

  const onBack = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <SettingsScreenChrome title="General" backLabel="← Settings" onBack={onBack}>
      <SettingsSectionHeader title="Sections" />
      {GENERAL_SUBNAV.map((item) => (
        <SettingsNavRow
          key={item.key}
          title={item.title}
          subtitle={item.subtitle}
          onPress={() => {
            router.push(item.href);
          }}
        />
      ))}
      <SettingsSectionHeader
        title="Locale helpers"
        description="Date/region stay local until backend fields exist."
      />
      <DateTimeFormatRow value={dateFormat} onChange={setDateFormat} />
      <RegionField
        value={region ?? ''}
        onChange={(value) => {
          setRegion(value.trim().length === 0 ? null : value.trim().slice(0, 8));
        }}
      />
    </SettingsScreenChrome>
  );
}
