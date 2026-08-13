import type {
  Prisma,
  Upload,
  UploadRepository,
  UploadStatus,
  User,
  UserRepository,
} from '@gmrlog/database';

/**
 * In-memory repository fakes — test support only (build-excluded).
 */

let idCounter = 0;
function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${String(idCounter)}`;
}

function connectId(value: unknown): string | undefined {
  if (typeof value !== 'object' || value === null || !('connect' in value)) {
    return undefined;
  }
  const connect = (value as { connect?: { id?: string } }).connect;
  return typeof connect?.id === 'string' ? connect.id : undefined;
}

export function makeUpload(overrides: Partial<Upload> = {}): Upload {
  return {
    id: 'upload-1',
    ownerId: 'user-1',
    purpose: 'avatar',
    storageKey: 'uploads/user-1/avatar/key-1',
    status: 'granted',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

export function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    handle: 'gamer',
    displayName: 'Gamer',
    bio: null,
    avatarKey: null,
    bannerKey: null,
    avatarBlurhash: null,
    avatarVariants: null,
    bannerBlurhash: null,
    bannerVariants: null,
    privacyId: null,
    creatorFeatured: false,
    accountKind: 'individual',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    deletedAt: null,
    ...overrides,
  };
}

export interface FakeUploadRepository extends UploadRepository {
  rows: Map<string, Upload>;
}

export function createFakeUploadRepository(seed: Upload[] = []): FakeUploadRepository {
  const rows = new Map(seed.map((row) => [row.id, row]));

  return {
    rows,
    create: (data: Prisma.UploadCreateInput) => {
      const ownerId = connectId(data.owner);
      if (!ownerId) {
        return Promise.reject(new Error('owner required'));
      }
      const upload = makeUpload({
        id: nextId('upload'),
        ownerId,
        purpose: data.purpose,
        storageKey: data.storageKey,
        status: data.status,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      rows.set(upload.id, upload);
      return Promise.resolve(upload);
    },
    findById: (id) => Promise.resolve(rows.get(id) ?? null),
    findByOwnerAndId: (ownerId, id) => {
      const row = rows.get(id);
      return Promise.resolve(row?.ownerId === ownerId ? row : null);
    },
    updateStatus: (id, status: UploadStatus) => {
      const current = rows.get(id);
      if (!current) {
        return Promise.reject(new Error(`upload ${id} not found`));
      }
      const next: Upload = { ...current, status, updatedAt: new Date() };
      rows.set(id, next);
      return Promise.resolve(next);
    },
    listByOwner: (ownerId) =>
      Promise.resolve(
        [...rows.values()]
          .filter((row) => row.ownerId === ownerId)
          .sort((a, b) => {
            const byTime = b.createdAt.getTime() - a.createdAt.getTime();
            return byTime !== 0 ? byTime : b.id.localeCompare(a.id);
          }),
      ),
    expireGrantedOlderThan: (cutoff) => {
      let count = 0;
      for (const [id, row] of rows) {
        if (row.status === 'granted' && row.createdAt.getTime() < cutoff.getTime()) {
          rows.set(id, { ...row, status: 'expired', updatedAt: new Date() });
          count += 1;
        }
      }
      return Promise.resolve(count);
    },
    listGrantedOlderThan: (cutoff) =>
      Promise.resolve(
        [...rows.values()].filter(
          (row) => row.status === 'granted' && row.createdAt.getTime() < cutoff.getTime(),
        ),
      ),
  };
}

export interface FakeUserRepository extends UserRepository {
  rows: Map<string, User>;
}

export function createFakeUserRepository(seed: User[] = []): FakeUserRepository {
  const rows = new Map(seed.map((row) => [row.id, row]));
  return {
    rows,
    create: () => Promise.reject(new Error('not supported')),
    findById: (id) => Promise.resolve(rows.get(id) ?? null),
    findByHandle: () => Promise.resolve(null),
    findManyByIds: (ids) =>
      Promise.resolve(
        ids.flatMap((id) => {
          const user = rows.get(id);
          return user ? [user] : [];
        }),
      ),
    update: () => Promise.reject(new Error('not supported')),
    softDelete: () => Promise.reject(new Error('not supported')),
    delete: () => Promise.reject(new Error('not supported')),
  };
}
