import { BadRequestException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CsvImportService } from './csv-import.service';

describe('CsvImportService', () => {
  const prisma = {
    userIntegration: { upsert: vi.fn() },
    syncJob: { create: vi.fn(), update: vi.fn(), findUnique: vi.fn() },
  };
  const librarySync = { runImport: vi.fn() };
  const jobs = { enqueueImport: vi.fn() };

  let service: CsvImportService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CsvImportService(prisma as never, librarySync as never, jobs as never);
  });

  it('preview detects steamdb format', () => {
    const preview = service.preview({
      csv: 'appid,title,playtime_forever\n570,Dota 2,1200',
    });
    expect(preview.format).toBe('steamdb');
    expect(preview.rows).toHaveLength(1);
  });

  it('preview respects format hint', () => {
    const preview = service.preview({
      format: 'generic',
      csv: 'title\nHades',
    });
    expect(preview.format).toBe('generic');
  });

  it('importCsv upserts csv integration and runs import', async () => {
    prisma.userIntegration.upsert.mockResolvedValue({ id: 'csv-int' });
    prisma.syncJob.create.mockResolvedValue({
      id: 'job-1',
      provider: 'csv',
      syncType: 'manual',
      status: 'pending',
      startedAt: null,
      finishedAt: null,
      errorCode: null,
    });
    jobs.enqueueImport.mockResolvedValue(null);
    librarySync.runImport.mockResolvedValue({
      id: 'h1',
      provider: 'csv',
      syncType: 'manual',
      status: 'completed',
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
      durationMs: 1,
      importedCount: 1,
      updatedCount: 0,
      skippedCount: 0,
      failedCount: 0,
      warningCount: 0,
    });
    prisma.syncJob.findUnique.mockResolvedValue({
      id: 'job-1',
      provider: 'csv',
      syncType: 'manual',
      status: 'completed',
      startedAt: null,
      finishedAt: null,
      errorCode: null,
    });

    const result = await service.importCsv('user-1', {
      csv: 'title,status\nHades,completed',
    });

    expect(result.status).toBe('completed');
    expect(librarySync.runImport).toHaveBeenCalled();
  });

  it('preview maps empty CSV parse failures to BadRequest', () => {
    expect(() => service.preview({ csv: '' })).toThrow(BadRequestException);
  });

  it('rejects empty importable rows and enqueues when jobs return an id', async () => {
    await expect(
      service.importCsv('user-1', { format: 'generic', csv: 'title\n' }),
    ).rejects.toBeInstanceOf(BadRequestException);

    prisma.userIntegration.upsert.mockResolvedValue({ id: 'csv-int' });
    prisma.syncJob.create.mockResolvedValue({
      id: 'job-2',
      provider: 'csv',
      syncType: 'manual',
      status: 'pending',
      startedAt: null,
      finishedAt: null,
      errorCode: null,
    });
    jobs.enqueueImport.mockResolvedValue('bull-1');
    prisma.syncJob.update.mockResolvedValue({});

    const queued = await service.importCsv('user-1', {
      csv: 'title,status\nHades,completed',
    });
    expect(queued.status).toBe('pending');
    expect(prisma.syncJob.update).toHaveBeenCalled();
    expect(librarySync.runImport).not.toHaveBeenCalled();
  });

  it('falls back to original job when refresh disappears', async () => {
    service = new CsvImportService(prisma as never, librarySync as never, undefined);
    prisma.userIntegration.upsert.mockResolvedValue({ id: 'csv-int' });
    const pending = {
      id: 'job-3',
      provider: 'csv',
      syncType: 'manual',
      status: 'pending',
      startedAt: null,
      finishedAt: null,
      errorCode: null,
    };
    prisma.syncJob.create.mockResolvedValue(pending);
    librarySync.runImport.mockResolvedValue({});
    prisma.syncJob.findUnique.mockResolvedValue(null);

    const result = await service.importCsv('user-1', {
      csv: 'title,status\nHades,completed',
    });
    expect(result.id).toBe('job-3');
  });
});
