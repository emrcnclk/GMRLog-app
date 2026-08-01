/**
 * Deterministic CSV import parsers (D3.23 / CSV_IMPORT.md).
 * Formats: steamdb · backloggd · backloggery · rawg · ign · generic.
 */

export type CsvImportFormat = 'steamdb' | 'backloggd' | 'backloggery' | 'rawg' | 'ign' | 'generic';

export interface CsvImportRow {
  title: string;
  status?: string;
  playtimeMin?: number;
}

export interface CsvParseResult {
  format: CsvImportFormat;
  rows: CsvImportRow[];
  columns: string[];
  sample: Record<string, string>[];
}

export class CsvParseError extends Error {
  readonly code = 'invalid_csv';

  constructor(message: string) {
    super(message);
    this.name = 'CsvParseError';
  }
}

const FORMAT_HEADER_HINTS: Record<CsvImportFormat, string[]> = {
  steamdb: ['game', 'steam id', 'hours', 'last played', 'appid', 'playtime forever', 'title'],
  backloggd: ['title', 'status', 'rating', 'hours'],
  backloggery: ['game', 'platform', 'status', 'hours played', 'finished'],
  rawg: ['name', 'playtime', 'status', 'metacritic'],
  ign: ['game title', 'progress', 'hours played', 'score'],
  generic: ['title', 'status', 'playtimemin'],
};

export function detectCsvFormat(headers: string[]): CsvImportFormat {
  const normalized = headers.map(normalizeHeader);
  if (normalized.includes('appid') || normalized.includes('playtime forever')) {
    return 'steamdb';
  }
  if (normalized.includes('finished') && !normalized.includes('rating')) {
    return 'backloggery';
  }
  if (normalized.includes('score') && normalized.includes('platform')) {
    return 'ign';
  }
  if (normalized.includes('metacritic')) {
    return 'rawg';
  }
  if (normalized.includes('rating') && normalized.includes('platform')) {
    return 'backloggd';
  }
  const scores = (Object.keys(FORMAT_HEADER_HINTS) as CsvImportFormat[]).map((format) => {
    const hints = FORMAT_HEADER_HINTS[format];
    const hits = hints.filter((hint) => normalized.includes(hint)).length;
    return { format, hits, ratio: hits / hints.length };
  });
  scores.sort((a, b) => b.hits - a.hits || b.ratio - a.ratio);
  const best = scores[0];
  if (best === undefined || best.hits === 0) {
    return 'generic';
  }
  return best.format;
}

export function parseCsvImport(csv: string, formatHint?: CsvImportFormat): CsvParseResult {
  const table = parseCsvTable(csv);
  if (table.headers.length === 0) {
    throw new CsvParseError('CSV has no header row');
  }

  const format = formatHint ?? detectCsvFormat(table.headers);
  const rows = table.records
    .map((record) => mapRecordToRow(format, record, table.headers))
    .filter((row): row is CsvImportRow => row !== null);

  const sample = table.records.slice(0, 5).map((record) => {
    const out: Record<string, string> = {};
    for (const header of table.headers) {
      out[header] = record[normalizeHeader(header)] ?? '';
    }
    return out;
  });

  return {
    format,
    rows,
    columns: table.headers,
    sample,
  };
}

