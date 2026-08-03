import { useConnectivityStore } from '../state/stores';

import { enqueueOfflineMutation } from './mutation-queue';
import type { OfflineMutationKind } from './supported-mutations';

async function trackEnqueue(
  kind: OfflineMutationKind,
  payload: Record<string, unknown>,
): Promise<void> {
  await enqueueOfflineMutation(kind, payload);
  useConnectivityStore
    .getState()
    .setPendingMutations(useConnectivityStore.getState().pendingMutations + 1);
}

/**
 * Which path `runOrEnqueueOffline{,Result}` took. Callers that invalidate a
 * query in `onSettled` need this: invalidating after an `offline` result
 * refetches the still-stale server, which overwrites the optimistic write the
 * enqueue exists to preserve. Only an `online` result reflects a real
 * round-trip worth reconciling against.
 */
export type OfflineMutationBranch = 'online' | 'offline';

/**
 * When online → run existing API call.
 * When offline → enqueue allowlisted mutation for reconnect flush (optimistic UI already applied).
 * Never invents unsupported offline kinds.
 */
export async function runOrEnqueueOffline(
  kind: OfflineMutationKind,
  payload: Record<string, unknown>,
  onlineFn: () => Promise<void>,
): Promise<OfflineMutationBranch> {
  if (!useConnectivityStore.getState().isOnline) {
    await trackEnqueue(kind, payload);
    return 'offline';
  }
  await onlineFn();
  return 'online';
}

/** Same as runOrEnqueueOffline but returns a value (settings patches). */
export async function runOrEnqueueOfflineResult<T>(
  kind: OfflineMutationKind,
  payload: Record<string, unknown>,
  onlineFn: () => Promise<T>,
  offlineResult: () => T,
): Promise<{ value: T; branch: OfflineMutationBranch }> {
  if (!useConnectivityStore.getState().isOnline) {
    await trackEnqueue(kind, payload);
    return { value: offlineResult(), branch: 'offline' };
  }
  return { value: await onlineFn(), branch: 'online' };
}
