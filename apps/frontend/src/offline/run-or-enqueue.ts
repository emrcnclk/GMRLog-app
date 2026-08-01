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
 * When online → run existing API call.
 * When offline → enqueue allowlisted mutation for reconnect flush (optimistic UI already applied).
 * Never invents unsupported offline kinds.
 */
export async function runOrEnqueueOffline(
  kind: OfflineMutationKind,
  payload: Record<string, unknown>,
  onlineFn: () => Promise<void>,
): Promise<void> {
  if (!useConnectivityStore.getState().isOnline) {
    await trackEnqueue(kind, payload);
    return;
  }
  await onlineFn();
}

/** Same as runOrEnqueueOffline but returns a value (settings patches). */
export async function runOrEnqueueOfflineResult<T>(
  kind: OfflineMutationKind,
  payload: Record<string, unknown>,
  onlineFn: () => Promise<T>,
  offlineResult: () => T,
): Promise<T> {
  if (!useConnectivityStore.getState().isOnline) {
    await trackEnqueue(kind, payload);
    return offlineResult();
  }
  return onlineFn();
}
