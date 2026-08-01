import { describe, expect, it } from 'vitest';

import {
  buildDiagnostics,
  diagnosticsRowOrder,
  LOCAL_FEATURE_FLAGS,
} from '../model/diagnostics-model';

describe('settings diagnostics', () => {
  it('builds diagnostics snapshot', () => {
    const snap = buildDiagnostics({
      appVersion: '0.0.0',
      buildNumber: '1',
      environment: 'development',
      apiUrl: 'http://localhost:4000/api/v1',
      platform: 'ios 18',
      isOnline: true,
      networkType: 'wifi',
    });
    expect(snap.appVersion).toBe('0.0.0');
    expect(snap.networkLabel).toContain('Online');
    expect(snap.networkLabel).toContain('wifi');
    expect(snap.showDebug).toBe(true);
  });

  it('hides debug in production', () => {
    const snap = buildDiagnostics({
      appVersion: '1.0.0',
      buildNumber: '99',
      environment: 'production',
      apiUrl: 'https://api.gmrlog.com/api/v1',
      platform: 'android 34',
      isOnline: false,
    });
    expect(snap.showDebug).toBe(false);
    expect(snap.networkLabel).toBe('Offline');
  });

  it('exposes read-only feature flags', () => {
    expect(LOCAL_FEATURE_FLAGS.some((f) => f.id === 'notification_preferences' && !f.enabled)).toBe(
      true,
    );
    expect(LOCAL_FEATURE_FLAGS.every((f) => f.source === 'local')).toBe(true);
  });

  it('keeps diagnostics row order stable', () => {
    expect(diagnosticsRowOrder()).toEqual([
      'appVersion',
      'buildNumber',
      'environment',
      'apiUrl',
      'deviceLabel',
      'networkLabel',
    ]);
  });

  it('includes feature flags on snapshot', () => {
    const snap = buildDiagnostics({
      appVersion: '0.0.0',
      buildNumber: '0',
      environment: 'staging',
      apiUrl: 'https://staging.example/api/v1',
      platform: 'web',
      isOnline: true,
    });
    expect(snap.featureFlags.length).toBeGreaterThan(0);
    expect(snap.showDebug).toBe(true);
  });
});
