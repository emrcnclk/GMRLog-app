import type {
  ObjectHeadResult,
  ObjectStoragePort,
  PresignedPutResult,
} from './object-storage.port';

interface StoredObject {
  body: Buffer;
  contentType: string;
}

/**
 * In-memory object storage for unit tests — no network.
 */
export class MemoryObjectStorage implements ObjectStoragePort {
  readonly objects = new Map<string, StoredObject>();

  createPresignedPut(input: {
    storageKey: string;
    contentType: string;
    byteSize: number;
    expiresInSeconds: number;
  }): Promise<PresignedPutResult> {
    void input.byteSize;
    const expiresAt = new Date(Date.now() + input.expiresInSeconds * 1000);
    return Promise.resolve({
      uploadUrl: `memory://put/${encodeURIComponent(input.storageKey)}`,
      headers: {
        'Content-Type': input.contentType,
        'Content-Length': String(input.byteSize),
      },
      expiresAt,
    });
  }

  headObject(storageKey: string): Promise<ObjectHeadResult | null> {
    const row = this.objects.get(storageKey);
    if (row == null) {
      return Promise.resolve(null);
    }
    return Promise.resolve({
      contentLength: row.body.byteLength,
      contentType: row.contentType,
      etag: `"${row.body.byteLength.toString(16)}"`,
    });
  }

  getObjectBuffer(storageKey: string): Promise<Buffer | null> {
    const row = this.objects.get(storageKey);
    return Promise.resolve(row?.body ?? null);
  }

  putObject(storageKey: string, body: Buffer, contentType: string): Promise<void> {
    this.objects.set(storageKey, { body, contentType });
    return Promise.resolve();
  }

  deleteObject(storageKey: string): Promise<void> {
    this.objects.delete(storageKey);
    return Promise.resolve();
  }

  deleteMany(storageKeys: readonly string[]): Promise<number> {
    let count = 0;
    for (const key of storageKeys) {
      if (this.objects.delete(key)) {
        count += 1;
      }
    }
    return Promise.resolve(count);
  }

  ping(): Promise<boolean> {
    return Promise.resolve(true);
  }

  /** Test helper — simulate client PUT after grant. */
  simulateClientPut(storageKey: string, body: Buffer, contentType: string): void {
    this.objects.set(storageKey, { body, contentType });
  }
}
