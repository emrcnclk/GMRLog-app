import type { ApiErrorBody, ApiErrorCategory, ApiErrorField } from '@gmrlog/types';
import type { ZodError } from 'zod';

/** S1 §7.2 — HTTP status → error category. */
const STATUS_TO_CATEGORY: Readonly<Record<number, ApiErrorCategory>> = {
  400: 'validation',
  401: 'authn',
  403: 'authz',
  404: 'not_found',
  409: 'conflict',
  429: 'rate',
  500: 'internal',
  503: 'unavailable',
};

/** S1 §7.3 — default canonical code per category. */
const CATEGORY_DEFAULT_CODE: Readonly<Record<ApiErrorCategory, string>> = {
  validation: 'VALIDATION_FAILED',
  authn: 'UNAUTHENTICATED',
  authz: 'FORBIDDEN',
  not_found: 'NOT_FOUND',
  conflict: 'CONFLICT_STATE',
  rate: 'RATE_LIMITED',
  unavailable: 'INTEGRATION_UNAVAILABLE',
  internal: 'INTERNAL_ERROR',
};

const RETRYABLE_CATEGORIES: ReadonlySet<ApiErrorCategory> = new Set(['rate', 'unavailable']);

export function statusToCategory(status: number): ApiErrorCategory {
  const mapped = STATUS_TO_CATEGORY[status];
  if (mapped) return mapped;
  // Unmapped statuses collapse to the nearest honest class.
  return status >= 500 ? 'internal' : 'validation';
}

export function defaultCodeForCategory(category: ApiErrorCategory): string {
  return CATEGORY_DEFAULT_CODE[category];
}

export function isRetryableCategory(category: ApiErrorCategory): boolean {
  return RETRYABLE_CATEGORIES.has(category);
}

export interface BuildApiErrorInput {
  status: number;
  requestId: string;
  message: string;
  code?: string;
  fields?: ApiErrorField[];
}

/** Builds the S1 §7.1 error body for a given transport outcome. */
export function buildApiError(input: BuildApiErrorInput): ApiErrorBody {
  const category = statusToCategory(input.status);
  return {
    category,
    code: input.code ?? defaultCodeForCategory(category),
    message: input.message,
    requestId: input.requestId,
    retryable: isRetryableCategory(category),
    ...(input.fields && input.fields.length > 0 ? { fields: input.fields } : {}),
  };
}

/** Zod issues → S1 `error.fields` entries (camelCase dot paths). */
export function zodErrorToFields(error: ZodError): ApiErrorField[] {
  return error.issues.map((issue) => ({
    path: issue.path.join('.'),
    code: issue.code,
    message: issue.message,
  }));
}
