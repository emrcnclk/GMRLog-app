import type { ApiEnvelope, LegalConsentStateResponse } from '@gmrlog/types';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { AuthModule } from '../auth/auth.module';
import { SESSION_REPOSITORY } from '../auth/auth.tokens';
import { issueTestAccessToken, MemorySessionRepository } from '../auth/testing/session-fixture';
import { AppConfigModule } from '../infrastructure/config/config.module';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { HttpInfrastructureModule } from '../infrastructure/http/http.module';
import { LoggerModule } from '../infrastructure/logging/logger.module';

import {
  ACCEPTANCE_REQUIRED_DOCUMENT_IDS,
  DISCLOSURE_DOCUMENT_IDS,
  resolveLegalDocument,
} from './documents';
import { LEGAL_CONSENT_REPOSITORY } from './legal.tokens';
import { LegalModule } from './legal.module';
import {
  createFakeUserConsentRepository,
  type FakeUserConsentRepository,
} from './testing/fake-repositories';

let app: NestFastifyApplication;
let accessToken: string;
const consents: FakeUserConsentRepository = createFakeUserConsentRepository();

function state(payload: string): LegalConsentStateResponse {
  return (JSON.parse(payload) as ApiEnvelope<LegalConsentStateResponse>).data;
}

function currentVersionOf(documentId: string): string {
  const document = resolveLegalDocument(documentId as never, 'en');
  if (document === null) {
    throw new Error(`missing legal document: ${documentId}`);
  }
  return document.version;
}

beforeAll(async () => {
  const moduleRef = await Test.createTestingModule({
    imports: [AppConfigModule, LoggerModule, HttpInfrastructureModule, AuthModule, LegalModule],
  })
    .overrideProvider(PrismaService)
    .useValue({})
    .overrideProvider(LEGAL_CONSENT_REPOSITORY)
    .useValue(consents)
    .overrideProvider(SESSION_REPOSITORY)
    .useValue(new MemorySessionRepository())
    .compile();

  app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
  await app.init();
  await app.getHttpAdapter().getInstance().ready();

  accessToken = await issueTestAccessToken(moduleRef, 'user-1');
});

afterAll(async () => {
  await app.close();
});

beforeEach(() => {
  consents.rows.length = 0;
});

describe('GET /me/legal-consents', () => {
  it("requires a token — this is the player's own record, unlike /legal", async () => {
    // The mirror of 12.2's assertion that the document routes take no token.
    // Both properties are deliberate and neither should drift into the other.
    const response = await app.inject({ method: 'GET', url: '/me/legal-consents' });
    expect(response.statusCode).toBe(401);
  });

  it('reports every required document as outstanding for a player who never decided', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/me/legal-consents',
      headers: { authorization: `Bearer ${accessToken}` },
    });

    expect(response.statusCode).toBe(200);
    const body = state(response.payload);
    expect(body.satisfied).toBe(false);
    expect(body.outstanding.map((document) => document.id).sort()).toEqual(
      [...ACCEPTANCE_REQUIRED_DOCUMENT_IDS].sort(),
    );
    expect(body.decisions).toEqual([]);
  });
});

