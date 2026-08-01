import { describe, expect, it } from 'vitest';

import { MemoryObjectStorage } from './memory-object-storage';

describe('MemoryObjectStorage', () => {
  it('creates presigned put metadata without storing the object', async () => {
    const storage = new MemoryObjectStorage();
    const result = await storage.createPresignedPut({
      storageKey: 'uploads/user-1/avatar/key',
      contentType: 'image/png',
      byteSize: 512,
      expiresInSeconds: 300,
    });
    expect(result.uploadUrl).toContain('memory://put/');
    expect(result.headers['Content-Type']).toBe('image/png');
    expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now());
    expect(storage.objects.size).toBe(0);
  });

  it('stores, reads, heads, and deletes objects', async () => {
    const storage = new MemoryObjectStorage();
    const body = Buffer.from('hello');
    await storage.putObject('key-1', body, 'text/plain');

    expect(await storage.headObject('key-1')).toMatchObject({
      contentLength: 5,
      contentType: 'text/plain',
    });
    expect(await storage.getObjectBuffer('key-1')).toEqual(body);
    expect(await storage.headObject('missing')).toBeNull();
    expect(await storage.getObjectBuffer('missing')).toBeNull();

    await storage.deleteObject('key-1');
    expect(await storage.headObject('key-1')).toBeNull();
  });

  it('deleteMany removes only existing keys', async () => {
    const storage = new MemoryObjectStorage();
    await storage.putObject('a', Buffer.from('a'), 'text/plain');
    await storage.putObject('b', Buffer.from('b'), 'text/plain');

    const removed = await storage.deleteMany(['a', 'missing', 'b']);
    expect(removed).toBe(2);
    expect(storage.objects.size).toBe(0);
  });

  it('ping always succeeds and simulateClientPut stores bytes', async () => {
    const storage = new MemoryObjectStorage();
    expect(await storage.ping()).toBe(true);
    storage.simulateClientPut('sim', Buffer.from('x'), 'image/jpeg');
    expect(await storage.getObjectBuffer('sim')).toEqual(Buffer.from('x'));
  });
});
