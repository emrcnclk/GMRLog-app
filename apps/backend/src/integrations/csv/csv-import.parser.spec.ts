import { describe, expect, it } from 'vitest';

import { detectCsvFormat, parseCsvImport } from './csv-import.parser';

const STEAMDB = `Game,Steam ID,Last Played,Hours
Hades,1145360,2024-01-01,12.5
Portal 2,620,2023-01-01,4`;

const BACKLOGGD = `Title,Status,Rating,Hours
Hades,Completed,5,20
Celeste,Playing,4,8`;

const BACKLOGGERY = `Game,Platform,Status,Hours Played
Hades,PC,Completed,20
Hollow Knight,PC,Unfinished,15`;

const RAWG = `name,playtime,status
Hades,20,completed
Outer Wilds,30,wishlist`;

const IGN = `Game Title,Progress,Hours Played
Hades,Completed,15
"Disco Elysium",Beaten,40`;

const GENERIC = `title,status,playtimeMin
Hades,completed,900
Celeste,playing,480`;

describe('detectCsvFormat', () => {
  it('detects steamdb headers', () => {
    expect(detectCsvFormat(['Game', 'Steam ID', 'Hours', 'Last Played'])).toBe('steamdb');
  });

  it('detects backloggd headers', () => {
    expect(detectCsvFormat(['Title', 'Status', 'Rating', 'Hours'])).toBe('backloggd');
  });

  it('falls back to generic when unknown', () => {
    expect(detectCsvFormat(['foo', 'bar'])).toBe('generic');
  });
});

describe('parseCsvImport formats', () => {
  it('parses steamdb sample', () => {
    const result = parseCsvImport(STEAMDB);
    expect(result.format).toBe('steamdb');
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]).toMatchObject({ title: 'Hades', playtimeMin: 750 });
  });

  it('parses backloggd sample', () => {
    const result = parseCsvImport(BACKLOGGD);
    expect(result.format).toBe('backloggd');
    expect(result.rows[0]).toMatchObject({
      title: 'Hades',
      status: 'completed',
      playtimeMin: 1200,
    });
  });

  it('parses backloggery sample', () => {
    const result = parseCsvImport(BACKLOGGERY);
    expect(result.format).toBe('backloggery');
    expect(result.rows[1]).toMatchObject({ title: 'Hollow Knight', status: 'backlog' });
  });

  it('parses rawg sample', () => {
    const result = parseCsvImport(RAWG);
    expect(result.format).toBe('rawg');
    expect(result.rows[1]).toMatchObject({ title: 'Outer Wilds', status: 'wishlist' });
  });

  it('parses ign sample with quoted titles', () => {
    const result = parseCsvImport(IGN);
    expect(result.format).toBe('ign');
    expect(result.rows[1]).toMatchObject({ title: 'Disco Elysium', status: 'completed' });
  });

  it('parses generic sample with playtimeMin', () => {
    const result = parseCsvImport(GENERIC, 'generic');
    expect(result.format).toBe('generic');
    expect(result.rows[0]).toEqual({
      title: 'Hades',
      status: 'completed',
      playtimeMin: 900,
    });
  });

  it('honors explicit format hint over detection', () => {
    const result = parseCsvImport(GENERIC, 'generic');
    expect(result.format).toBe('generic');
    expect(result.columns).toContain('title');
  });

  it('skips blank title rows', () => {
    const csv = `title,status\n,owned\nHades,owned`;
    const result = parseCsvImport(csv, 'generic');
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]?.title).toBe('Hades');
  });

  it('returns sample preview rows', () => {
    const result = parseCsvImport(STEAMDB);
    expect(result.sample.length).toBeGreaterThan(0);
    expect(result.sample[0]).toHaveProperty('Game');
  });

  it('detects ign and rawg headers', () => {
    expect(detectCsvFormat(['Game Title', 'Progress', 'Hours Played'])).toBe('ign');
    expect(detectCsvFormat(['name', 'playtime', 'status'])).toBe('rawg');
  });

  it('normalizes abandoned status to dropped', () => {
    const csv = 'title,status\nHades,Abandoned\n';
    const result = parseCsvImport(csv, 'generic');
    expect(result.rows[0]?.status).toBe('dropped');
  });
});
