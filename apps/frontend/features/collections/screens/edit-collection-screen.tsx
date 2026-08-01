import { Screen } from '@gmrlog/ui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback } from 'react';

import { useConnectivityStore } from '../../../src/state/stores';
import { mapBoardError } from '../../boards/shared/board-model';
import { CollectionComposer } from '../components/collection-composer';
import { CollectionErrorState } from '../components/collection-error-state';
import { CollectionDetailSkeleton } from '../components/collection-skeleton';
import { useCollection } from '../hooks/use-collections';

export function EditCollectionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const collectionId = typeof params.id === 'string' ? params.id : '';
  const isOnline = useConnectivityStore((s) => s.isOnline);
  const detail = useCollection(collectionId);

  const onClose = useCallback(() => {
    router.back();
  }, [router]);

  const onSaved = useCallback(() => {
    router.back();
  }, [router]);

  if (detail.isPending && !detail.collection) {
    return (
      <Screen style={{ paddingTop: 0, paddingBottom: 0 }}>
        <CollectionDetailSkeleton />
      </Screen>
    );
  }

  if (detail.isError || !detail.collection) {
    const mapped = mapBoardError(detail.error, isOnline);
    return (
      <Screen style={{ paddingTop: 0, paddingBottom: 0 }}>
        <CollectionErrorState
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
    <CollectionComposer
      mode="edit"
      collection={detail.collection}
      onClose={onClose}
      onSaved={onSaved}
    />
  );
}
