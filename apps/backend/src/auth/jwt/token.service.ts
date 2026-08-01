import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { ENV } from '../../infrastructure/config/config.module';
import type { BackendEnv } from '../../infrastructure/config/env.schema';
import {
  isAccessTokenPayload,
  isRefreshTokenPayload,
  type AccessTokenPayload,
  type RefreshTokenPayload,
} from '../tokens/token.types';

/**
 * Access / refresh token abstraction (D1.4). Signing and verification only —
 * session persistence, rotation and revocation are D2+ concerns.
 * Secrets never leave this process (F6.7 Part C).
 */
@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    @Inject(ENV) private readonly env: BackendEnv,
  ) {}

  async signAccessToken(userId: string, sessionId?: string): Promise<string> {
    const payload: AccessTokenPayload = {
      sub: userId,
      kind: 'access',
      ...(sessionId ? { sessionId } : {}),
    };
    return this.jwt.signAsync(payload, { expiresIn: this.env.JWT_ACCESS_TTL_SECONDS });
  }

  async signRefreshToken(userId: string, sessionId?: string): Promise<string> {
    const payload: RefreshTokenPayload = {
      sub: userId,
      kind: 'refresh',
      ...(sessionId ? { sessionId } : {}),
    };
    return this.jwt.signAsync(payload, { expiresIn: this.env.JWT_REFRESH_TTL_SECONDS });
  }

  /** Returns the payload for a valid access token, `null` otherwise (fail-closed). */
  async verifyAccessToken(token: string): Promise<AccessTokenPayload | null> {
    const payload = await this.verify(token);
    return payload !== null && isAccessTokenPayload(payload) ? payload : null;
  }

  /** Returns the payload for a valid refresh token, `null` otherwise (fail-closed). */
  async verifyRefreshToken(token: string): Promise<RefreshTokenPayload | null> {
    const payload = await this.verify(token);
    return payload !== null && isRefreshTokenPayload(payload) ? payload : null;
  }

  private async verify(token: string): Promise<unknown> {
    try {
      return await this.jwt.verifyAsync<Record<string, unknown>>(token);
    } catch {
      return null;
    }
  }
}
