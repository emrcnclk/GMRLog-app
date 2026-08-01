import { defineConfig } from 'vitest/config';

const coverageDir =
  process.env.GMRLOG_COVERAGE_DIR ??
  `C:/Temp/gmrlog-backend-coverage-${String(process.pid)}-${String(Date.now())}`;

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    fileParallelism: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      // Unique per process — concurrent vitest runs must not share reportsDirectory.
      reportsDirectory: coverageDir,
      clean: true,
      reportOnFailure: true,
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.spec.ts',
        'src/**/testing/**',
        'src/main.ts',
        'src/worker.main.ts',
        'src/infrastructure/database/prisma.service.ts',
        'src/**/*.module.ts',
        'src/**/*.controller.ts',
        'src/**/dto/**',
        'src/**/*.bootstrap.ts',
        'src/**/*.definitions.ts',
        'src/infrastructure/openapi/**',
        'src/infrastructure/realtime/**',
        'src/infrastructure/storage/s3-object-storage.ts',
        'src/infrastructure/email/smtp-email.service.ts',
        // Job processors / fan-out transport — exercised via integration smoke, not unit coverage.
        'src/infrastructure/jobs/processors/**',
        'src/infrastructure/jobs/feed-fanout.service.ts',
        'src/infrastructure/jobs/worker-runner.service.ts',
        // Duplicate Event mapper under events/ (discover mapper is the covered path).
        'src/events/mappers/event.mapper.ts',
        // D3.23 integration bulk — covered by release smoke / integration suites.
        'src/integrations/csv/**',
        'src/integrations/csv-import.service.ts',
        'src/integrations/library-sync.service.ts',
        'src/integrations/integrations-worker.service.ts',
      ],
      thresholds: {
        statements: 95,
        lines: 95,
        functions: 90,
        branches: 70,
      },
    },
  },
});
