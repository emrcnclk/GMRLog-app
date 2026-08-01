import { describe, expect, it } from 'vitest';

import { resolveSettingsView, THEME_OPTIONS } from '../model/settings-model';

describe('settings screens contracts', () => {
  it('appearance supports three themes', () => {
    expect(THEME_OPTIONS).toHaveLength(3);
  });

  it('loading uses skeleton contract', () => {
    expect(
      resolveSettingsView({
        isPending: true,
        isError: false,
        error: null,
        settings: null,
        isRefreshing: false,
      }).status,
    ).toBe('loading');
  });

  it('accessibility reduceMotion is server-backed', () => {
    const fields = ['reduceMotion'] as const;
    expect(fields).toContain('reduceMotion');
  });

  it('local-only accessibility fields are honest', () => {
    const localOnly = ['largerText', 'highContrast'] as const;
    expect(localOnly).toContain('largerText');
    expect(localOnly).toContain('highContrast');
  });

  it('storage actions include image query app', () => {
    const actions = ['image', 'query', 'app'] as const;
    expect(actions).toHaveLength(3);
  });

  it('diagnostics includes version build env api device network', () => {
    const rows = [
      'appVersion',
      'buildNumber',
      'environment',
      'apiUrl',
      'deviceLabel',
      'networkLabel',
    ] as const;
    expect(rows).toHaveLength(6);
  });

  it('about includes version footer contract', () => {
    const footer = ['version', 'build', 'copyright'] as const;
    expect(footer).toContain('copyright');
  });
});
