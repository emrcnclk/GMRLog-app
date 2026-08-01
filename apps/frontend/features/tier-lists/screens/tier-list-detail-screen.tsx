import { Button, Screen, Text, useTheme } from '@gmrlog/ui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';

import { useAuthStore } from '../../../src/state/auth-store';
import { useConnectivityStore } from '../../../src/state/stores';
import { mapBoardError } from '../../boards/shared/board-model';
import { DeleteDialog } from '../../boards/shared/delete-dialog';
import { TierErrorState } from '../components/tier-error-state';
import { TierListHeader } from '../components/tier-list-header';
import { TierDetailSkeleton } from '../components/tier-skeleton';
import { isTierListOwner, toEditableBoard } from '../hooks/tier-list-model';
import { useDeleteTierList, useTierList } from '../hooks/use-tier-lists';

export function TierListDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const tierListId = typeof params.id === 'string' ? params.id : '';
  const isOnline = useConnectivityStore((s) => s.isOnline);
  const userId = useAuthStore((s) => s.user?.id);
  const detail = useTierList(tierListId);
  const deleteMutation = useDeleteTierList();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [banner, setBanner] = useState<{ title: string; description: string } | null>(null);

  const onBack = useCallback(() => {
    router.back();
  }, [router]);

  if (detail.isPending && !detail.tierList) {
    return (
      <Screen edges={['left', 'right', 'bottom']} style={{ paddingTop: 0, paddingBottom: 0 }}>
        <TierDetailSkeleton />
      </Screen>
    );
  }

  if (detail.isError || !detail.tierList) {
    const mapped = mapBoardError(detail.error, isOnline);
    return (
      <Screen edges={['left', 'right', 'bottom']} style={{ paddingTop: 0, paddingBottom: 0 }}>
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

  const tierList = detail.tierList;
  const owner = isTierListOwner(tierList, userId);
  const preview = toEditableBoard(tierList.slots);

  return (
    <Screen edges={['left', 'right', 'bottom']} style={{ paddingTop: 0, paddingBottom: 0 }}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={detail.isRefreshing}
            onRefresh={() => {
              void detail.refresh();
            }}
            tintColor={theme.color('color.interactive.primary')}
            colors={[theme.color('color.interactive.primary')]}
          />
        }
        contentContainerStyle={{ paddingBottom: theme.space('space.10') }}
      >
        <TierListHeader tierList={tierList} onBack={onBack} />
        {banner ? (
          <View style={{ padding: theme.space('space.4') }}>
            <Text role="body" color="color.text.secondary">
              {banner.title}: {banner.description}
            </Text>
          </View>
        ) : null}

        {owner ? (
          <View
            style={{
              paddingHorizontal: theme.space('space.4'),
              paddingVertical: theme.space('space.3'),
              gap: theme.space('space.2'),
            }}
          >
            <Button
              variant="primary"
              accessibilityLabel="Open tier builder"
              onPress={() => {
                router.push(`/(app)/tier-list/${tierList.id}/builder`);
              }}
            >
              Builder
            </Button>
            <Button
              variant="secondary"
              accessibilityLabel="Edit tier list"
              onPress={() => {
                router.push(`/(app)/tier-list/${tierList.id}/edit`);
              }}
            >
              Edit
            </Button>
            <Button
              variant="ghost"
              accessibilityLabel="Delete tier list"
              onPress={() => {
                setDeleteOpen(true);
              }}
            >
              Delete
            </Button>
          </View>
        ) : null}

        {preview.map((slot) => (
          <View
            key={slot.label}
            style={{
              paddingHorizontal: theme.space('space.4'),
              paddingVertical: theme.space('space.3'),
              borderBottomWidth: 1,
              borderBottomColor: theme.color('color.border.default'),
              gap: theme.space('space.2'),
            }}
          >
            <Text role="label" color="color.text.primary">
              {slot.label}
            </Text>
            <Text role="body" color="color.text.secondary">
              {slot.games.length === 0 ? 'Empty' : slot.games.map((game) => game.title).join(' · ')}
            </Text>
          </View>
        ))}
      </ScrollView>

      <DeleteDialog
        visible={deleteOpen}
        title="Delete tier list?"
        description="This removes the tier list. This cannot be undone from the app."
        loading={deleteMutation.isPending}
        onCancel={() => {
          setDeleteOpen(false);
        }}
        onConfirm={() => {
          deleteMutation.mutate(tierList.id, {
            onSuccess: () => {
              setDeleteOpen(false);
              router.replace('/(app)/tier-lists');
            },
            onError: (error) => {
              setDeleteOpen(false);
              setBanner(mapBoardError(error, isOnline));
            },
          });
        }}
      />
    </Screen>
  );
}
