import { NotFoundException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';

import { LegalService } from './legal.service';

const service = new LegalService();

describe('LegalService.listDocuments', () => {
  it('returns one entry per document, not one per locale', () => {
    const documents = service.listDocuments();
    expect(documents).toHaveLength(3);
    expect(new Set(documents.map((document) => document.id)).size).toBe(3);
  });

  it('defaults to the default locale', () => {
    for (const document of service.listDocuments()) {
      expect(document.locale).toBe('en');
    }
  });

  it('carries no body, so a drift check does not pay for three full texts', () => {
    for (const document of service.listDocuments('tr')) {
      expect(document).not.toHaveProperty('body');
    }
  });
});

describe('LegalService.getDocument', () => {
  it('returns the body for the requested document', () => {
    const document = service.getDocument('privacy-policy', 'en');
    expect(document.id).toBe('privacy-policy');
    expect(document.body.length).toBeGreaterThan(0);
  });

  it('falls back to the default locale rather than 404ing a document that exists', () => {
    const document = service.getDocument('terms-of-service', 'de' as never);
    expect(document.id).toBe('terms-of-service');
    expect(document.locale).toBe('en');
  });

  it('throws rather than returning an empty document for an unknown id', () => {
    // Unreachable through the route, which enumerates the ids — but an empty
    // 200 is the worst possible answer for a legal document, so the service
    // refuses rather than trusting the edge.
    expect(() => service.getDocument('cookie-policy' as never)).toThrow(NotFoundException);
  });
});
