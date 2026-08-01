import { Screen } from '@gmrlog/ui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback } from 'react';

import { mapAuthError } from '../../../src/auth/map-auth-error';
import { useConnectivityStore } from '../../../src/state/stores';
import { CommunityComposer } from '../components/community-composer';
import { CommunityErrorState } from '../components/community-error-state';
import { CommunityDetailSkeleton } from '../components/community-skeleton';
import { useCommunity } from '../hooks/use-communities';

/** Edit community modal — PATCH /communities/{id}. */
export function EditCommunityScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const communityId = typeof params.id === 'string' ? params.id : '';
  const isOnline = useConnectivityStore((s) => s.isOnline);
  const detail = useCommunity(communityId);

  const onClose = useCallback(() => {
    router.back();
  }, [router]);

  const onSaved = useCallback(() => {
    router.back();
  }, [router]);

  if (detail.isPending && !detail.community) {
    return (
      <Screen style={{ paddingTop: 0, paddingBottom: 0 }}>
        <CommunityDetailSkeleton />
      </Screen>
    );
  }

  if (detail.isError || !detail.community) {
    const mapped = mapAuthError(detail.error, isOnline);
    return (
      <Screen style={{ paddingTop: 0, paddingBottom: 0 }}>
        <CommunityErrorState
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
    <CommunityComposer
      mode="edit"
      community={detail.community}
      onClose={onClose}
      onSaved={onSaved}
    />
  );
}
