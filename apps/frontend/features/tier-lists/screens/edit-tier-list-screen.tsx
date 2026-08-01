import { Screen } from '@gmrlog/ui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback } from 'react';

import { useConnectivityStore } from '../../../src/state/stores';
import { mapBoardError } from '../../boards/shared/board-model';
import { TierComposer } from '../components/tier-composer';
import { TierErrorState } from '../components/tier-error-state';
import { TierDetailSkeleton } from '../components/tier-skeleton';
import { useTierList } from '../hooks/use-tier-lists';

export function EditTierListScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const tierListId = typeof params.id === 'string' ? params.id : '';
  const isOnline = useConnectivityStore((s) => s.isOnline);
  const detail = useTierList(tierListId);

  const onClose = useCallback(() => {
    router.back();
  }, [router]);
  const onSaved = useCallback(() => {
    router.back();
  }, [router]);

  if (detail.isPending && !detail.tierList) {
    return (
      <Screen style={{ paddingTop: 0, paddingBottom: 0 }}>
        <TierDetailSkeleton />
      </Screen>
    );
  }

  if (detail.isError || !detail.tierList) {
    const mapped = mapBoardError(detail.error, isOnline);
    return (
      <Screen style={{ paddingTop: 0, paddingBottom: 0 }}>
        <TierErrorState
          title={mapped.title}
          description={mapped.description}
          isOffline={!isOnline}
          onRetry={() => {
            void detail.refetch();
          }}
        />
      </Screen>
    );
  }

  return (
    <TierComposer mode="edit" tierList={detail.tierList} onClose={onClose} onSaved={onSaved} />
  );
}
