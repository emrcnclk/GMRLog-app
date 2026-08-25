import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { parseBackendEnv } from '../../infrastructure/config/env.schema';
import type { AuthenticatedIdentity } from '../interfaces/identity';

import { MemoryOAuthStateStore } from './oauth-state.store';
import { OAuthController } from './oauth.controller';
import type {
  OAuthConnectResult,
  OAuthDisconnectResult,
  OAuthIdentity,
  OAuthMatchResult,
} from './oauth.types';
import { DiscordOAuthError } from './providers/discord.provider';
import { GoogleOAuthError } from './providers/google.provider';

const CALLER: AuthenticatedIdentity = { class: 'player', userId: 'user-1' };

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
    firstName: null,
    lastName: null,
    birthDate: null,
    countryCode: null,
    creatorFeatured: false,
    accountKind: 'individual' as const,
    cardNumber: 1,
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

function createFakeDiscordProvider() {
  return {
    isEnabled: vi.fn(() => true),
    buildAuthorizeUrl: vi.fn(
      ({ state }: { state: string }) => `https://discord.com/oauth2/authorize?state=${state}`,
    ),
    exchangeAndFetchIdentity: vi.fn<() => Promise<OAuthIdentity>>(async () => ({
      provider: 'discord',
      subject: 'sub-discord-1',
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
    DISCORD_OAUTH_CLIENT_ID: 'discord-client-id',
    DISCORD_OAUTH_CLIENT_SECRET: 'discord-client-secret',
    DISCORD_OAUTH_ALLOWED_REDIRECT_URIS: ALLOWED_REDIRECT_URI,
    OAUTH_STATE_TTL_SECONDS: '600',
    ...overrides,
  });
}

describe('OAuthController', () => {
  let stateStore: MemoryOAuthStateStore;
  let google: ReturnType<typeof createFakeGoogleProvider>;
  let discord: ReturnType<typeof createFakeDiscordProvider>;
  let oauthService: {
    resolveLogin: ReturnType<typeof vi.fn>;
    connectLogin: ReturnType<typeof vi.fn>;
    disconnectLogin: ReturnType<typeof vi.fn>;
  };
  let sessions: { issueCredentialPair: ReturnType<typeof vi.fn> };
  let controller: OAuthController;

  beforeEach(() => {
    stateStore = new MemoryOAuthStateStore();
    google = createFakeGoogleProvider();
    discord = createFakeDiscordProvider();
    oauthService = { resolveLogin: vi.fn(), connectLogin: vi.fn(), disconnectLogin: vi.fn() };
    sessions = {
      issueCredentialPair: vi.fn(async (userId: string) => ({
        accessToken: `access-${userId}`,
        refreshToken: `refresh-${userId}`,
      })),
    };
    controller = new OAuthController(
      google as never,
      discord as never,
      stateStore as never,
      oauthService as never,
      sessions as never,
      createEnv(),
    );
  });

  describe('start', () => {
    it('rejects an unsupported provider', async () => {
      await expect(
        controller.start('steam', { redirectUri: ALLOWED_REDIRECT_URI }),
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
      // A state minted by /start/discord must not redeem against /callback/google.
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

  describe('discord (task 4.4)', () => {
    it('completes start + callback end to end, independent of google', async () => {
      oauthService.resolveLogin.mockResolvedValue({
        outcome: 'created',
        user: makeUser({ id: 'user-discord' }),
      } satisfies OAuthMatchResult);

      const { state, authorizeUrl } = await controller.start('discord', {
        redirectUri: ALLOWED_REDIRECT_URI,
      });
      expect(authorizeUrl).toContain('discord.com');

      const result = await controller.callback('discord', { state, code: 'code-1' });

      expect(result).toEqual({
        accessToken: 'access-user-discord',
        refreshToken: 'refresh-user-discord',
      });
      expect(oauthService.resolveLogin).toHaveBeenCalledWith(
        expect.objectContaining({ provider: 'discord', subject: 'sub-discord-1' }),
      );
    });

    it('fails closed when Discord is not configured', async () => {
      discord.isEnabled.mockReturnValue(false);
      await expect(
        controller.start('discord', { redirectUri: ALLOWED_REDIRECT_URI }),
      ).rejects.toBeInstanceOf(ServiceUnavailableException);
    });

    it("rejects a redirectUri outside Discord's own allowlist, even if Google's would match", async () => {
      const scopedEnv = createEnv({
        DISCORD_OAUTH_ALLOWED_REDIRECT_URIS: 'https://discord-only.example/cb',
      });
      controller = new OAuthController(
        google as never,
        discord as never,
        stateStore as never,
        oauthService as never,
        sessions as never,
        scopedEnv,
      );

      await expect(
        controller.start('discord', { redirectUri: ALLOWED_REDIRECT_URI }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('maps a Discord exchange failure to a clear, retryable error naming Discord', async () => {
      discord.exchangeAndFetchIdentity.mockRejectedValue(new DiscordOAuthError('userinfo_failed'));
      const { state } = await controller.start('discord', { redirectUri: ALLOWED_REDIRECT_URI });

      await expect(
        controller.callback('discord', { state, code: 'bad-code' }),
      ).rejects.toBeInstanceOf(ServiceUnavailableException);
    });

    it('strips an unverified Discord email before it reaches OAuthService', async () => {
      discord.exchangeAndFetchIdentity.mockResolvedValue({
        provider: 'discord',
        subject: 'sub-discord-1',
        email: 'unverified@example.com',
        emailVerified: false,
        displayName: 'Kaan',
      });
      oauthService.resolveLogin.mockResolvedValue({
        outcome: 'created',
        user: makeUser(),
      } satisfies OAuthMatchResult);
      const { state } = await controller.start('discord', { redirectUri: ALLOWED_REDIRECT_URI });

      await controller.callback('discord', { state, code: 'code-1' });

      expect(oauthService.resolveLogin).toHaveBeenCalledWith(
        expect.objectContaining({ email: null, emailVerified: false }),
      );
    });

    it('passes an emailless Discord identity straight through — no capture step at this layer', async () => {
      discord.exchangeAndFetchIdentity.mockResolvedValue({
        provider: 'discord',
        subject: 'sub-discord-no-email',
        email: null,
        emailVerified: false,
        displayName: 'Kaan',
      });
      oauthService.resolveLogin.mockResolvedValue({
        outcome: 'created',
        user: makeUser({ id: 'user-no-email' }),
      } satisfies OAuthMatchResult);
      const { state } = await controller.start('discord', { redirectUri: ALLOWED_REDIRECT_URI });

      const result = await controller.callback('discord', { state, code: 'code-1' });

      expect(result).toEqual({
        accessToken: 'access-user-no-email',
        refreshToken: 'refresh-user-no-email',
      });
      expect(oauthService.resolveLogin).toHaveBeenCalledWith(
        expect.objectContaining({ email: null, emailVerified: false }),
      );
    });

    it('maps an unverified-email conflict to 409 naming Discord as the connect target', async () => {
      oauthService.resolveLogin.mockResolvedValue({
        outcome: 'rejected',
        reason: 'unverified_email_conflict',
        hasPassword: true,
      } satisfies OAuthMatchResult);
      const { state } = await controller.start('discord', { redirectUri: ALLOWED_REDIRECT_URI });

      await expect(controller.callback('discord', { state, code: 'code-1' })).rejects.toMatchObject(
        {
          response: expect.objectContaining({
            message: expect.stringContaining('connect Discord'),
          }),
        },
      );
    });
  });

  describe('connectStart / connectCallback (task 4.7)', () => {
    it('binds the minted state to the authenticated caller', async () => {
      const { state } = await controller.connectStart(CALLER, 'google', {
        redirectUri: ALLOWED_REDIRECT_URI,
      });

      const record = await stateStore.consume(state);
      expect(record).toMatchObject({ provider: 'google', userId: 'user-1' });
    });

    it('rejects a connect callback whose state was minted by plain /start (no bound userId)', async () => {
      const { state } = await controller.start('google', { redirectUri: ALLOWED_REDIRECT_URI });

      await expect(
        controller.connectCallback('google', { state, code: 'code-1' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('attaches the resulting identity to the bound caller, never a login-matched account', async () => {
      oauthService.connectLogin.mockResolvedValue({
        outcome: 'connected',
      } satisfies OAuthConnectResult);
      const { state } = await controller.connectStart(CALLER, 'google', {
        redirectUri: ALLOWED_REDIRECT_URI,
      });

      const result = await controller.connectCallback('google', { state, code: 'code-1' });

      expect(result).toEqual({ connected: true });
      expect(oauthService.connectLogin).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({ provider: 'google', subject: 'sub-1' }),
      );
    });

    it('treats already_connected as a successful no-op', async () => {
      oauthService.connectLogin.mockResolvedValue({
        outcome: 'already_connected',
      } satisfies OAuthConnectResult);
      const { state } = await controller.connectStart(CALLER, 'google', {
        redirectUri: ALLOWED_REDIRECT_URI,
      });

      const result = await controller.connectCallback('google', { state, code: 'code-1' });

      expect(result).toEqual({ connected: true });
    });

    it('maps identity_in_use to 409', async () => {
      oauthService.connectLogin.mockResolvedValue({
        outcome: 'rejected',
        reason: 'identity_in_use',
      } satisfies OAuthConnectResult);
      const { state } = await controller.connectStart(CALLER, 'google', {
        redirectUri: ALLOWED_REDIRECT_URI,
      });

      await expect(
        controller.connectCallback('google', { state, code: 'code-1' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('disconnect (task 4.7 last-sign-in-method guard)', () => {
    it('disconnects when the guard allows it', async () => {
      oauthService.disconnectLogin.mockResolvedValue({
        outcome: 'disconnected',
      } satisfies OAuthDisconnectResult);

      const result = await controller.disconnect(CALLER, 'google');

      expect(result).toEqual({ disconnected: true });
      expect(oauthService.disconnectLogin).toHaveBeenCalledWith('user-1', 'google');
    });

    it('maps the last-method guard rejection to 409 with actionable copy', async () => {
      oauthService.disconnectLogin.mockResolvedValue({
        outcome: 'rejected',
        reason: 'last_method',
      } satisfies OAuthDisconnectResult);

      await expect(controller.disconnect(CALLER, 'google')).rejects.toMatchObject({
        response: expect.objectContaining({
          code: 'LAST_SIGN_IN_METHOD',
          message: expect.stringContaining('Set a password'),
        }),
      });
    });

    it('maps not_connected to 404', async () => {
      oauthService.disconnectLogin.mockResolvedValue({
        outcome: 'rejected',
        reason: 'not_connected',
      } satisfies OAuthDisconnectResult);

      await expect(controller.disconnect(CALLER, 'google')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
