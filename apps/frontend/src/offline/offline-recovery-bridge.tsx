import { onlineManager, useQueryClient } from '@tanstack/react-query';
import { useEffect, type ReactNode } from 'react';

import { useApiClient } from '../api/api-provider';
import { getLogger } from '../logging/logger';
import { useConnectivityStore } from '../state/stores';

import { loadOfflineMutationQueue } from './mutation-queue';
import { flushOfflineMutationQueue } from './mutation-replay';

/**
 * On reconnect: resume paused RQ mutations · flush durable allowlisted queue.
 */
export function OfflineRecoveryBridge({ children }: { children: ReactNode }) {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const isOnline = useConnectivityStore((s) => s.isOnline);
  const setSyncing = useConnectivityStore((s) => s.setSyncing);
  const setPendingMutations = useConnectivityStore((s) => s.setPendingMutations);

  useEffect(() => {
    let cancelled = false;

    async function refreshPending(): Promise<void> {
      const snapshot = await loadOfflineMutationQueue();
      if (!cancelled) {
        setPendingMutations(snapshot.items.length);
      }
    }

    void refreshPending();
    return () => {
      cancelled = true;
    };
  }, [setPendingMutations]);

  useEffect(() => {
    onlineManager.setOnline(isOnline);

    if (!isOnline) {
      return;
    }

    let cancelled = false;

    async function recover(): Promise<void> {
      setSyncing(true);
      try {
        await queryClient.resumePausedMutations();
        const result = await flushOfflineMutationQueue(api);
        getLogger().info('offline recovery complete', result);
        const snapshot = await loadOfflineMutationQueue();
        if (!cancelled) {
          setPendingMutations(snapshot.items.length);
        }
      } catch (error) {
        getLogger().warn('offline recovery failed', {
          message: error instanceof Error ? error.message : 'unknown',
        });
      } finally {
        if (!cancelled) {
          setSyncing(false);
        }
      }
    }

    void recover();
    return () => {
      cancelled = true;
    };
  }, [api, isOnline, queryClient, setPendingMutations, setSyncing]);

  return children;
}
