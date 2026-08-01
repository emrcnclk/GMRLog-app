import type { Prisma, Upload, UploadRepository } from '@gmrlog/database';
import type { UploadStatus } from '@prisma/client';
import { vi } from 'vitest';

export interface FakeUploadRepository extends UploadRepository {
  rows: Map<string, Upload>;
  expireGrantedOlderThan: ReturnType<typeof vi.fn<(cutoff: Date) => Promise<number>>>;
  listGrantedOlderThan: ReturnType<typeof vi.fn<(cutoff: Date) => Promise<Upload[]>>>;
}

export function makeUpload(overrides: Partial<Upload> = {}): Upload {
  return {
    id: overrides.id ?? 'upload-1',
    ownerId: overrides.ownerId ?? 'user-1',
    purpose: overrides.purpose ?? 'avatar',
    storageKey: overrides.storageKey ?? 'uploads/user-1/avatar/key-1',
    status: overrides.status ?? 'granted',
    createdAt: overrides.createdAt ?? new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: overrides.updatedAt ?? new Date('2026-01-01T00:00:00.000Z'),
  };
}

function connectId(value: { connect?: { id?: string } } | undefined): string | undefined {
  return typeof value?.connect?.id === 'string' ? value.connect.id : undefined;
}

export function createFakeUploadRepository(seed: Upload[] = []): FakeUploadRepository {
  const rows = new Map(seed.map((row) => [row.id, row]));

  return {
    rows,
    create: vi.fn((data: Prisma.UploadCreateInput) => {
      const created = makeUpload({
        id: `upload-${String(rows.size + 1)}`,
        ownerId: connectId(data.owner) ?? 'user-1',
        purpose: data.purpose,
        storageKey: data.storageKey,
        status: data.status,
      });
      rows.set(created.id, created);
      return Promise.resolve(created);
    }),
    findById: vi.fn((id: string) => Promise.resolve(rows.get(id) ?? null)),
    findByOwnerAndId: vi.fn((ownerId: string, id: string) => {
      const row = rows.get(id);
      if (row?.ownerId !== ownerId) {
        return Promise.resolve(null);
      }
      return Promise.resolve(row);
    }),
    updateStatus: vi.fn((id: string, status: UploadStatus) => {
      const row = rows.get(id);
      if (row == null) {
        return Promise.reject(new Error('upload not found'));
      }
      const updated = { ...row, status, updatedAt: new Date() };
      rows.set(id, updated);
      return Promise.resolve(updated);
    }),
    listByOwner: vi.fn((ownerId: string) =>
      Promise.resolve([...rows.values()].filter((row) => row.ownerId === ownerId)),
    ),
    listGrantedOlderThan: vi.fn((cutoff: Date) =>
      Promise.resolve(
        [...rows.values()].filter((row) => row.status === 'granted' && row.createdAt < cutoff),
      ),
    ),
    expireGrantedOlderThan: vi.fn((cutoff: Date) => {
      let count = 0;
      for (const [id, row] of rows) {
        if (row.status === 'granted' && row.createdAt < cutoff) {
          rows.set(id, { ...row, status: 'expired', updatedAt: new Date() });
          count += 1;
        }
      }
      return Promise.resolve(count);
    }),
  };
}
