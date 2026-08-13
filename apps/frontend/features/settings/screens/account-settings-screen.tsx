import { useRouter } from 'expo-router';
import { useCallback } from 'react';

import { useAuthStore } from '../../../src/state/auth-store';
import { useConnectivityStore } from '../../../src/state/stores';
import { ActiveSessionCard } from '../components/active-session-card';
import { ConnectedAccountRow } from '../components/connected-account-row';
import { DeleteAccountPlaceholder } from '../components/delete-account-placeholder';
import { LogoutButton } from '../components/logout-button';
import { PrivacyPlaceholder } from '../components/privacy-placeholder';
import { ProfileShortcutRow } from '../components/profile-shortcut-row';
import { SettingsEmptyState } from '../components/settings-empty-state';
import { SettingsErrorState } from '../components/settings-error-state';
import { SettingsScreenChrome } from '../components/settings-screen-chrome';
import { SettingsSectionHeader } from '../components/settings-section-header';
import { SettingsSkeleton } from '../components/settings-skeleton';
import { SignInMethodsSection } from '../components/sign-in-methods-section';
import { useConnectedAccounts } from '../hooks/use-connected-accounts';
import { mapSettingsError } from '../model/settings-model';

export function AccountSettingsScreen() {
  const router = useRouter();
  const isOnline = useConnectivityStore((s) => s.isOnline);
  const user = useAuthStore((s) => s.user);
  const accounts = useConnectedAccounts();

  const onBack = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <SettingsScreenChrome title="Account" backLabel="← Settings" onBack={onBack}>
      <SettingsSectionHeader title="Profile" />
      <ProfileShortcutRow
        handle={user?.handle ?? 'you'}
        onPress={() => {
          router.push('/(app)/(tabs)/profile');
        }}
      />

      <SignInMethodsSection />

      <SettingsSectionHeader title="Connected accounts" description="GET /connected-accounts" />
      {accounts.status === 'loading' ? <SettingsSkeleton /> : null}
      {accounts.status === 'error' ? (
        <SettingsErrorState
          title={mapSettingsError(accounts.error, isOnline).title}
          description={mapSettingsError(accounts.error, isOnline).description}
          isOffline={!isOnline}
          onRetry={() => {
            void accounts.refetch();
          }}
        />
      ) : null}
      {accounts.status === 'empty' ? (
        <SettingsEmptyState
          title="No connected accounts"
          description="Steam and Discord links will appear here when connected."
        />
      ) : null}
      {accounts.status === 'ready'
        ? accounts.items.map((account) => (
            <ConnectedAccountRow key={account.provider} account={account} />
          ))
        : null}

      <SettingsSectionHeader title="Session" />
      <ActiveSessionCard user={user} />
      <LogoutButton />

      <SettingsSectionHeader title="Danger zone" />
      <DeleteAccountPlaceholder />
      <PrivacyPlaceholder />
    </SettingsScreenChrome>
  );
}
