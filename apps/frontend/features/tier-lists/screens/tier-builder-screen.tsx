import { Button, Screen, Text, useTheme } from '@gmrlog/ui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';

import { useConnectivityStore } from '../../../src/state/stores';
import { mapBoardError } from '../../boards/shared/board-model';
import { TierBuilder, toSavePayload } from '../components/tier-builder';
import { TierErrorState } from '../components/tier-error-state';
import { TierDetailSkeleton } from '../components/tier-skeleton';
import { toEditableBoard, type EditableTierSlot } from '../hooks/tier-list-model';
import { useReplaceSlots, useTierList } from '../hooks/use-tier-lists';

export function TierBuilderScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const tierListId = typeof params.id === 'string' ? params.id : '';
  const isOnline = useConnectivityStore((s) => s.isOnline);
  const detail = useTierList(tierListId);
  const replace = useReplaceSlots(tierListId);
  const [board, setBoard] = useState<EditableTierSlot[]>([]);
  const [banner, setBanner] = useState<{ title: string; description: string } | null>(null);

  useEffect(() => {
    if (detail.tierList) {
      setBoard(toEditableBoard(detail.tierList.slots));
    }
  }, [detail.tierList]);

  const onSave = useCallback(async () => {
    setBanner(null);
    try {
      await replace.mutateAsync(toSavePayload(board));
      router.back();
    } catch (error) {
      setBanner(mapBoardError(error, isOnline));
    }
  }, [board, isOnline, replace, router]);

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
    <Screen edges={['top']} style={{ paddingTop: 0, paddingBottom: 0 }}>
      <View
        style={{
          borderBottomWidth: 1,
          borderBottomColor: theme.color('color.border.default'),
          minHeight: theme.space('space.12'),
          paddingHorizontal: theme.space('space.4'),
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.space('space.2'),
        }}
      >
        <Button
          variant="ghost"
          size="sm"
          accessibilityLabel="Close builder"
          onPress={() => {
            router.back();
          }}
        >
          Close
        </Button>
        <Text role="heading" style={{ flex: 1 }} numberOfLines={1}>
          Builder
        </Text>
      </View>
      <TierBuilder
        board={board}
        onChange={setBoard}
        onSave={() => {
          void onSave();
        }}
        saving={replace.isPending}
        banner={banner}
      />
    </Screen>
  );
}
