import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { config as loadEnv } from 'dotenv';

/**
 * Load monorepo `.env` whether the process cwd is repo root or `apps/backend`.
 * Existing process env always wins (`override: false`).
 */
export function loadBackendDotenv(): void {
  const candidates = [
    resolve(process.cwd(), '.env'),
    resolve(process.cwd(), '../../.env'),
    resolve(__dirname, '../../../.env'),
  ];
  for (const file of candidates) {
    if (existsSync(file)) {
      loadEnv({ path: file, override: false, quiet: true });
    }
  }
}
