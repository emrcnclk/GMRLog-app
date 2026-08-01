import type {
  ApiEnvelope,
  ApiErrorEnvelope,
  UploadGrantResponse,
  UploadResponse,
} from '@gmrlog/types';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { AuthModule } from '../auth/auth.module';
import { TokenService } from '../auth/jwt/token.service';
import { AppConfigModule } from '../infrastructure/config/config.module';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { HttpInfrastructureModule } from '../infrastructure/http/http.module';
import { LoggerModule } from '../infrastructure/logging/logger.module';
import { MemoryObjectStorage } from '../infrastructure/storage/memory-object-storage';
import { OBJECT_STORAGE, UPLOAD_GRANT_META } from '../infrastructure/storage/storage.tokens';
import { MemoryUploadGrantMetaStore } from '../infrastructure/storage/upload-grant-meta.store';
import {
  asSearchIndexPublisher,
  createFakeSearchIndexPublisher,
} from '../infrastructure/jobs/testing/fake-search-index.publisher';
import { SearchIndexPublisher } from '../infrastructure/jobs/search-index.publisher';
import { JOBS_CONNECTION } from '../infrastructure/jobs/jobs.constants';

import { UploadsModule } from './uploads.module';
import { UPLOAD_REPOSITORY, UPLOAD_USER_REPOSITORY } from './uploads.tokens';
import {
  createFakeUploadRepository,
  createFakeUserRepository,
  makeUser,
} from './testing/fake-repositories';

const uploads = createFakeUploadRepository();
const users = createFakeUserRepository([makeUser({ id: 'user-1' })]);
const memoryStorage = new MemoryObjectStorage();

let app: NestFastifyApplication;
let accessToken: string;

beforeAll(async () => {
  const moduleRef = await Test.createTestingModule({
    imports: [AppConfigModule, LoggerModule, HttpInfrastructureModule, AuthModule, UploadsModule],
  })
    .overrideProvider(PrismaService)
    .useValue({})
    .overrideProvider(UPLOAD_REPOSITORY)
    .useValue(uploads)
    .overrideProvider(UPLOAD_USER_REPOSITORY)
    .useValue(users)
    .overrideProvider(OBJECT_STORAGE)
    .useValue(memoryStorage)
    .overrideProvider(UPLOAD_GRANT_META)
    .useValue(new MemoryUploadGrantMetaStore())
    .overrideProvider(SearchIndexPublisher)
    .useValue(asSearchIndexPublisher(createFakeSearchIndexPublisher()))
    .overrideProvider(JOBS_CONNECTION)
    .useValue({ disconnect: () => undefined })
    .compile();

  app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
  await app.init();
  await app.getHttpAdapter().getInstance().ready();

  const tokens = moduleRef.get(TokenService);
  accessToken = await tokens.signAccessToken('user-1');
});

afterAll(async () => {
  await app.close();
});

beforeEach(() => {
  uploads.rows.clear();
  memoryStorage.objects.clear();
});

function authHeaders(): Record<string, string> {
  return { authorization: `Bearer ${accessToken}` };
}

describe('POST /uploads/grants', () => {
  it('rejects guests with the canonical S1 authn error', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/uploads/grants',
      payload: { purpose: 'avatar', contentType: 'image/png', byteSize: 100 },
    });
    expect(response.statusCode).toBe(401);
    expect((JSON.parse(response.payload) as ApiErrorEnvelope).error.category).toBe('authn');
  });

  it('returns UploadGrantResponse inside the S1 envelope', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/uploads/grants',
      headers: authHeaders(),
      payload: { purpose: 'avatar', contentType: 'image/png', byteSize: 2048 },
    });
    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.payload) as ApiEnvelope<UploadGrantResponse>;
    expect(body.meta.requestId).toEqual(expect.any(String));
    expect(body.data).toMatchObject({
      grantId: expect.any(String),
      storageKey: expect.stringContaining('uploads/user-1/avatar/'),
      headers: { 'Content-Type': 'image/png' },
    });
    expect(body.data.uploadUrl).toContain('memory://put/');
  });

  it('rejects disallowed MIME and oversized byteSize', async () => {
    const mime = await app.inject({
      method: 'POST',
      url: '/uploads/grants',
      headers: authHeaders(),
      payload: { purpose: 'avatar', contentType: 'application/pdf', byteSize: 100 },
    });
    expect(mime.statusCode).toBe(400);

    const size = await app.inject({
      method: 'POST',
      url: '/uploads/grants',
      headers: authHeaders(),
      payload: {
        purpose: 'avatar',
        contentType: 'image/png',
        byteSize: 20 * 1024 * 1024,
      },
    });
    expect(size.statusCode).toBe(400);
  });
});

describe('POST /uploads/confirmations', () => {
  it('confirms a grant and returns UploadResponse', async () => {
    const grantResponse = await app.inject({
      method: 'POST',
      url: '/uploads/grants',
      headers: authHeaders(),
      payload: { purpose: 'post_media', contentType: 'image/jpeg', byteSize: 4096 },
    });
    const grant = (JSON.parse(grantResponse.payload) as ApiEnvelope<UploadGrantResponse>).data;
    memoryStorage.simulateClientPut(grant.storageKey, Buffer.alloc(4096, 0), 'image/jpeg');

    const response = await app.inject({
      method: 'POST',
      url: '/uploads/confirmations',
      headers: authHeaders(),
      payload: { grantId: grant.grantId, storageKey: grant.storageKey },
    });
    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.payload) as ApiEnvelope<UploadResponse>;
    expect(body.data).toMatchObject({
      id: grant.grantId,
      purpose: 'post_media',
      status: 'confirmed',
      storageKey: grant.storageKey,
    });
  });

  it('rejects confirmation without auth', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/uploads/confirmations',
      payload: { grantId: 'upload-1', storageKey: 'key' },
    });
    expect(response.statusCode).toBe(401);
  });

  it('rejects unknown grant ids with 404', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/uploads/confirmations',
      headers: authHeaders(),
      payload: { grantId: 'missing', storageKey: 'key' },
    });
    expect(response.statusCode).toBe(404);
  });
});
