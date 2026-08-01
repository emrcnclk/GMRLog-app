import { UPLOAD_CONTENT_TYPES } from '@gmrlog/validators';

export type UploadContentTypeInput = (typeof UPLOAD_CONTENT_TYPES)[number];

export type UploadUiPhase =
  'idle' | 'picking' | 'granting' | 'uploading' | 'confirming' | 'success' | 'failure';

export interface UploadUiState {
  phase: UploadUiPhase;
  progress: number;
  error: string | null;
  uploadId: string | null;
}

export const INITIAL_UPLOAD_UI_STATE: UploadUiState = {
  phase: 'idle',
  progress: 0,
  error: null,
  uploadId: null,
};

export function resolveUploadPhaseFromProgress(progress: number): UploadUiPhase {
  if (progress < 0.35) {
    return 'granting';
  }
  if (progress < 0.75) {
    return 'uploading';
  }
  if (progress < 1) {
    return 'confirming';
  }
  return 'success';
}

export function mapMimeToUploadContentType(
  mime: string | null | undefined,
): UploadContentTypeInput | null {
  if (!mime) {
    return null;
  }
  const normalized = mime.toLowerCase() as UploadContentTypeInput;
  return (UPLOAD_CONTENT_TYPES as readonly string[]).includes(normalized) ? normalized : null;
}

export function guessMimeFromUri(uri: string): UploadContentTypeInput | null {
  const lower = uri.toLowerCase();
  if (lower.endsWith('.png')) {
    return 'image/png';
  }
  if (lower.endsWith('.webp')) {
    return 'image/webp';
  }
  if (lower.endsWith('.gif')) {
    return 'image/gif';
  }
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) {
    return 'image/jpeg';
  }
  return null;
}
