import { useRouter } from 'expo-router';
import { useCallback } from 'react';

import { DebugSection } from '../components/debug-section';
import { DiagnosticsRow } from '../components/diagnostics-row';
import { FeatureFlagsList } from '../components/feature-flags-list';
import { SettingsScreenChrome } from '../components/settings-screen-chrome';
import { SettingsSectionHeader } from '../components/settings-section-header';
import { useDiagnostics } from '../hooks/use-diagnostics';

export function DiagnosticsSettingsScreen() {
  const router = useRouter();
  const diagnostics = useDiagnostics();

  const onBack = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <SettingsScreenChrome title="Diagnostics" backLabel="← Settings" onBack={onBack}>
      <SettingsSectionHeader title="Application" />
      <DiagnosticsRow label="App version" value={diagnostics.appVersion} />
      <DiagnosticsRow label="Build number" value={diagnostics.buildNumber} />
      <DiagnosticsRow label="Environment" value={diagnostics.environment} />
      <DiagnosticsRow label="API URL" value={diagnostics.apiUrl} />

      <SettingsSectionHeader title="Device & network" />
      <DiagnosticsRow label="Device" value={diagnostics.deviceLabel} />
      <DiagnosticsRow label="Network" value={diagnostics.networkLabel} />

      <SettingsSectionHeader title="Feature flags" description="Read-only local registry." />
      <FeatureFlagsList flags={diagnostics.featureFlags} />

      <DebugSection
        visible={diagnostics.showDebug}
        apiUrl={diagnostics.apiUrl}
        environment={diagnostics.environment}
      />
    </SettingsScreenChrome>
  );
}
