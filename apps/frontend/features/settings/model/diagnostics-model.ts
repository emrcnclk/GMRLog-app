export interface DiagnosticsSnapshot {
  appVersion: string;
  buildNumber: string;
  environment: string;
  apiUrl: string;
  deviceLabel: string;
  networkLabel: string;
  featureFlags: readonly FeatureFlagRow[];
  showDebug: boolean;
}

export interface FeatureFlagRow {
  id: string;
  label: string;
  enabled: boolean;
  source: 'local' | 'env';
}

export interface DiagnosticsInput {
  appVersion: string;
  buildNumber: string;
  environment: string;
  apiUrl: string;
  platform: string;
  isOnline: boolean;
  networkType?: string | null;
}

/** Read-only local flags — never invent remote flag endpoints. */
export const LOCAL_FEATURE_FLAGS: readonly FeatureFlagRow[] = [
  { id: 'settings_hub', label: 'Settings hub', enabled: true, source: 'local' },
  { id: 'upload_foundation', label: 'Upload foundation', enabled: true, source: 'local' },
  { id: 'events_participation', label: 'Event participation', enabled: true, source: 'local' },
  {
    id: 'notification_preferences',
    label: 'Notification preferences API',
    enabled: false,
    source: 'local',
  },
] as const;

export function buildDiagnostics(input: DiagnosticsInput): DiagnosticsSnapshot {
  const showDebug = input.environment !== 'production';
  const networkLabel = input.isOnline
    ? `Online${input.networkType ? ` · ${input.networkType}` : ''}`
    : 'Offline';
  return {
    appVersion: input.appVersion,
    buildNumber: input.buildNumber,
    environment: input.environment,
    apiUrl: input.apiUrl,
    deviceLabel: input.platform,
    networkLabel,
    featureFlags: LOCAL_FEATURE_FLAGS,
    showDebug,
  };
}

export function diagnosticsRowOrder(): readonly (keyof Omit<
  DiagnosticsSnapshot,
  'featureFlags' | 'showDebug'
>)[] {
  return ['appVersion', 'buildNumber', 'environment', 'apiUrl', 'deviceLabel', 'networkLabel'];
}
