import { useRouter } from 'expo-router';
import { useCallback } from 'react';

import { ClearCacheActions } from '../components/clear-cache-actions';
import { SettingsScreenChrome } from '../components/settings-screen-chrome';
import { SettingsSectionHeader } from '../components/settings-section-header';
import { StorageInfoCard } from '../components/storage-info-card';
import { useStorageActions } from '../hooks/use-diagnostics';

export function StorageSettingsScreen() {
  const router = useRouter();
  const { info } = useStorageActions();

  const onBack = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <SettingsScreenChrome title="Storage" backLabel="← Settings" onBack={onBack}>
      <SettingsSectionHeader title="Local caches" />
      <StorageInfoCard info={info} />
      <SettingsSectionHeader title="Actions" description="Confirm before clearing." />
      <ClearCacheActions />
    </SettingsScreenChrome>
  );
}