describe('POST /me/legal-consents', () => {
  it('requires a token', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/me/legal-consents',
      payload: { decisions: [] },
    });
    expect(response.statusCode).toBe(401);
  });

  it('records an acceptance and returns the state, so no second call is needed', async () => {
    const decisions = ACCEPTANCE_REQUIRED_DOCUMENT_IDS.map((documentId) => ({
      documentId,
      version: currentVersionOf(documentId),
      locale: 'en' as const,
      decision: 'accepted' as const,
    }));

    const response = await app.inject({
      method: 'POST',
      url: '/me/legal-consents',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { decisions },
    });

    expect(response.statusCode).toBe(201);
    const body = state(response.payload);
    expect(body.satisfied).toBe(true);
    expect(body.outstanding).toEqual([]);
  });

  it('records a refusal without leaving it outstanding', async () => {
    const terms = ACCEPTANCE_REQUIRED_DOCUMENT_IDS[0];
    if (terms === undefined) {
      throw new Error('no required documents');
    }

    const response = await app.inject({
      method: 'POST',
      url: '/me/legal-consents',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        decisions: [
          {
            documentId: terms,
            version: currentVersionOf(terms),
            locale: 'en',
            decision: 'declined',
          },
        ],
      },
    });

    expect(response.statusCode).toBe(201);
    const body = state(response.payload);
    expect(body.satisfied).toBe(false);
    // Asked and answered. Leaving it outstanding would mean re-prompting on
    // every launch until the player gives in.
    expect(body.outstanding.map((document) => document.id)).not.toContain(terms);
  });

  it('rejects a decision against a superseded version', async () => {
    const terms = ACCEPTANCE_REQUIRED_DOCUMENT_IDS[0];
    if (terms === undefined) {
      throw new Error('no required documents');
    }

    const response = await app.inject({
      method: 'POST',
      url: '/me/legal-consents',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        decisions: [{ documentId: terms, version: '0.0.1', locale: 'en', decision: 'accepted' }],
      },
    });

    expect(response.statusCode).toBe(400);
  });

  it('rejects an empty decision list at the edge', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/me/legal-consents',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { decisions: [] },
    });

    expect(response.statusCode).toBe(400);
  });

  it('rejects an unknown decision value', async () => {
    const terms = ACCEPTANCE_REQUIRED_DOCUMENT_IDS[0];
    if (terms === undefined) {
      throw new Error('no required documents');
    }

    const response = await app.inject({
      method: 'POST',
      url: '/me/legal-consents',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        decisions: [
          {
            documentId: terms,
            version: currentVersionOf(terms),
            locale: 'en',
            decision: 'maybe',
          },
        ],
      },
    });

    expect(response.statusCode).toBe(400);
  });
});

describe('POST /me/legal-consents/acknowledgements', () => {
  it('requires a token', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/me/legal-consents/acknowledgements',
      payload: { documents: [] },
    });
    expect(response.statusCode).toBe(401);
  });

  it('clears undisclosed notices, so a caller needs no second call', async () => {
    const documents = DISCLOSURE_DOCUMENT_IDS.map((documentId) => ({
      documentId,
      version: currentVersionOf(documentId),
      locale: 'en' as const,
    }));

    const response = await app.inject({
      method: 'POST',
      url: '/me/legal-consents/acknowledgements',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { documents },
    });

    expect(response.statusCode).toBe(201);
    const body = state(response.payload);
    expect(body.undisclosed).toEqual([]);
    // Acknowledging a notice is not a decision about the Terms — the route
    // that requires acceptance is untouched by this one.
    expect(body.outstanding.map((document) => document.id)).toEqual(
      ACCEPTANCE_REQUIRED_DOCUMENT_IDS,
    );
  });

  it('rejects a document that requires acceptance', async () => {
    const terms = ACCEPTANCE_REQUIRED_DOCUMENT_IDS[0];
    if (terms === undefined) {
      throw new Error('no required documents');
    }

    const response = await app.inject({
      method: 'POST',
      url: '/me/legal-consents/acknowledgements',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        documents: [{ documentId: terms, version: currentVersionOf(terms), locale: 'en' }],
      },
    });

    expect(response.statusCode).toBe(400);
  });

  it('rejects a superseded version', async () => {
    const notice = DISCLOSURE_DOCUMENT_IDS[0];
    if (notice === undefined) {
      throw new Error('no disclosure documents');
    }

    const response = await app.inject({
      method: 'POST',
      url: '/me/legal-consents/acknowledgements',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { documents: [{ documentId: notice, version: '0.0.1', locale: 'en' }] },
    });

    expect(response.statusCode).toBe(400);
  });

  it('rejects an empty document list at the edge', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/me/legal-consents/acknowledgements',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { documents: [] },
    });

    expect(response.statusCode).toBe(400);
  });
});
