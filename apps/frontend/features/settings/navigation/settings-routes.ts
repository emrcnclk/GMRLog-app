/** Nested settings routes under `app/(settings)`. */
export const SETTINGS_ROUTES = {
  hub: '/(settings)',
  general: '/(settings)/general',
  appearance: '/(settings)/appearance',
  accessibility: '/(settings)/accessibility',
  account: '/(settings)/account',
  integrations: '/(settings)/integrations',
  notifications: '/(settings)/notifications',
  storage: '/(settings)/storage',
  diagnostics: '/(settings)/diagnostics',
  about: '/(settings)/about',
} as const;

export type SettingsRouteKey = keyof typeof SETTINGS_ROUTES;

export const SETTINGS_HUB_NAV: readonly {
  key: Exclude<SettingsRouteKey, 'hub' | 'appearance' | 'accessibility'>;
  title: string;
  subtitle: string;
  href: string;
}[] = [
  {
    key: 'general',
    title: 'General',
    subtitle: 'Appearance, accessibility, region',
    href: SETTINGS_ROUTES.general,
  },
  {
    key: 'account',
    title: 'Account',
    subtitle: 'Profile, sessions, connected accounts',
    href: SETTINGS_ROUTES.account,
  },
  {
    key: 'integrations',
    title: 'Integrations',
    subtitle: 'Steam, sync, CSV import',
    href: SETTINGS_ROUTES.integrations,
  },
  {
    key: 'notifications',
    title: 'Notifications',
    subtitle: 'Attention preferences',
    href: SETTINGS_ROUTES.notifications,
  },
  {
    key: 'storage',
    title: 'Storage',
    subtitle: 'Caches and local data',
    href: SETTINGS_ROUTES.storage,
  },
  {
    key: 'diagnostics',
    title: 'Diagnostics',
    subtitle: 'Version, environment, network',
    href: SETTINGS_ROUTES.diagnostics,
  },
  {
    key: 'about',
    title: 'About',
    subtitle: 'Legal, contact, version',
    href: SETTINGS_ROUTES.about,
  },
] as const;

export const GENERAL_SUBNAV: readonly {
  key: 'appearance' | 'accessibility';
  title: string;
  subtitle: string;
  href: string;
}[] = [
  {
    key: 'appearance',
    title: 'Appearance',
    subtitle: 'Theme, accent, language',
    href: SETTINGS_ROUTES.appearance,
  },
  {
    key: 'accessibility',
    title: 'Accessibility',
    subtitle: 'Motion, text size, contrast',
    href: SETTINGS_ROUTES.accessibility,
  },
] as const;

export function settingsHref(key: SettingsRouteKey): string {
  return SETTINGS_ROUTES[key];
}
