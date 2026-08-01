import { describe, expect, it } from 'vitest';

import { hashPassword, verifyPassword } from './password';

describe('password helpers', () => {
  it('hashes and verifies a password', async () => {
    const secretHash = await hashPassword('correct-horse');
    await expect(verifyPassword('correct-horse', secretHash)).resolves.toBe(true);
    await expect(verifyPassword('wrong-battery', secretHash)).resolves.toBe(false);
  });

  it('rejects malformed stored hashes', async () => {
    await expect(verifyPassword('x', 'nosalt')).resolves.toBe(false);
    await expect(verifyPassword('x', ':onlyhash')).resolves.toBe(false);
    await expect(verifyPassword('x', 'salt:')).resolves.toBe(false);
    await expect(verifyPassword('x', 'salt:00')).resolves.toBe(false);
  });
});
