import type {
  ApiEnvelope,
  LegalDocumentResponse,
  LegalDocumentSummaryResponse,
} from '@gmrlog/types';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppConfigModule } from '../infrastructure/config/config.module';
import { HttpInfrastructureModule } from '../infrastructure/http/http.module';
import { LoggerModule } from '../infrastructure/logging/logger.module';

import { LegalModule } from './legal.module';

let app: NestFastifyApplication;

function body<T>(payload: string): T {
  return (JSON.parse(payload) as ApiEnvelope<T>).data;
}

beforeAll(async () => {
  // No overrides at all, and that is the assertion: LegalModule imports
  // nothing, so there is no Prisma, Redis, storage or search provider to stub.
  const moduleRef = await Test.createTestingModule({
    imports: [AppConfigModule, LoggerModule, HttpInfrastructureModule, LegalModule],
  }).compile();

  app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
  await app.init();
  await app.getHttpAdapter().getInstance().ready();
});

afterAll(async () => {
  await app.close();
});

describe('GET /legal', () => {
  it('lists every document without a token', async () => {
    // The route exists precisely so a visitor with no account can read what
    // they are about to agree to. No Authorization header is sent here.
    const response = await app.inject({ method: 'GET', url: '/legal' });

    expect(response.statusCode).toBe(200);

    const documents = body<LegalDocumentSummaryResponse[]>(response.payload);
    expect(documents.map((document) => document.id).sort()).toEqual([
      'disclosure-notice',
      'privacy-policy',
      'terms-of-service',
    ]);
  });

  it('omits the bodies so a drift check stays cheap', async () => {
    const response = await app.inject({ method: 'GET', url: '/legal' });
    const documents = body<LegalDocumentSummaryResponse[]>(response.payload);

    for (const document of documents) {
      expect(document).not.toHaveProperty('body');
      expect(document.version).toMatch(/^\d+\.\d+\.\d+$/);
      expect(document.effectiveDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('serves the requested locale', async () => {
    const response = await app.inject({ method: 'GET', url: '/legal?locale=tr' });
    const documents = body<LegalDocumentSummaryResponse[]>(response.payload);

    expect(documents).toHaveLength(3);
    for (const document of documents) {
      expect(document.locale).toBe('tr');
    }
  });

  it('marks the disclosure notice as not requiring acceptance', async () => {
    const response = await app.inject({ method: 'GET', url: '/legal' });
    const documents = body<LegalDocumentSummaryResponse[]>(response.payload);

    const notice = documents.find((document) => document.id === 'disclosure-notice');
    expect(notice?.requiresAcceptance).toBe(false);
  });

  it('is cacheable, but not for longer than a version bump should take to land', async () => {
    const response = await app.inject({ method: 'GET', url: '/legal' });
    expect(response.headers['cache-control']).toBe('public, max-age=300');
  });

  it('rejects an unpublished locale rather than silently serving the default', async () => {
    const response = await app.inject({ method: 'GET', url: '/legal?locale=de' });
    expect(response.statusCode).toBe(400);
  });

  it('rejects an unknown query parameter', async () => {
    const response = await app.inject({ method: 'GET', url: '/legal?document=terms-of-service' });
    expect(response.statusCode).toBe(400);
  });
});

describe('GET /legal/:document', () => {
  it('serves a document with its Markdown body, without a token', async () => {
    const response = await app.inject({ method: 'GET', url: '/legal/terms-of-service' });

    expect(response.statusCode).toBe(200);

    const document = body<LegalDocumentResponse>(response.payload);
    expect(document.id).toBe('terms-of-service');
    expect(document.locale).toBe('en');
    expect(document.body.startsWith('# ')).toBe(true);
    expect(document.body).toContain(document.version);
  });

  it('serves the Turkish text when asked', async () => {
    const response = await app.inject({ method: 'GET', url: '/legal/disclosure-notice?locale=tr' });
    const document = body<LegalDocumentResponse>(response.payload);

    expect(document.locale).toBe('tr');
    expect(document.title).toBe('KVKK Aydınlatma Metni');
  });

  it('keeps every locale of a document on one version', async () => {
    // Pinned at the route as well as the registry: a reader who switches
    // locale must not land on an older set of terms than the one their consent
    // record says they accepted.
    const [en, tr] = await Promise.all([
      app.inject({ method: 'GET', url: '/legal/privacy-policy?locale=en' }),
      app.inject({ method: 'GET', url: '/legal/privacy-policy?locale=tr' }),
    ]);

    expect(body<LegalDocumentResponse>(en.payload).version).toBe(
      body<LegalDocumentResponse>(tr.payload).version,
    );
  });

  it('is cacheable', async () => {
    const response = await app.inject({ method: 'GET', url: '/legal/privacy-policy' });
    expect(response.headers['cache-control']).toBe('public, max-age=300');
  });

  it('rejects an unknown document at the edge', async () => {
    // Enumerated in the param schema, so this is a 400 rather than reaching
    // the registry — the route cannot be used to probe for documents.
    const response = await app.inject({ method: 'GET', url: '/legal/cookie-policy' });
    expect(response.statusCode).toBe(400);
  });
});
