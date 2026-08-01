import type { UploadGrantResponse, UploadPurposeValue, UploadResponse } from '@gmrlog/types';

import type { UploadContentTypeInput } from './upload-types';

export type { UploadContentTypeInput } from './upload-types';

export interface UploadAsset {
  uri: string;
  contentType: UploadContentTypeInput;
  byteSize: number;
}

export interface UploadApi {
  createUploadGrant(body: {
    purpose: UploadPurposeValue;
    contentType: UploadContentTypeInput;
    byteSize: number;
  }): Promise<{ data: UploadGrantResponse }>;
  confirmUpload(body: { grantId: string; storageKey: string }): Promise<{ data: UploadResponse }>;
}

export type UploadPutFn = (
  uploadUrl: string,
  headers: Record<string, string>,
  body: Blob | ArrayBuffer | Uint8Array,
) => Promise<void>;

export type UploadReadUriFn = (uri: string) => Promise<Blob | ArrayBuffer | Uint8Array>;

export interface UploadManagerOptions {
  api: UploadApi;
  putBytes?: UploadPutFn;
  readUri?: UploadReadUriFn;
}

async function defaultReadUri(uri: string): Promise<Blob> {
  const response = await fetch(uri);
  if (!response.ok) {
    throw new Error('Could not read selected image');
  }
  return response.blob();
}

async function defaultPutBytes(
  uploadUrl: string,
  headers: Record<string, string>,
  body: Blob | ArrayBuffer | Uint8Array,
): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers,
    body: body as BodyInit,
  });
  if (!response.ok) {
    throw new Error(`Upload transfer failed (${String(response.status)})`);
  }
}

/**
 * Grant → PUT uploadUrl → confirm. No S3 client · no editing · no compression.
 */
export class UploadManager {
  private readonly api: UploadApi;
  private readonly putBytes: UploadPutFn;
  private readonly readUri: UploadReadUriFn;

  constructor(options: UploadManagerOptions) {
    this.api = options.api;
    this.putBytes = options.putBytes ?? defaultPutBytes;
    this.readUri = options.readUri ?? defaultReadUri;
  }

  async upload(
    purpose: UploadPurposeValue,
    asset: UploadAsset,
    onProgress?: (progress: number) => void,
  ): Promise<UploadResponse> {
    onProgress?.(0.15);
    const grantEnvelope = await this.api.createUploadGrant({
      purpose,
      contentType: asset.contentType,
      byteSize: asset.byteSize,
    });
    const grant = grantEnvelope.data;

    onProgress?.(0.4);
    const bytes = await this.readUri(asset.uri);
    await this.putBytes(grant.uploadUrl, grant.headers, bytes);

    onProgress?.(0.8);
    const confirmed = await this.api.confirmUpload({
      grantId: grant.grantId,
      storageKey: grant.storageKey,
    });
    onProgress?.(1);
    return confirmed.data;
  }
}
