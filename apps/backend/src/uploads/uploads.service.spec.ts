import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MemoryObjectStorage } from '../infrastructure/storage/memory-object-storage';
import { MemoryUploadGrantMetaStore } from '../infrastructure/storage/upload-grant-meta.store';

import { UploadsService } from './uploads.service';
import {
  createFakeUploadRepository,
  createFakeUserRepository,
  makeUpload,
  makeUser,
  type FakeUploadRepository,
  type FakeUserRepository,
} from './testing/fake-repositories';

let uploads: FakeUploadRepository;
let users: FakeUserRepository;
let storage: MemoryObjectStorage;
let grantMeta: MemoryUploadGrantMetaStore;
let jobs: { getQueue: ReturnType<typeof vi.fn> };
let service: UploadsService;

beforeEach(() => {
  uploads = createFakeUploadRepository();
  users = createFakeUserRepository([makeUser({ id: 'user-1' })]);
  storage = new MemoryObjectStorage();
  grantMeta = new MemoryUploadGrantMetaStore();
  jobs = {
    getQueue: vi.fn().mockReturnValue({
      add: vi.fn().mockResolvedValue({ id: 'job-1' }),
    }),
  };
  service = new UploadsService(uploads, users, storage, grantMeta as never, jobs as never);
  vi.useRealTimers();
});

describe('UploadsService.createGrant', () => {
  it('registers a granted upload and returns S1 grant dialect', async () => {
    const grant = await service.createGrant('user-1', {
      purpose: 'avatar',
      contentType: 'image/png',
      byteSize: 1024,
    });

    expect(grant.grantId).toEqual(expect.any(String));
    expect(grant.storageKey).toContain('uploads/user-1/avatar/');
    expect(grant.uploadUrl).toContain('memory://put/');
    expect(grant.headers['Content-Type']).toBe('image/png');
    expect(grant.expiresAt).toEqual(expect.any(String));

    const row = uploads.rows.get(grant.grantId);
    expect(row?.status).toBe('granted');
    expect(row?.purpose).toBe('avatar');
  });

  it('rejects grants for missing users', async () => {
    await expect(
      service.createGrant('missing', {
        purpose: 'avatar',
        contentType: 'image/jpeg',
        byteSize: 100,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('UploadsService.confirmUpload', () => {
  it('confirms an owned grant after object exists in storage', async () => {
    const grant = await service.createGrant('user-1', {
      purpose: 'banner',
      contentType: 'image/webp',
      byteSize: 2048,
    });
    storage.simulateClientPut(grant.storageKey, Buffer.alloc(2048), 'image/webp');

    const confirmed = await service.confirmUpload('user-1', {
      grantId: grant.grantId,
      storageKey: grant.storageKey,
    });

    expect(confirmed).toMatchObject({
      id: grant.grantId,
      purpose: 'banner',
      status: 'confirmed',
      storageKey: grant.storageKey,
    });
  });

  it('rejects confirm when object is missing', async () => {
    const grant = await service.createGrant('user-1', {
      purpose: 'avatar',
      contentType: 'image/png',
      byteSize: 100,
    });
    await expect(
      service.confirmUpload('user-1', {
        grantId: grant.grantId,
        storageKey: grant.storageKey,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('hides foreign grants as not found', async () => {
    uploads.rows.set(
      'foreign',
      makeUpload({ id: 'foreign', ownerId: 'user-2', storageKey: 'uploads/user-2/x' }),
    );
    await expect(
      service.confirmUpload('user-1', { grantId: 'foreign', storageKey: 'uploads/user-2/x' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects mismatched storageKey and double confirm', async () => {
    const grant = await service.createGrant('user-1', {
      purpose: 'avatar',
      contentType: 'image/png',
      byteSize: 64,
    });
    storage.simulateClientPut(grant.storageKey, Buffer.alloc(64), 'image/png');

    await expect(
      service.confirmUpload('user-1', { grantId: grant.grantId, storageKey: 'other' }),
    ).rejects.toBeInstanceOf(BadRequestException);

    await service.confirmUpload('user-1', {
      grantId: grant.grantId,
      storageKey: grant.storageKey,
    });
    await expect(
      service.confirmUpload('user-1', {
        grantId: grant.grantId,
        storageKey: grant.storageKey,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});

describe('UploadsService.confirmUpload validation', () => {
  it('rejects invalid size and mime metadata', async () => {
    const grant = await service.createGrant('user-1', {
      purpose: 'avatar',
      contentType: 'image/png',
      byteSize: 128,
    });
    storage.simulateClientPut(grant.storageKey, Buffer.alloc(64), 'image/png');
    await expect(
      service.confirmUpload('user-1', { grantId: grant.grantId, storageKey: grant.storageKey }),
    ).rejects.toBeInstanceOf(BadRequestException);

    storage.objects.set(grant.storageKey, { body: Buffer.alloc(128), contentType: 'image/jpeg' });
    await expect(
      service.confirmUpload('user-1', { grantId: grant.grantId, storageKey: grant.storageKey }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('enqueues image processing when jobs service is mounted', async () => {
    const add = vi.fn().mockResolvedValue(undefined);
    const jobs = { getQueue: vi.fn().mockReturnValue({ add }) };
    service = new UploadsService(uploads, users, storage, grantMeta as never, jobs as never);

    const grant = await service.createGrant('user-1', {
      purpose: 'avatar',
      contentType: 'image/png',
      byteSize: 64,
    });
    storage.simulateClientPut(grant.storageKey, Buffer.alloc(64), 'image/png');
    await service.confirmUpload('user-1', { grantId: grant.grantId, storageKey: grant.storageKey });
    expect(add).toHaveBeenCalledOnce();
  });
});

describe('UploadsService.expireStaleGrants', () => {
  it('delegates to repository cutoff', async () => {
    const spy = vi.spyOn(uploads, 'expireGrantedOlderThan').mockResolvedValue(2);
    const count = await service.expireStaleGrants();
    expect(count).toBe(2);
    expect(spy).toHaveBeenCalledOnce();
  });
});
