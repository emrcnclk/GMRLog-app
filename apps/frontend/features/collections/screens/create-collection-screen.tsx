import type { CollectionResponse } from '@gmrlog/types';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';

import { CollectionComposer } from '../components/collection-composer';

export function CreateCollectionScreen() {
  const router = useRouter();
  const onClose = useCallback(() => {
    router.back();
  }, [router]);
  const onSaved = useCallback(
    (collection: CollectionResponse) => {
      router.replace(`/(app)/collection/${collection.id}`);
    },
    [router],
  );
  return <CollectionComposer mode="create" onClose={onClose} onSaved={onSaved} />;
}
