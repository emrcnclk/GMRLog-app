import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);

const SCRYPT_KEY_LENGTH = 64;
const SALT_BYTES = 16;

/**
 * Password hashing helpers (AUTHENTICATION.md · node:crypto scrypt).
 * Stored form: `saltHex:hashHex`. Never log plaintext or derived keys.
 */

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES).toString('hex');
  const derived = (await scryptAsync(password, salt, SCRYPT_KEY_LENGTH)) as Buffer;
  return `${salt}:${derived.toString('hex')}`;
}

export async function verifyPassword(password: string, secretHash: string): Promise<boolean> {
  const separator = secretHash.indexOf(':');
  if (separator <= 0 || separator === secretHash.length - 1) {
    return false;
  }
  const salt = secretHash.slice(0, separator);
  const expectedHex = secretHash.slice(separator + 1);
  let expected: Buffer;
  try {
    expected = Buffer.from(expectedHex, 'hex');
  } catch {
    return false;
  }
  if (expected.length !== SCRYPT_KEY_LENGTH) {
    return false;
  }
  const derived = (await scryptAsync(password, salt, SCRYPT_KEY_LENGTH)) as Buffer;
  return timingSafeEqual(expected, derived);
}
