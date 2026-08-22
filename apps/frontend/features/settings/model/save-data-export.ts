import type { DataExportResponse } from '@gmrlog/types';
import { Platform } from 'react-native';

const FILE_NAME_PREFIX = 'gmrlog-data-export';

function fileName(exportedAt: string): string {
  return `${FILE_NAME_PREFIX}-${exportedAt.slice(0, 10)}.json`;
}

function saveOnWeb(json: string, name: string): void {
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/**
 * Native (iOS/Android) save-and-share, isolated behind its own function so
 * `saveDataExport` never statically imports `expo-file-system`/`expo-sharing`
 * — the same lazy-`require` trick `expo-secure-storage.ts` uses to keep those
 * native-only modules out of the web bundle entirely.
 */
async function saveOnNative(json: string, name: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const FileSystem = require('expo-file-system') as typeof import('expo-file-system');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Sharing = require('expo-sharing') as typeof import('expo-sharing');

  const path = `${FileSystem.cacheDirectory ?? FileSystem.documentDirectory ?? ''}${name}`;
  await FileSystem.writeAsStringAsync(path, json, { encoding: FileSystem.EncodingType.UTF8 });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(path, { mimeType: 'application/json', dialogTitle: name });
  }
}

/**
 * 12.5 — hands the player their export as an actual file rather than a
 * screen full of JSON. Web triggers the browser's own download; native
 * writes to the app's cache directory and opens the share sheet, since
 * there is no native "Downloads" folder GMRLog can write to directly.
 */
export async function saveDataExport(response: DataExportResponse): Promise<void> {
  const json = JSON.stringify(response, null, 2);
  const name = fileName(response.exportedAt);

  if (Platform.OS === 'web') {
    saveOnWeb(json, name);
    return;
  }

  await saveOnNative(json, name);
}
