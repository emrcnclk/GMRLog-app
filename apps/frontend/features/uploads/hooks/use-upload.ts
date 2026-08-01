import type { UploadPurposeValue, UploadResponse } from '@gmrlog/types';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useMemo, useRef, useState } from 'react';

import { useApiClient } from '../../../src/api/api-provider';
import { UploadManager, type UploadAsset } from '../upload-manager';
import {
  INITIAL_UPLOAD_UI_STATE,
  guessMimeFromUri,
  mapMimeToUploadContentType,
  resolveUploadPhaseFromProgress,
  type UploadUiState,
} from '../upload-types';

export interface UseUploadResult extends UploadUiState {
  isBusy: boolean;
  upload: (purpose: UploadPurposeValue, asset?: UploadAsset) => Promise<UploadResponse | null>;
  pickAndUpload: (purpose: UploadPurposeValue) => Promise<UploadResponse | null>;
  retry: () => Promise<UploadResponse | null>;
  reset: () => void;
}

async function pickImageAsset(): Promise<UploadAsset | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Photo library permission is required');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: false,
    quality: 1,
  });

  if (result.canceled || result.assets.length === 0) {
    return null;
  }

  const asset = result.assets[0];
  if (!asset) {
    return null;
  }
  const contentType =
    mapMimeToUploadContentType(asset.mimeType) ?? guessMimeFromUri(asset.uri) ?? 'image/jpeg';
  const byteSize = asset.fileSize ?? 0;
  if (byteSize <= 0) {
    throw new Error('Could not determine image size');
  }

  return {
    uri: asset.uri,
    contentType,
    byteSize,
  };
}

export function useUpload(): UseUploadResult {
  const api = useApiClient();
  const manager = useMemo(() => new UploadManager({ api }), [api]);
  const [state, setState] = useState<UploadUiState>(INITIAL_UPLOAD_UI_STATE);
  const lastRef = useRef<{ purpose: UploadPurposeValue; asset: UploadAsset } | null>(null);

  const reset = useCallback(() => {
    setState(INITIAL_UPLOAD_UI_STATE);
    lastRef.current = null;
  }, []);

  const runUpload = useCallback(
    async (purpose: UploadPurposeValue, asset: UploadAsset): Promise<UploadResponse | null> => {
      lastRef.current = { purpose, asset };
      setState({
        phase: 'granting',
        progress: 0.1,
        error: null,
        uploadId: null,
      });
      try {
        const upload = await manager.upload(purpose, asset, (progress) => {
          setState((prev) => ({
            ...prev,
            phase: resolveUploadPhaseFromProgress(progress),
            progress,
            error: null,
          }));
        });
        setState({
          phase: 'success',
          progress: 1,
          error: null,
          uploadId: upload.id,
        });
        return upload;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Upload failed';
        setState({
          phase: 'failure',
          progress: 0,
          error: message,
          uploadId: null,
        });
        return null;
      }
    },
    [manager],
  );

  const upload = useCallback(
    async (purpose: UploadPurposeValue, asset?: UploadAsset): Promise<UploadResponse | null> => {
      if (asset) {
        return await runUpload(purpose, asset);
      }
      setState((prev) => ({ ...prev, phase: 'picking', error: null }));
      try {
        const picked = await pickImageAsset();
        if (!picked) {
          setState(INITIAL_UPLOAD_UI_STATE);
          return null;
        }
        return await runUpload(purpose, picked);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Could not pick image';
        setState({
          phase: 'failure',
          progress: 0,
          error: message,
          uploadId: null,
        });
        return null;
      }
    },
    [runUpload],
  );

  const pickAndUpload = useCallback(
    async (purpose: UploadPurposeValue) => {
      return await upload(purpose);
    },
    [upload],
  );

  const retry = useCallback(async (): Promise<UploadResponse | null> => {
    const last = lastRef.current;
    if (!last) {
      return null;
    }
    return await runUpload(last.purpose, last.asset);
  }, [runUpload]);

  return {
    ...state,
    isBusy:
      state.phase === 'picking' ||
      state.phase === 'granting' ||
      state.phase === 'uploading' ||
      state.phase === 'confirming',
    upload,
    pickAndUpload,
    retry,
    reset,
  };
}
