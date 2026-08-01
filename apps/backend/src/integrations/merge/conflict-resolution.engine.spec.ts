import { describe, expect, it } from 'vitest';

import {
  defaultResolutionForField,
  hasPlaytimeConflict,
  hasStatusConflict,
  mapImportItemResolution,
  resolveConflictField,
  resolveUnattendedMerge,
} from './conflict-resolution.engine';

const local = {
  status: 'playing',
  updatedAt: new Date('2026-06-01T00:00:00.000Z'),
  playtimeMin: 100,
};

const remote = {
  status: 'completed',
  lastPlayedAt: new Date('2026-07-01T00:00:00.000Z'),
  playtimeMin: 500,
};

describe('defaultResolutionForField', () => {
  it('defaults playtime to newest_wins and status to keep_local', () => {
    expect(defaultResolutionForField('playtime')).toBe('newest_wins');
    expect(defaultResolutionForField('status')).toBe('keep_local');
  });
});

describe('conflict detection', () => {
  it('detects status divergence', () => {
    expect(hasStatusConflict(local, remote)).toBe(true);
    expect(hasStatusConflict(local, { status: 'playing' })).toBe(false);
    expect(hasStatusConflict(local, { status: null })).toBe(false);
  });

  it('detects playtime divergence', () => {
    expect(hasPlaytimeConflict(local, remote)).toBe(true);
    expect(hasPlaytimeConflict(local, { playtimeMin: 100 })).toBe(false);
    expect(hasPlaytimeConflict({ ...local, playtimeMin: null }, remote)).toBe(true);
  });
});

describe('resolveConflictField', () => {
  it('keep_local preserves shelf status', () => {
    const result = resolveConflictField('keep_local', local, remote, 'status');
    expect(result.winner).toBe('local');
    expect(result.chosenStatus).toBe('playing');
  });

  it('keep_steam prefers remote status and playtime', () => {
    const status = resolveConflictField('keep_steam', local, remote, 'status');
    const playtime = resolveConflictField('keep_steam', local, remote, 'playtime');
    expect(status.winner).toBe('remote');
    expect(status.chosenStatus).toBe('completed');
    expect(playtime.chosenPlaytimeMin).toBe(500);
  });

  it('newest_wins picks remote when lastPlayedAt is newer', () => {
    const result = resolveConflictField('newest_wins', local, remote, 'status');
    expect(result.winner).toBe('remote');
  });

  it('newest_wins picks local when remote has no timestamp', () => {
    const result = resolveConflictField(
      'newest_wins',
      local,
      { status: 'completed', playtimeMin: 500 },
      'status',
    );
    expect(result.winner).toBe('local');
  });

  it('newest_wins picks local when remote is older', () => {
    const result = resolveConflictField(
      'newest_wins',
      local,
      {
        status: 'completed',
        lastPlayedAt: new Date('2026-05-01T00:00:00.000Z'),
        playtimeMin: 500,
      },
      'playtime',
    );
    expect(result.winner).toBe('local');
    expect(result.chosenPlaytimeMin).toBe(100);
  });

  it('keep_local preserves playtime', () => {
    const result = resolveConflictField('keep_local', local, remote, 'playtime');
    expect(result.chosenPlaytimeMin).toBe(100);
  });

  it('ask_user parks the conflict', () => {
    const result = resolveConflictField('ask_user', local, remote, 'playtime');
    expect(result.winner).toBe('ask_user');
  });
});

describe('resolveUnattendedMerge', () => {
  it('applies documented unattended defaults', () => {
    const merge = resolveUnattendedMerge(local, remote);
    expect(merge.status.resolution).toBe('keep_local');
    expect(merge.status.winner).toBe('local');
    expect(merge.playtime.resolution).toBe('newest_wins');
    expect(merge.playtime.winner).toBe('remote');
  });
});

describe('mapImportItemResolution', () => {
  it('maps S1 resolutions onto D3.23 actions', () => {
    expect(mapImportItemResolution('keep_manual')).toBe('keep_local');
    expect(mapImportItemResolution('accept_import')).toBe('keep_steam');
    expect(mapImportItemResolution('skip')).toBeNull();
  });
});
