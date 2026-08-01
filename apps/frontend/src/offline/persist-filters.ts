import type { Query } from '@tanstack/react-query';

/**
 * Persist successful queries except ephemeral search.
 * Mutations dehydrate only when marked durable + paused (offline retry).
 */
export function shouldPersistQuery(query: Pick<Query, 'queryKey' | 'state'>): boolean {
  const root = query.queryKey[0];
  if (root === 'search') {
    return false;
  }
  if (root === 'health') {
    return false;
  }
  return query.state.status === 'success';
}

export function shouldPersistMutation(mutation: {
  options: { meta?: Record<string, unknown> };
  state: { isPaused: boolean };
}): boolean {
  return mutation.options.meta?.durable === true && mutation.state.isPaused;
}

export function createPersistDehydrateOptions(): {
  shouldDehydrateQuery: (query: Pick<Query, 'queryKey' | 'state'>) => boolean;
  shouldDehydrateMutation: (mutation: {
    options: { meta?: Record<string, unknown> };
    state: { isPaused: boolean };
  }) => boolean;
} {
  return {
    shouldDehydrateQuery: shouldPersistQuery,
    shouldDehydrateMutation: shouldPersistMutation,
  };
}
