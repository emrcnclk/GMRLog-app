import { useRouter } from 'expo-router';
import { useCallback } from 'react';

import { useConnectivityStore } from '../../../src/state/stores';
import { SettingsEmptyState } from '../../settings/components/settings-empty-state';
import { SettingsErrorState } from '../../settings/components/settings-error-state';
import { SettingsScreenChrome } from '../../settings/components/settings-screen-chrome';
import { SettingsSectionHeader } from '../../settings/components/settings-section-header';
import { SettingsSkeleton } from '../../settings/components/settings-skeleton';
import { mapSettingsError } from '../../settings/model/settings-model';
import { CsvImportPanel } from '../components/csv-import-panel';
import { IntegrationRow } from '../components/integration-row';
import { SteamConnectForm } from '../components/steam-connect-form';
import { SyncHistoryList } from '../components/sync-history-list';
import { findSteamIntegration } from '../hooks/integrations-model';
import { useIntegrationsDashboard, useSteamProfile } from '../hooks/use-integrations';

/** Integrations dashboard — Steam connect · sync · history · CSV import (D3.23). */
export function IntegrationsDashboardScreen() {
  const router = useRouter();
  const isOnline = useConnectivityStore((s) => s.isOnline);
  const dashboard = useIntegrationsDashboard();
  const steam = findSteamIntegration(dashboard.integrations);
  const steamProfile = useSteamProfile(dashboard.steamConnected || steam !== null);

  const onBack = useCallback(() => {
    router.back();
  }, [router]);

  const displayName = steamProfile.data?.displayName ?? steam?.displayName ?? null;

  return (
    <SettingsScreenChrome title="Integrations" backLabel="← Settings" onBack={onBack}>
      {dashboard.status === 'loading' ? <SettingsSkeleton /> : null}

      {dashboard.status === 'error' ? (
        <SettingsErrorState
          title={mapSettingsError(dashboard.error, isOnline).title}
          description={mapSettingsError(dashboard.error, isOnline).description}
          isOffline={!isOnline}
          onRetry={() => {
            void dashboard.refetch();
          }}
        />
      ) : null}

      {dashboard.status === 'ready' || dashboard.status === 'empty' ? (
        <>
          <SettingsSectionHeader
            title="Steam"
            description="Connect your library for sync and playtime."
          />
          <SteamConnectForm
            connected={dashboard.steamConnected || steam !== null}
            displayName={displayName}
            verified={steam?.verified ?? dashboard.steamStatus?.integration?.verified ?? false}
            disabled={!isOnline}
            isOnline={isOnline}
          />

          <SettingsSectionHeader
            title="Connected"
            description="Providers linked to this account."
          />
          {dashboard.integrations.length === 0 ? (
            <SettingsEmptyState
              title="No integrations yet"
              description="Connect Steam or import a CSV to get started."
            />
          ) : (
            dashboard.integrations.map((integration) => (
              <IntegrationRow key={integration.id} integration={integration} disabled={!isOnline} />
            ))
          )}

          <SettingsSectionHeader
            title="CSV import"
            description="Import from SteamDB, Backloggd, and more."
          />
          <CsvImportPanel
            disabled={!isOnline}
            onImported={() => {
              void dashboard.refresh();
            }}
          />

          <SettingsSectionHeader title="Sync history" description="Recent import and sync jobs." />
          {dashboard.history.status === 'loading' ? <SettingsSkeleton /> : null}
          {dashboard.history.status === 'error' ? (
            <SettingsErrorState
              title={mapSettingsError(dashboard.history.error, isOnline).title}
              description={mapSettingsError(dashboard.history.error, isOnline).description}
              isOffline={!isOnline}
              onRetry={() => {
                void dashboard.refetch();
              }}
            />
          ) : null}
          {dashboard.history.status === 'empty' ? (
            <SettingsEmptyState
              title="No sync history"
              description="Syncs and imports will appear here."
            />
          ) : null}
          {dashboard.history.status === 'ready' ? (
            <SyncHistoryList items={dashboard.history.items} />
          ) : null}
        </>
      ) : null}
    </SettingsScreenChrome>
  );
}
