import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

interface EasBuildFile {
  build: {
    development: { channel: string; env?: { APP_ENV?: string } };
    preview: { channel: string };
    production: {
      channel: string;
      env?: { APP_ENV?: string };
      android?: { buildType?: string };
    };
  };
}

describe('release configuration', () => {
  const eas = JSON.parse(readFileSync(join(__dirname, '../../eas.json'), 'utf8')) as EasBuildFile;

  it('defines development, preview, and production EAS profiles', () => {
    expect(eas.build.development.channel).toBe('development');
    expect(eas.build.preview.channel).toBe('preview');
    expect(eas.build.production.channel).toBe('production');
  });

  it('maps production env to APP_ENV=production', () => {
    expect(eas.build.production.env?.APP_ENV).toBe('production');
    expect(eas.build.production.android?.buildType).toBe('app-bundle');
  });
});
