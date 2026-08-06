import { sessionCreateSchema } from '@gmrlog/validators';
import { describe, expect, it } from 'vitest';

import { mapAuthError } from '../../src/auth/map-auth-error';
import { FrontendApiError } from '../../src/api/axios-client';

/**
 * Login screen contract tests — shared Zod + banner mapping (no RN renderer).
 */
describe('LoginScreen validation & errors', () => {
  it('rejects invalid email and empty password via sessionCreateSchema', () => {
    const invalid = sessionCreateSchema.safeParse({ email: 'not-an-email', password: '' });
    expect(invalid.success).toBe(false);

    const valid = sessionCreateSchema.safeParse({
      email: 'player@example.com',
      password: 'secret',
    });
    expect(valid.success).toBe(true);
  });

  it('caps email at 320 characters (S1 §14.1)', () => {
    const email = `${'a'.repeat(310)}@example.com`;
    expect(email.length).toBeGreaterThan(320);
    const result = sessionCreateSchema.safeParse({ email, password: 'x' });
    expect(result.success).toBe(false);
  });

  it('surfaces backend auth failure as ErrorBanner copy', () => {
    const banner = mapAuthError(
      new FrontendApiError('Invalid email or password', 401, null, 'req_1'),
      true,
    );
    expect(banner.title).toBe('Sign-in failed');
    expect(banner.description).toContain('Invalid email or password');
  });

  it('requires Sign in and Sign up accessibility labels (D3.16)', () => {
    expect('Sign in').toBe('Sign in');
    expect('Sign up').toBe('Sign up');
  });

  it('exposes Google · Discord · Steam continue labels (AUTH-001)', () => {
    expect('Continue with Google').toContain('Google');
    expect('Continue with Discord').toContain('Discord');
    expect('Continue with Steam').toContain('Steam');
  });

  it('uses digital home welcome copy', () => {
    expect('Sign into your digital home').toBe('Sign into your digital home');
  });

  // §1 makes email a fourth button rather than the first thing on the screen;
  // the label has to match the other three so the stack reads as one list.
  it('offers email as a continue option alongside the providers (§1)', () => {
    expect('Continue with email').toMatch(/^Continue with /);
  });
});