function mapRecordToRow(
  format: CsvImportFormat,
  record: Record<string, string>,
  headers: string[],
): CsvImportRow | null {
  const get = (...keys: string[]): string => {
    for (const key of keys) {
      const value = record[normalizeHeader(key)];
      if (value !== undefined && value.trim() !== '') {
        return value.trim();
      }
    }
    // fuzzy: first header containing key fragment
    for (const key of keys) {
      const fragment = normalizeHeader(key);
      const header = headers.find((h) => normalizeHeader(h).includes(fragment));
      if (header !== undefined) {
        const value = record[normalizeHeader(header)];
        if (value !== undefined && value.trim() !== '') {
          return value.trim();
        }
      }
    }
    return '';
  };

  let title = '';
  let status: string | undefined;
  let playtimeMin: number | undefined;

  switch (format) {
    case 'steamdb':
      title = get('Game', 'Name', 'Title');
      {
        const forever = get('playtime forever', 'playtime_forever');
        if (forever !== '') {
          playtimeMin = parseNonNegativeNumber(forever);
        } else {
          playtimeMin = hoursToMinutes(get('Hours', 'Playtime', 'Hours Played'));
        }
      }
      break;
    case 'backloggd':
      title = get('Title', 'Game', 'Name');
      status = normalizeStatus(get('Status'));
      playtimeMin = hoursToMinutes(get('Hours', 'Playtime'));
      break;
    case 'backloggery':
      title = get('Game', 'Title', 'Name');
      status = normalizeStatus(get('Status'));
      playtimeMin = hoursToMinutes(get('Hours Played', 'Hours', 'Playtime'));
      break;
    case 'rawg':
      title = get('name', 'title', 'game');
      status = normalizeStatus(get('status'));
      playtimeMin = hoursToMinutes(get('playtime', 'hours'));
      break;
    case 'ign':
      title = get('Game Title', 'Title', 'Game', 'Name');
      status = normalizeStatus(get('Progress', 'Status'));
      playtimeMin = hoursToMinutes(get('Hours Played', 'Hours'));
      break;
    case 'generic':
    default:
      title = get('title', 'game', 'name', 'game title');
      status = normalizeStatus(get('status', 'progress'));
      {
        const directMin = get('playtimeMin', 'playtime_min');
        if (directMin !== '') {
          playtimeMin = parseNonNegativeNumber(directMin);
        } else {
          playtimeMin = hoursToMinutes(get('playtime', 'hours', 'hours played'));
        }
      }
      break;
  }

  if (title === '') {
    return null;
  }

  const row: CsvImportRow = { title };
  if (status !== undefined && status !== '') {
    row.status = status;
  }
  if (playtimeMin !== undefined) {
    row.playtimeMin = playtimeMin;
  }
  return row;
}

interface CsvTable {
  headers: string[];
  records: Record<string, string>[];
}

function parseCsvTable(csv: string): CsvTable {
  const lines = splitCsvLines(csv);
  if (lines.length === 0) {
    return { headers: [], records: [] };
  }

  const headers = parseCsvLine(lines[0] ?? '');
  const records: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (line === undefined || line.trim() === '') {
      continue;
    }
    const cells = parseCsvLine(line);
    const record: Record<string, string> = {};
    for (let c = 0; c < headers.length; c += 1) {
      const header = headers[c] ?? `col_${String(c)}`;
      record[normalizeHeader(header)] = cells[c] ?? '';
    }
    records.push(record);
  }

  return { headers, records };
}

function splitCsvLines(csv: string): string[] {
  const normalized = csv
    .replace(/^\uFEFF/, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');
  const lines: string[] = [];
  let current = '';
  let inQuotes = false;

  for (const ch of normalized) {
    if (ch === '"') {
      inQuotes = !inQuotes;
      current += ch;
      continue;
    }
    if (ch === '\n' && !inQuotes) {
      lines.push(current);
      current = '';
      continue;
    }
    current += ch;
  }
  if (current.length > 0) {
    lines.push(current);
  }
  return lines;
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i] ?? '';
    if (ch === '"') {
      const next = line[i + 1];
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
        continue;
      }
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === ',' && !inQuotes) {
      cells.push(current.trim());
      current = '';
      continue;
    }
    current += ch;
  }
  cells.push(current.trim());
  return cells;
}

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/[_]+/g, ' ').replace(/\s+/g, ' ');
}

function hoursToMinutes(raw: string): number | undefined {
  if (raw === '') {
    return undefined;
  }
  const hours = parseNonNegativeNumber(raw);
  if (hours === undefined) {
    return undefined;
  }
  return Math.round(hours * 60);
}

function parseNonNegativeNumber(raw: string): number | undefined {
  const cleaned = raw.replace(/,/g, '').trim();
  if (cleaned === '') {
    return undefined;
  }
  const value = Number(cleaned);
  if (!Number.isFinite(value) || value < 0) {
    return undefined;
  }
  return value;
}

function normalizeStatus(raw: string): string | undefined {
  if (raw === '') {
    return undefined;
  }
  const key = raw.trim().toLowerCase().replace(/\s+/g, '_');
  const map: Record<string, string> = {
    owned: 'owned',
    playing: 'playing',
    in_progress: 'playing',
    completed: 'completed',
    beaten: 'completed',
    finished: 'completed',
    wishlist: 'wishlist',
    want_to_play: 'wishlist',
    backlog: 'backlog',
    abandoned: 'dropped',
    dropped: 'dropped',
    unfinished: 'backlog',
    hidden: 'hidden',
  };
  return map[key] ?? key;
}
