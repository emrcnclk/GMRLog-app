export interface PresignedPutResult {
  uploadUrl: string;
  headers: Record<string, string>;
  expiresAt: Date;
}

export interface ObjectHeadResult {
  contentLength: number;
  contentType: string | null;
  etag: string | null;
}

/**
 * S3-compatible object storage port (D3.19). MinIO locally; R2/AWS via env.
 */
export interface ObjectStoragePort {
  createPresignedPut(input: {
    storageKey: string;
    contentType: string;
    byteSize: number;
    expiresInSeconds: number;
  }): Promise<PresignedPutResult>;
  headObject(storageKey: string): Promise<ObjectHeadResult | null>;
  getObjectBuffer(storageKey: string): Promise<Buffer | null>;
  putObject(storageKey: string, body: Buffer, contentType: string): Promise<void>;
  deleteObject(storageKey: string): Promise<void>;
  deleteMany(storageKeys: readonly string[]): Promise<number>;
  ping(): Promise<boolean>;
}
