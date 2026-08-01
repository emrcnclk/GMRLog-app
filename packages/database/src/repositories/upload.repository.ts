import type { Prisma, Upload, UploadStatus } from '@prisma/client';

import type { DatabaseClient } from './types';

/**
 * Upload persistence (S2 §10.10). Grant/confirm records — persistence only.
 * No storage provider · virus scan · resize.
 */
export interface UploadRepository {
  create(data: Prisma.UploadCreateInput): Promise<Upload>;
  findById(id: string): Promise<Upload | null>;
  findByOwnerAndId(ownerId: string, id: string): Promise<Upload | null>;
  updateStatus(id: string, status: UploadStatus): Promise<Upload>;
  listByOwner(ownerId: string): Promise<Upload[]>;
  /** Lists `granted` uploads created before `cutoff` (maintenance — storage purge). */
  listGrantedOlderThan(cutoff: Date): Promise<Upload[]>;
  /** Marks `granted` uploads created before `cutoff` as `expired` (maintenance). */
  expireGrantedOlderThan(cutoff: Date): Promise<number>;
}

export class PrismaUploadRepository implements UploadRepository {
  constructor(private readonly db: DatabaseClient) {}

  create(data: Prisma.UploadCreateInput): Promise<Upload> {
    return this.db.upload.create({ data });
  }

  findById(id: string): Promise<Upload | null> {
    return this.db.upload.findUnique({ where: { id } });
  }

  findByOwnerAndId(ownerId: string, id: string): Promise<Upload | null> {
    return this.db.upload.findFirst({ where: { id, ownerId } });
  }

  updateStatus(id: string, status: UploadStatus): Promise<Upload> {
    return this.db.upload.update({ where: { id }, data: { status } });
  }

  listByOwner(ownerId: string): Promise<Upload[]> {
    return this.db.upload.findMany({
      where: { ownerId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
  }

  listGrantedOlderThan(cutoff: Date): Promise<Upload[]> {
    return this.db.upload.findMany({
      where: {
        status: 'granted',
        createdAt: { lt: cutoff },
      },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
  }

  async expireGrantedOlderThan(cutoff: Date): Promise<number> {
    const result = await this.db.upload.updateMany({
      where: {
        status: 'granted',
        createdAt: { lt: cutoff },
      },
      data: { status: 'expired' },
    });
    return result.count;
  }
}
