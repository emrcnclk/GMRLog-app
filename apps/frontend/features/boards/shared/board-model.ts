import { FrontendApiError } from '../../../src/api/axios-client';
import { mapAuthError, type AuthUiError } from '../../../src/auth/map-auth-error';

/** Maps board mutation failures — adds 409 duplicate copy. */
export function mapBoardError(error: unknown, isOnline: boolean): AuthUiError {
  if (error instanceof FrontendApiError && error.status === 409) {
    return {
      kind: 'validation',
      title: 'Duplicate game',
      description:
        error.message || 'That game is already on this board. Remove it first or pick another.',
    };
  }
  return mapAuthError(error, isOnline);
}

export function formatUpdatedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export type ListViewStatus = 'loading' | 'error' | 'empty' | 'ready';

export interface ListViewModel<T> {
  status: ListViewStatus;
  items: T[];
  error: unknown;
  isRefreshing: boolean;
}

export function resolveListView<T>(input: {
  isPending: boolean;
  isError: boolean;
  error: unknown;
  items: T[];
  isRefreshing: boolean;
}): ListViewModel<T> {
  if (input.isPending && input.items.length === 0) {
    return { status: 'loading', items: [], error: null, isRefreshing: false };
  }
  if (input.isError && input.items.length === 0) {
    return {
      status: 'error',
      items: [],
      error: input.error,
      isRefreshing: input.isRefreshing,
    };
  }
  if (input.items.length === 0) {
    return {
      status: 'empty',
      items: [],
      error: null,
      isRefreshing: input.isRefreshing,
    };
  }
  return {
    status: 'ready',
    items: input.items,
    error: input.error,
    isRefreshing: input.isRefreshing,
  };
}

export function isDirtyValues<T extends Record<string, unknown>>(current: T, baseline: T): boolean {
  return JSON.stringify(current) !== JSON.stringify(baseline);
}
