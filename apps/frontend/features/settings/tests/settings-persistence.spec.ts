import { beforeEach, describe, expect, it } from 'vitest';

import { useLocalUiPrefsStore } from '../storage/local-ui-prefs-store';
import { DEFAULT_LOCAL_UI_PREFS } from '../validators/settings-form';

describe('local ui prefs persistence store', () => {
  beforeEach(() => {
    useLocalUiPrefsStore.getState().reset();
  });

  it('starts from defaults', () => {
    expect(useLocalUiPrefsStore.getState().largerText).toBe(DEFAULT_LOCAL_UI_PREFS.largerText);
    expect(useLocalUiPrefsStore.getState().highContrast).toBe(DEFAULT_LOCAL_UI_PREFS.highContrast);
    expect(useLocalUiPrefsStore.getState().dateFormat).toBe('system');
    expect(useLocalUiPrefsStore.getState().region).toBeNull();
  });

  it('persists larger text toggle', () => {
    useLocalUiPrefsStore.getState().setLargerText(true);
    expect(useLocalUiPrefsStore.getState().largerText).toBe(true);
  });

  it('persists high contrast toggle', () => {
    useLocalUiPrefsStore.getState().setHighContrast(true);
    expect(useLocalUiPrefsStore.getState().highContrast).toBe(true);
  });

  it('persists date format and region', () => {
    useLocalUiPrefsStore.getState().setDateFormat('dmy');
    useLocalUiPrefsStore.getState().setRegion('TR');
    expect(useLocalUiPrefsStore.getState().dateFormat).toBe('dmy');
    expect(useLocalUiPrefsStore.getState().region).toBe('TR');
  });

  it('resets to defaults', () => {
    useLocalUiPrefsStore.getState().setLargerText(true);
    useLocalUiPrefsStore.getState().setRegion('US');
    useLocalUiPrefsStore.getState().reset();
    expect(useLocalUiPrefsStore.getState()).toMatchObject(DEFAULT_LOCAL_UI_PREFS);
  });
});
