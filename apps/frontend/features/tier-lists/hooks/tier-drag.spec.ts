import { describe, expect, it } from 'vitest';

import { resolveDropZone, type DropZoneLayout } from './tier-drag';

describe('tier drag geometry', () => {
  const zones: DropZoneLayout[] = [
    { label: 'S', y: 100, height: 66 },
    { label: 'A', y: 166, height: 66 },
    { label: 'Unranked', y: 400, height: 60 },
  ];

  it('resolves the zone a point falls inside', () => {
    expect(resolveDropZone(zones, 120)).toBe('S');
    expect(resolveDropZone(zones, 166)).toBe('A');
    expect(resolveDropZone(zones, 231)).toBe('A');
    expect(resolveDropZone(zones, 420)).toBe('Unranked');
  });

  it('returns null between zones and outside every zone', () => {
    expect(resolveDropZone(zones, 240)).toBeNull();
    expect(resolveDropZone(zones, 0)).toBeNull();
    expect(resolveDropZone(zones, 5000)).toBeNull();
  });

  it('returns null with no zones measured yet', () => {
    expect(resolveDropZone([], 100)).toBeNull();
  });
});
