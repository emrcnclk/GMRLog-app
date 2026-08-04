import { Button, ErrorBanner, useTheme } from '@gmrlog/ui';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';

import { useConnectivityStore } from '../../../src/state/stores';
import { AccentPreview } from '../components/accent-preview';
import { LanguageField } from '../components/language-field';
import { SettingsErrorState } from '../components/settings-error-state';
import { SettingsScreenChrome } from '../components/settings-screen-chrome';
import { SettingsSectionHeader } from '../components/settings-section-header';
import { SettingsSkeleton } from '../components/settings-skeleton';
import { ThemeSelector } from '../components/theme-selector';
import { usePatchAppearance, useSettings } from '../hooks/use-settings';
import { mapSettingsError } from '../model/settings-model';
import { appearanceFormSchema, toAppearancePatch } from '../validators/settings-form';

export function AppearanceSettingsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const isOnline = useConnectivityStore((s) => s.isOnline);
  const settings = useSettings();
  const patch = usePatchAppearance();
  const [localeDraft, setLocaleDraft] = useState('');
  const [banner, setBanner] = useState<{ title: string; description: string } | null>(null);
  const [localeError, setLocaleError] = useState<string | undefined>();

  useEffect(() => {
    if (settings.settings) {
      setLocaleDraft(settings.settings.appearance.locale ?? '');
    }
  }, [settings.settings]);

  const onBack = useCallback(() => {
    router.back();
  }, [router]);

  if (settings.status === 'loading') {
    return (
      <SettingsScreenChrome title="Appearance" backLabel="← General" onBack={onBack}>
        <SettingsSkeleton />
      </SettingsScreenChrome>
    );
  }

  if (settings.status === 'error') {
    const mapped = mapSettingsError(settings.error, isOnline);
    return (
      <SettingsScreenChrome title="Appearance" backLabel="← General" onBack={onBack}>
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
      <SettingsScreenChrome title="Appearance" backLabel="← General" onBack={onBack}>
        <SettingsErrorState
          title="Settings unavailable"
          description="Could not load appearance settings."
          onRetry={() => {
            void settings.refetch();
          }}
        />
      </SettingsScreenChrome>
    );
  }

  return (
    <SettingsScreenChrome title="Appearance" backLabel="← General" onBack={onBack}>
      {banner ? (
        <View style={{ paddingHorizontal: theme.space('space.4') }}>
          <ErrorBanner title={banner.title} description={banner.description} />
        </View>
      ) : null}

      <SettingsSectionHeader title="Theme" description="Light, Dark, or System." />
      <ThemeSelector
        value={current.appearance.theme}
        disabled={patch.isPending}
        onChange={(next) => {
          setBanner(null);
          patch.mutate(
            { theme: next },
            {
              onError: (error) => {
                setBanner(mapSettingsError(error, isOnline));
              },
            },
          );
        }}
      />

      <SettingsSectionHeader title="Accent" />
      <AccentPreview />

      <SettingsSectionHeader
        title="Language"
        description="Maps to appearance.locale via PATCH /settings/appearance."
      />
      <LanguageField
        value={localeDraft}
        disabled={patch.isPending}
        error={localeError}
        onChange={(value) => {
          setLocaleDraft(value);
          setLocaleError(undefined);
        }}
      />
      <View style={{ paddingHorizontal: theme.space('space.4') }}>
        <Button
          variant="primary"
          accessibilityLabel="Save language"
          disabled={patch.isPending}
          loading={patch.isPending}
          onPress={() => {
            setBanner(null);
            const parsed = appearanceFormSchema.safeParse({
              theme: current.appearance.theme,
              locale: localeDraft,
            });
            if (!parsed.success) {
              setLocaleError(parsed.error.issues[0]?.message ?? 'Invalid locale');
              return;
            }
            try {
              const body = toAppearancePatch(parsed.data);
              patch.mutate(body, {
                onError: (error) => {
                  setBanner(mapSettingsError(error, isOnline));
                },
              });
            } catch (error) {
              setBanner(mapSettingsError(error, isOnline));
            }
          }}
        >
          Save language
        </Button>
      </View>
    </SettingsScreenChrome>
  );
}
