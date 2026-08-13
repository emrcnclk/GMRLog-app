import {
  BadRequestException,
  ConflictException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { parseBackendEnv } from '../../infrastructure/config/env.schema';

import { MemoryOAuthStateStore } from './oauth-state.store';
import { OAuthController } from './oauth.controller';
import type { OAuthMatchResult } from './oauth.types';
import { GoogleOAuthError } from './providers/google.provider';

const ALLOWED_REDIRECT_URI = 'https://app.gmrlog.test/oauth/callback';

function makeUser(overrides: Partial<{ id: string; handle: string }> = {}) {
  return {
    id: 'user-1',
    handle: 'kaan',
    displayName: 'Kaan',
    bio: null,
    avatarKey: null,
    bannerKey: null,
    avatarBlurhash: null,
    avatarVariants: null,
    bannerBlurhash: null,
    bannerVariants: null,
    privacyId: null,
    creatorFeatured: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  };
}

function createFakeGoogleProvider() {
  return {
    isEnabled: vi.fn(() => true),
    buildAuthorizeUrl: vi.fn(
      ({ state }: { state: string }) => `https://accounts.google.com/authorize?state=${state}`,
    ),
    exchangeAndFetchIdentity: vi.fn(async () => ({
      provider: 'google' as const,
      subject: 'sub-1',
      email: 'player@example.com',
      emailVerified: true,
      displayName: 'Kaan',
    })),
  };
}

function createEnv(overrides: Record<string, string> = {}) {
  return parseBackendEnv({
    GOOGLE_OAUTH_CLIENT_ID: 'client-id',
    GOOGLE_OAUTH_CLIENT_SECRET: 'client-secret',
    GOOGLE_OAUTH_ALLOWED_REDIRECT_URIS: ALLOWED_REDIRECT_URI,
    OAUTH_STATE_TTL_SECONDS: '600',
    ...overrides,
  });
}

describe('OAuthController', () => {
  let stateStore: MemoryOAuthStateStore;
  let google: ReturnType<typeof createFakeGoogleProvider>;
  let oauthService: { resolveLogin: ReturnType<typeof vi.fn> };
  let sessions: { issueCredentialPair: ReturnType<typeof vi.fn> };
  let controller: OAuthController;

  beforeEach(() => {
    stateStore = new MemoryOAuthStateStore();
    google = createFakeGoogleProvider();
    oauthService = { resolveLogin: vi.fn() };
    sessions = {
      issueCredentialPair: vi.fn(async (userId: string) => ({
        accessToken: `access-${userId}`,
        refreshToken: `refresh-${userId}`,
      })),
    };
    controller = new OAuthController(
      google as never,
      stateStore as never,
      oauthService as never,
      sessions as never,
      createEnv(),
    );
  });

  describe('start', () => {
    it('rejects an unsupported provider', async () => {
      await expect(
        controller.start('discord', { redirectUri: ALLOWED_REDIRECT_URI }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('fails closed when Google is not configured', async () => {
      google.isEnabled.mockReturnValue(false);
      await expect(
        controller.start('google', { redirectUri: ALLOWED_REDIRECT_URI }),
      ).rejects.toBeInstanceOf(ServiceUnavailableException);
    });

    it('rejects a redirectUri outside the configured allowlist', async () => {
      await expect(
        controller.start('google', { redirectUri: 'https://evil.example/callback' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('stores a single-use state bound to the provider, verifier and redirect URI', async () => {
      const result = await controller.start('google', { redirectUri: ALLOWED_REDIRECT_URI });

      expect(result.authorizeUrl).toContain(result.state);
      const record = await stateStore.consume(result.state);
      expect(record).toMatchObject({ provider: 'google', redirectUri: ALLOWED_REDIRECT_URI });
      expect(typeof record?.codeVerifier).toBe('string');
      expect(record?.codeVerifier.length).toBeGreaterThan(0);

      // Replay: /callback (and this test) already consumed it once.
      expect(await stateStore.consume(result.state)).toBeNull();
    });
  });

  describe('callback', () => {
    it('rejects a state that was never issued', async () => {
      await expect(
        controller.callback('google', { state: 'unknown-state', code: 'code-1' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejects a replayed state — the second redemption of a real one', async () => {
      const { state } = await controller.start('google', { redirectUri: ALLOWED_REDIRECT_URI });
      oauthService.resolveLogin.mockResolvedValue({
        outcome: 'signed_in',
        user: makeUser(),
      } satisfies OAuthMatchResult);

      await controller.callback('google', { state, code: 'code-1' });
      await expect(controller.callback('google', { state, code: 'code-1' })).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('rejects an expired state', async () => {
      // OAUTH_STATE_TTL_SECONDS is a positive-only env value, so an expired
      // record is seeded directly against the store (a negative ttl) rather
      // than through `start`, which can't produce one.
      await stateStore.put(
        'expired-state',
        {
          provider: 'google',
          codeVerifier: 'v',
          redirectUri: ALLOWED_REDIRECT_URI,
          createdAt: Date.now(),
        },
        -1,
      );

      await expect(
        controller.callback('google', { state: 'expired-state', code: 'code-1' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejects a state minted for a different provider', async () => {
      // Only 'google' is wired up today, so simulate the mismatch directly
      // against the store the way a future second provider's state would.
      await stateStore.put(
        'cross-provider-state',
        {
          provider: 'discord',
          codeVerifier: 'v',
          redirectUri: ALLOWED_REDIRECT_URI,
          createdAt: Date.now(),
        },
        600,
      );

      await expect(
        controller.callback('google', { state: 'cross-provider-state', code: 'code-1' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('maps a provider exchange failure to a clear, retryable error', async () => {
      google.exchangeAndFetchIdentity.mockRejectedValue(
        new GoogleOAuthError('token_exchange_failed'),
      );
      const { state } = await controller.start('google', { redirectUri: ALLOWED_REDIRECT_URI });

      await expect(
        controller.callback('google', { state, code: 'bad-code' }),
      ).rejects.toBeInstanceOf(ServiceUnavailableException);
    });

    it('strips an unverified provider email before it ever reaches OAuthService', async () => {
      google.exchangeAndFetchIdentity.mockResolvedValue({
        provider: 'google',
        subject: 'sub-1',
        email: 'unverified@example.com',
        emailVerified: false,
        displayName: 'Kaan',
      });
      oauthService.resolveLogin.mockResolvedValue({
        outcome: 'created',
        user: makeUser(),
      } satisfies OAuthMatchResult);
      const { state } = await controller.start('google', { redirectUri: ALLOWED_REDIRECT_URI });

      await controller.callback('google', { state, code: 'code-1' });

      expect(oauthService.resolveLogin).toHaveBeenCalledWith(
        expect.objectContaining({ email: null, emailVerified: false }),
      );
    });

    it('passes a verified email through unchanged', async () => {
      oauthService.resolveLogin.mockResolvedValue({
        outcome: 'created',
        user: makeUser(),
      } satisfies OAuthMatchResult);
      const { state } = await controller.start('google', { redirectUri: ALLOWED_REDIRECT_URI });

      await controller.callback('google', { state, code: 'code-1' });

      expect(oauthService.resolveLogin).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'player@example.com', emailVerified: true }),
      );
    });

    it('issues session tokens for signed_in / linked / created outcomes', async () => {
      for (const outcome of ['signed_in', 'linked', 'created'] as const) {
        oauthService.resolveLogin.mockResolvedValue({
          outcome,
          user: makeUser({ id: `user-${outcome}` }),
        } satisfies OAuthMatchResult);
        const { state } = await controller.start('google', { redirectUri: ALLOWED_REDIRECT_URI });

        const result = await controller.callback('google', { state, code: 'code-1' });

        expect(result).toEqual({
          accessToken: `access-user-${outcome}`,
          refreshToken: `refresh-user-${outcome}`,
        });
      }
    });

    it('maps an unverified-email conflict to 409 with hasPassword for the caller to message correctly', async () => {
      oauthService.resolveLogin.mockResolvedValue({
        outcome: 'rejected',
        reason: 'unverified_email_conflict',
        hasPassword: true,
      } satisfies OAuthMatchResult);
      const { state } = await controller.start('google', { redirectUri: ALLOWED_REDIRECT_URI });

      await expect(controller.callback('google', { state, code: 'code-1' })).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('maps an account_deleted rejection to 401', async () => {
      oauthService.resolveLogin.mockResolvedValue({
        outcome: 'rejected',
        reason: 'account_deleted',
      } satisfies OAuthMatchResult);
      const { state } = await controller.start('google', { redirectUri: ALLOWED_REDIRECT_URI });

      await expect(controller.callback('google', { state, code: 'code-1' })).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });
  });
});
