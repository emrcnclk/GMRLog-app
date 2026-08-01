import type { TierListResponse } from '@gmrlog/types';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';

import { TierComposer } from '../components/tier-composer';

export function CreateTierListScreen() {
  const router = useRouter();
  const onClose = useCallback(() => {
    router.back();
  }, [router]);
  const onSaved = useCallback(
    (tierList: TierListResponse) => {
      router.replace(`/(app)/tier-list/${tierList.id}/builder`);
    },
    [router],
  );
  return <TierComposer mode="create" onClose={onClose} onSaved={onSaved} />;
}
