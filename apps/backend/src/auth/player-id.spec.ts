import { UnauthorizedException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';

import { playerIdOf } from './player-id';

describe('playerIdOf', () => {
  it('returns the authenticated player id', () => {
    expect(playerIdOf({ class: 'player', userId: 'user-1' })).toBe('user-1');
  });

  it('rejects guest identities', () => {
    expect(() => playerIdOf({ class: 'guest' })).toThrow(UnauthorizedException);
  });
});
