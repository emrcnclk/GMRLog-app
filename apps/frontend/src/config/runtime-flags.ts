import { loadFrontendEnv, type FrontendEnv } from '../../lib/env';

let cachedEnv: FrontendEnv | null = null;

export function getFrontendEnv(): FrontendEnv {
  cachedEnv ??= loadFrontendEnv();
  return cachedEnv;
}

/** True only for local development builds — never in production releases. */
export function isDevelopmentBuild(): boolean {
  const env = getFrontendEnv();
  if (env.APP_ENV !== 'development') {
    return false;
  }
  if (typeof __DEV__ !== 'undefined' && !__DEV__) {
    return false;
  }
  return true;
}

/** Production / staging release — strip debug surfaces. */
export function isProductionLike(): boolean {
  const env = getFrontendEnv().APP_ENV;
  return env === 'production' || env === 'staging';
}

export function getApiBaseUrl(): string {
  return getFrontendEnv().EXPO_PUBLIC_API_URL;
}

/** Release feature flags — documentation only toggles; no invented product flags. */
export interface ReleaseFlags {
  /** Enable query persistence (always true in D3.15). */
  queryPersistence: boolean;
  /** Enable offline mutation queue for allowlisted kinds. */
  offlineMutationQueue: boolean;
  /** Monitoring providers enabled — false until a later sprint wires SDKs. */
  monitoringProvidersEnabled: boolean;
}

export function getReleaseFlags(): ReleaseFlags {
  return {
    queryPersistence: true,
    offlineMutationQueue: true,
    monitoringProvidersEnabled: false,
  };
}
