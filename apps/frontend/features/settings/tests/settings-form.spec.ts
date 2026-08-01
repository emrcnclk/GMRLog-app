import { describe, expect, it } from 'vitest';

import {
  appearanceFormSchema,
  DEFAULT_LOCAL_UI_PREFS,
  localUiPrefsSchema,
  toAppearancePatch,
} from '../validators/settings-form';

describe('settings form validation', () => {
  it('accepts valid theme and locale', () => {
    const values = appearanceFormSchema.parse({ theme: 'dark', locale: 'en-US' });
    expect(toAppearancePatch(values)).toEqual({ theme: 'dark', locale: 'en-US' });
  });

  it('clears empty locale to null', () => {
    const values = appearanceFormSchema.parse({ theme: 'light', locale: '' });
    expect(toAppearancePatch(values).locale).toBeNull();
  });

  it('rejects locale of length 1', () => {
    expect(() => appearanceFormSchema.parse({ theme: 'system', locale: 'e' })).toThrow();
  });

  it('rejects unknown theme', () => {
    expect(() => appearanceFormSchema.parse({ theme: 'neon', locale: 'en' })).toThrow();
  });

  it('rejects locale over 35 chars', () => {
    expect(() => appearanceFormSchema.parse({ theme: 'light', locale: 'x'.repeat(36) })).toThrow();
  });

  it('validates local ui prefs defaults', () => {
    expect(localUiPrefsSchema.parse(DEFAULT_LOCAL_UI_PREFS)).toEqual(DEFAULT_LOCAL_UI_PREFS);
  });

  it('rejects invalid date format', () => {
    expect(() =>
      localUiPrefsSchema.parse({
        ...DEFAULT_LOCAL_UI_PREFS,
        dateFormat: 'iso8601',
      }),
    ).toThrow();
  });

  it('accepts region codes', () => {
    expect(
      localUiPrefsSchema.parse({
        ...DEFAULT_LOCAL_UI_PREFS,
        region: 'TR',
      }).region,
    ).toBe('TR');
  });
});
