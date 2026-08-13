import { describe, expect, it, vi } from 'vitest';

import { runOAuthSignIn, type OAuthSignInDeps } from './oauth-sign-in-model';

function makeDeps(overrides: Partial<OAuthSignInDeps> = {}): OAuthSignInDeps {
  return {
    oauthStart: vi.fn(async () => ({
      authorizeUrl: 'https://accounts.google.com/authorize?state=state-1',
      state: 'state-1',
    })),
    completeOAuth: vi.fn(async () => undefined),
    openAuthSession: vi.fn(async () => ({
      type: 'success' as const,
      url: 'https://app.gmrlog.test/oauth/callback?code=code-1&state=state-1',
    })),
    makeRedirectUri: vi.fn(() => 'https://app.gmrlog.test/oauth/callback'),
    ...overrides,
  };
}

describe('runOAuthSignIn', () => {
  it('resolves unavailable for a provider with no real backend flow, without starting one', async () => {
    const deps = makeDeps();
    const result = await runOAuthSignIn('discord', deps);

    expect(result).toEqual({ status: 'unavailable', provider: 'discord' });
    expect(deps.oauthStart).not.toHaveBeenCalled();
  });

  it('completes a successful Google round-trip end to end', async () => {
    const deps = makeDeps();

    const result = await runOAuthSignIn('google', deps);

    expect(result).toEqual({ status: 'success' });
    expect(deps.oauthStart).toHaveBeenCalledWith('https://app.gmrlog.test/oauth/callback');
    expect(deps.completeOAuth).toHaveBeenCalledWith({ state: 'state-1', code: 'code-1' });
  });

  it('always sends the state /start returned, never one parsed off the redirect URL', async () => {
    // A tampered/odd redirect URL carrying a different state must not change
    // what gets sent to /callback — the backend already tracks it against
    // the state we hold locally from /start, and that is the value that
    // must round-trip, not whatever the URL happens to say.
    const deps = makeDeps({
      openAuthSession: vi.fn(async () => ({
        type: 'success' as const,
        url: 'https://app.gmrlog.test/oauth/callback?code=code-1&state=attacker-supplied-state',
      })),
    });

    await runOAuthSignIn('google', deps);

    expect(deps.completeOAuth).toHaveBeenCalledWith({ state: 'state-1', code: 'code-1' });
  });

  it('treats a cancelled provider sheet as no error at all (OAUTH.md §4)', async () => {
    const deps = makeDeps({
      openAuthSession: vi.fn(async () => ({ type: 'cancel' as const })),
    });

    const result = await runOAuthSignIn('google', deps);

    expect(result).toEqual({ status: 'cancelled' });
    expect(deps.completeOAuth).not.toHaveBeenCalled();
  });

  it('treats a redirect with no code as cancelled rather than throwing', async () => {
    const deps = makeDeps({
      openAuthSession: vi.fn(async () => ({
        type: 'success' as const,
        url: 'https://app.gmrlog.test/oauth/callback?state=state-1',
      })),
    });

    const result = await runOAuthSignIn('google', deps);

    expect(result).toEqual({ status: 'cancelled' });
    expect(deps.completeOAuth).not.toHaveBeenCalled();
  });

  it('surfaces a failed /start or /callback call as an error result, not a throw', async () => {
    const failure = new Error('network down');
    const deps = makeDeps({
      oauthStart: vi.fn(async () => {
        throw failure;
      }),
    });

    const result = await runOAuthSignIn('google', deps);

    expect(result).toEqual({ status: 'error', error: failure });
  });
});
