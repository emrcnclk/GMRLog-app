import type { SessionState } from '@gmrlog/types';

import type { SecureStorage } from '../../lib/storage/secure-storage';

const ACCESS_TOKEN_KEY = 'gmrlog.session.access';
const REFRESH_TOKEN_KEY = 'gmrlog.session.refresh';

export interface SessionMaterial {
  accessToken: string;
  refreshToken: string;
}

export type SessionListener = (state: SessionState) => void;

/**
 * Session manager — token persistence · hydrate · clear · refresh coordination.
 * Platform remains Trust authority; stored material is capability only.
 * Hydration loads tokens without claiming authenticated — bootstrap validates via /me.
 */
export class SessionManager {
  private state: SessionState = 'unknown';
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private readonly listeners = new Set<SessionListener>();

  constructor(private readonly storage: SecureStorage) {}

  getState(): SessionState {
    return this.state;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  getRefreshToken(): string | null {
    return this.refreshToken;
  }

  subscribe(listener: SessionListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Loads tokens into memory. State stays `unknown` until bootstrap / login activates.
   */
  async hydrate(): Promise<SessionMaterial | null> {
    const [accessToken, refreshToken] = await Promise.all([
      this.storage.getItem(ACCESS_TOKEN_KEY),
      this.storage.getItem(REFRESH_TOKEN_KEY),
    ]);

    if (accessToken && refreshToken) {
      this.accessToken = accessToken;
      this.refreshToken = refreshToken;
      return { accessToken, refreshToken };
    }

    this.accessToken = null;
    this.refreshToken = null;
    return null;
  }

  async persistTokens(material: SessionMaterial): Promise<void> {
    await Promise.all([
      this.storage.setItem(ACCESS_TOKEN_KEY, material.accessToken),
      this.storage.setItem(REFRESH_TOKEN_KEY, material.refreshToken),
    ]);
    this.accessToken = material.accessToken;
    this.refreshToken = material.refreshToken;
  }

  async establishSession(material: SessionMaterial): Promise<void> {
    await this.persistTokens(material);
    this.setState('authenticated');
  }

  async clearSession(): Promise<void> {
    await Promise.all([
      this.storage.removeItem(ACCESS_TOKEN_KEY),
      this.storage.removeItem(REFRESH_TOKEN_KEY),
    ]);
    this.accessToken = null;
    this.refreshToken = null;
    this.setState('guest');
  }

  /**
   * Called after a successful `/sessions/refresh` response.
   * Network refresh itself lives in the Axios client to avoid cycles.
   */
  async applyRefreshedTokens(material: SessionMaterial): Promise<void> {
    await this.persistTokens(material);
    if (this.state === 'authenticated') {
      this.notify();
    }
  }

  markAuthenticated(): void {
    this.setState('authenticated');
  }

  markGuest(): void {
    this.setState('guest');
  }

  private setState(next: SessionState): void {
    if (this.state === next) {
      this.notify();
      return;
    }
    this.state = next;
    this.notify();
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }
}
