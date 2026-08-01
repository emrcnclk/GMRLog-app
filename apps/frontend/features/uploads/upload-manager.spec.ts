import type { UploadGrantResponse, UploadPurposeValue, UploadResponse } from '@gmrlog/types';
import { describe, expect, it, vi } from 'vitest';

import { UploadManager, type UploadApi, type UploadAsset } from './upload-manager';
import {
  guessMimeFromUri,
  mapMimeToUploadContentType,
  resolveUploadPhaseFromProgress,
} from './upload-types';

function grant(): UploadGrantResponse {
  return {
    grantId: 'g1',
    uploadUrl: 'https://upload.gmrlog.local/put/uploads%2Fu1%2Favatar%2Fx',
    storageKey: 'uploads/u1/avatar/x',
    expiresAt: '2026-07-28T01:00:00.000Z',
    headers: { 'Content-Type': 'image/jpeg' },
  };
}

function confirmed(purpose: UploadPurposeValue = 'avatar'): UploadResponse {
  return {
    id: 'up1',
    purpose,
    status: 'confirmed',
    storageKey: 'uploads/u1/avatar/x',
    createdAt: '2026-07-28T00:00:00.000Z',
    updatedAt: '2026-07-28T00:00:00.000Z',
  };
}

const asset: UploadAsset = {
  uri: 'file:///tmp/avatar.jpg',
  contentType: 'image/jpeg',
  byteSize: 1024,
};

describe('UploadManager', () => {
  it('runs grant → put → confirm flow', async () => {
    const api: UploadApi = {
      createUploadGrant: vi.fn(async () => ({ data: grant() })),
      confirmUpload: vi.fn(async () => ({ data: confirmed() })),
    };
    const putBytes = vi.fn(async () => undefined);
    const readUri = vi.fn(async () => new Uint8Array([1, 2, 3]));
    const progress: number[] = [];

    const manager = new UploadManager({ api, putBytes, readUri });
    const result = await manager.upload('avatar', asset, (p) => {
      progress.push(p);
    });

    expect(api.createUploadGrant).toHaveBeenCalledWith({
      purpose: 'avatar',
      contentType: 'image/jpeg',
      byteSize: 1024,
    });
    expect(putBytes).toHaveBeenCalledWith(grant().uploadUrl, grant().headers, expect.anything());
    expect(api.confirmUpload).toHaveBeenCalledWith({
      grantId: 'g1',
      storageKey: 'uploads/u1/avatar/x',
    });
    expect(result.id).toBe('up1');
    expect(result.status).toBe('confirmed');
    expect(progress.at(-1)).toBe(1);
  });

  it('surfaces put failure before confirm', async () => {
    const api: UploadApi = {
      createUploadGrant: vi.fn(async () => ({ data: grant() })),
      confirmUpload: vi.fn(async () => ({ data: confirmed() })),
    };
    const manager = new UploadManager({
      api,
      putBytes: async () => {
        throw new Error('Upload transfer failed (500)');
      },
      readUri: async () => new Uint8Array([1]),
    });

    await expect(manager.upload('banner', asset)).rejects.toThrow('Upload transfer failed');
    expect(api.confirmUpload).not.toHaveBeenCalled();
  });

  it('supports retry by re-running the same asset', async () => {
    let attempts = 0;
    const api: UploadApi = {
      createUploadGrant: vi.fn(async () => ({ data: grant() })),
      confirmUpload: vi.fn(async () => ({ data: confirmed('post_media') })),
    };
    const manager = new UploadManager({
      api,
      putBytes: async () => {
        attempts += 1;
        if (attempts === 1) {
          throw new Error('network');
        }
      },
      readUri: async () => new Uint8Array([9]),
    });

    await expect(manager.upload('post_media', asset)).rejects.toThrow('network');
    const result = await manager.upload('post_media', asset);
    expect(result.purpose).toBe('post_media');
    expect(attempts).toBe(2);
  });
});

describe('upload helpers', () => {
  it('maps mime and uri extensions', () => {
    expect(mapMimeToUploadContentType('image/png')).toBe('image/png');
    expect(mapMimeToUploadContentType('image/svg+xml')).toBeNull();
    expect(guessMimeFromUri('file:///x.WEBP')).toBe('image/webp');
  });

  it('maps progress to phases', () => {
    expect(resolveUploadPhaseFromProgress(0.2)).toBe('granting');
    expect(resolveUploadPhaseFromProgress(0.5)).toBe('uploading');
    expect(resolveUploadPhaseFromProgress(0.9)).toBe('confirming');
    expect(resolveUploadPhaseFromProgress(1)).toBe('success');
  });
});
