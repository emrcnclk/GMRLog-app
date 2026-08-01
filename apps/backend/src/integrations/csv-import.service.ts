import type { SyncJobResponse } from '@gmrlog/types';
import type { CsvImportInput } from '@gmrlog/validators';
import { BadRequestException, Injectable, Optional } from '@nestjs/common';

import { PrismaService } from '../infrastructure/database/prisma.service';

import { CsvParseError, parseCsvImport, type CsvParseResult } from './csv/csv-import.parser';
import { IntegrationJobsPublisher } from './integration-jobs.publisher';
import { LibrarySyncService } from './library-sync.service';
import { toSyncJobResponse } from './mappers/integrations.mapper';

/**
 * CSV wizard import (D3.23 / CSV_IMPORT.md).
 */
@Injectable()
export class CsvImportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly librarySync: LibrarySyncService,
    @Optional() private readonly jobsPublisher?: IntegrationJobsPublisher,
  ) {}

  preview(input: CsvImportInput): CsvParseResult {
    try {
      return parseCsvImport(input.csv, input.format);
    } catch (error: unknown) {
      if (error instanceof CsvParseError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  async importCsv(userId: string, input: CsvImportInput): Promise<SyncJobResponse> {
    let parsed: CsvParseResult;
    try {
      parsed = parseCsvImport(input.csv, input.format);
    } catch (error: unknown) {
      if (error instanceof CsvParseError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }

    if (parsed.rows.length === 0) {
      throw new BadRequestException('CSV contained no importable rows');
    }

    const now = new Date();
    const integration = await this.prisma.userIntegration.upsert({
      where: { userId_provider: { userId, provider: 'csv' } },
      create: {
        userId,
        provider: 'csv',
        externalRef: `csv:${parsed.format}`,
        displayName: `CSV (${parsed.format})`,
        status: 'connected',
        syncType: 'manual',
        connectedAt: now,
        metadata: { format: parsed.format, lastRowCount: parsed.rows.length },
      },
      update: {
        status: 'connected',
        disconnectedAt: null,
        displayName: `CSV (${parsed.format})`,
        externalRef: `csv:${parsed.format}`,
        metadata: { format: parsed.format, lastRowCount: parsed.rows.length },
      },
    });

    const job = await this.prisma.syncJob.create({
      data: {
        userId,
        integrationId: integration.id,
        provider: 'csv',
        syncType: 'manual',
        status: 'pending',
      },
    });

    const bullJobId =
      this.jobsPublisher != null
        ? await this.jobsPublisher.enqueueImport({
            kind: 'import',
            userId,
            integrationId: integration.id,
            syncJobId: job.id,
            syncType: 'manual',
            csvRows: parsed.rows,
            conflictResolution: input.conflictResolution,
          })
        : null;

    if (bullJobId !== null) {
      await this.prisma.syncJob.update({
        where: { id: job.id },
        data: { bullJobId },
      });
      return toSyncJobResponse(job);
    }

    await this.librarySync.runImport(job.id, {
      csvRows: parsed.rows,
      conflictResolution: input.conflictResolution,
    });

    const refreshed = await this.prisma.syncJob.findUnique({ where: { id: job.id } });
    if (refreshed === null) {
      return toSyncJobResponse(job);
    }
    return toSyncJobResponse(refreshed);
  }
}
