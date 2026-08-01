import type { CommunityResponse } from '@gmrlog/types';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';

import { CommunityComposer } from '../components/community-composer';

/** Create community modal — POST /communities. */
export function CreateCommunityScreen() {
  const router = useRouter();

  const onClose = useCallback(() => {
    router.back();
  }, [router]);

  const onSaved = useCallback(
    (community: CommunityResponse) => {
      router.replace(`/(app)/community/${community.id}`);
    },
    [router],
  );

  return <CommunityComposer mode="create" onClose={onClose} onSaved={onSaved} />;
}
