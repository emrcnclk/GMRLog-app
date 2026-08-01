import type { Upload } from '@gmrlog/database';
import type { UploadGrantResponse, UploadResponse } from '@gmrlog/types';

/**
 * Persistence → S1 §15.13 UploadGrantResponse.
 * `uploadUrl` is a short-lived stub grant URL — no cloud secrets (S3 not mounted).
 */
export function toUploadGrantResponse(
  upload: Upload,
  uploadUrl: string,
  expiresAt: Date,
  headers: Record<string, string>,
): UploadGrantResponse {
  return {
    grantId: upload.id,
    uploadUrl,
    storageKey: upload.storageKey,
    expiresAt: expiresAt.toISOString(),
    headers,
  };
}

/** Confirmed upload → media id usable in create DTOs (S1 §16). */
export function toUploadResponse(upload: Upload): UploadResponse {
  return {
    id: upload.id,
    purpose: upload.purpose,
    status: upload.status,
    storageKey: upload.storageKey,
    createdAt: upload.createdAt.toISOString(),
    updatedAt: upload.updatedAt.toISOString(),
  };
}
