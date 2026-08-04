import { ErrorBanner, SCREEN_GUTTER, Section, useTheme } from '@gmrlog/ui';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { View } from 'react-native';

import { useConnectivityStore } from '../../../src/state/stores';
import { HighContrastToggle } from '../components/high-contrast-toggle';
import { LargerTextToggle } from '../components/larger-text-toggle';
import { ReduceMotionToggle } from '../components/reduce-motion-toggle';
import { SettingsErrorState } from '../components/settings-error-state';
import { SettingsGroupCard } from '../components/settings-group-card';
import { SettingsScreenChrome } from '../components/settings-screen-chrome';
import { SettingsSkeleton } from '../components/settings-skeleton';
import { usePatchAccessibility, useSettings } from '../hooks/use-settings';
import { mapSettingsError } from '../model/settings-model';
import { useLocalUiPrefsStore } from '../storage/local-ui-prefs-store';

export function AccessibilitySettingsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const isOnline = useConnectivityStore((s) => s.isOnline);
  const settings = useSettings();
  const patch = usePatchAccessibility();
  const largerText = useLocalUiPrefsStore((s) => s.largerText);
  const setLargerText = useLocalUiPrefsStore((s) => s.setLargerText);
  const highContrast = useLocalUiPrefsStore((s) => s.highContrast);
  const setHighContrast = useLocalUiPrefsStore((s) => s.setHighContrast);
  const [banner, setBanner] = useState<{ title: string; description: string } | null>(null);

  const onBack = useCallback(() => {
    router.back();
  }, [router]);

  if (settings.status === 'loading') {
    return (
      <SettingsScreenChrome title="Accessibility" backLabel="← General" onBack={onBack}>
        <SettingsSkeleton />
      </SettingsScreenChrome>
    );
  }

  if (settings.status === 'error') {
    const mapped = mapSettingsError(settings.error, isOnline);
    return (
      <SettingsScreenChrome title="Accessibility" backLabel="← General" onBack={onBack}>
        <SettingsErrorState
          title={mapped.title}
          description={mapped.description}
          isOffline={!isOnline}
          onRetry={() => {
            void settings.refetch();
          }}
        />
      </SettingsScreenChrome>
    );
  }

  const current = settings.settings;
  if (!current) {
    return (
      <SettingsScreenChrome title="Accessibility" backLabel="← General" onBack={onBack}>
        <SettingsErrorState
          title="Settings unavailable"
          description="Could not load accessibility settings."
          onRetry={() => {
            void settings.refetch();
          }}
        />
      </SettingsScreenChrome>
    );
  }

  return (
    <SettingsScreenChrome title="Accessibility" backLabel="← General" onBack={onBack}>
      {banner ? (
        <View style={{ paddingHorizontal: theme.space('space.4') }}>
          <ErrorBanner title={banner.title} description={banner.description} />
        </View>
      ) : null}

      <Section
        title="Motion"
        description="Synced with the server."
        style={{ paddingHorizontal: theme.space(SCREEN_GUTTER) }}
      >
        <SettingsGroupCard>
          <ReduceMotionToggle
            value={current.accessibility.reduceMotion}
            disabled={patch.isPending}
            onChange={(value) => {
              setBanner(null);
              patch.mutate(
                { reduceMotion: value },
                {
                  onError: (error) => {
                    setBanner(mapSettingsError(error, isOnline));
                  },
                },
              );
            }}
          />
        </SettingsGroupCard>
      </Section>

      <Section
        title="Display"
        description="Local preferences only."
        style={{ paddingHorizontal: theme.space(SCREEN_GUTTER) }}
      >
        <SettingsGroupCard>
          <LargerTextToggle value={largerText} onChange={setLargerText} />
          <HighContrastToggle value={highContrast} onChange={setHighContrast} />
        </SettingsGroupCard>
      </Section>
    </SettingsScreenChrome>
  );
}
