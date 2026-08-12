import {
  type BottomSheetAnchor,
  MIN_TOUCH_TARGET,
  Screen,
  ScreenTitle,
  Text,
  useTheme,
} from '@gmrlog/ui';
import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MoreHorizontal } from 'lucide-react-native';
import { useCallback, useRef, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Share, View } from 'react-native';

import { useAuthStore } from '../../../src/state/auth-store';
import { useConnectivityStore } from '../../../src/state/stores';
import { mapBoardError } from '../../boards/shared/board-model';
import { DeleteDialog } from '../../boards/shared/delete-dialog';
import { TierActionRow } from '../components/tier-action-row';
import { TierBoard } from '../components/tier-board';
import { TierErrorState } from '../components/tier-error-state';
import { TierListOwnerMenu } from '../components/tier-list-owner-menu';
import { TierDetailSkeleton } from '../components/tier-skeleton';
import {
  isTierListOwner,
  tierListByline,
  tierListShareMessage,
  tierListShareUrl,
} from '../hooks/tier-list-model';
import {
  useDeleteTierList,
  useForkTierList,
  useTierList,
  useToggleTierListLike,
} from '../hooks/use-tier-lists';

export function TierListDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const tierListId = typeof params.id === 'string' ? params.id : '';
  const isOnline = useConnectivityStore((s) => s.isOnline);
  const userId = useAuthStore((s) => s.user?.id);
  const detail = useTierList(tierListId);
  const deleteMutation = useDeleteTierList();
  const forkMutation = useForkTierList();
  const like = useToggleTierListLike(tierListId);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<BottomSheetAnchor | null>(null);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [banner, setBanner] = useState<{ title: string; description: string } | null>(null);
  const overflowRef = useRef<View>(null);

  const onBack = useCallback(() => {
    router.back();
  }, [router]);

  const openMenu = useCallback(() => {
    overflowRef.current?.measureInWindow((x, y, width, height) => {
      setMenuAnchor({ x, y, width, height });
    });
  }, []);

  const onDraggingChange = useCallback((dragging: boolean) => {
    setScrollEnabled(!dragging);
  }, []);

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

  return (
    <Screen edges={['left', 'right', 'bottom']} style={{ paddingTop: 0, paddingBottom: 0 }}>
      <ScrollView
        scrollEnabled={scrollEnabled}
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
        <ScreenTitle
          title={tierList.title}
          meta={tierListByline(tierList)}
          backLabel="Collections"
          onPressBack={onBack}
          trailing={
            owner ? (
              <Pressable
                ref={overflowRef}
                accessibilityRole="button"
                accessibilityLabel="Tier list actions"
                onPress={openMenu}
                hitSlop={8}
                style={{
                  minHeight: MIN_TOUCH_TARGET,
                  minWidth: MIN_TOUCH_TARGET,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MoreHorizontal
                  size={20}
                  color={theme.color('color.text.secondary')}
                  strokeWidth={1.75}
                />
              </Pressable>
            ) : undefined
          }
        />

        {banner ? (
          <View
            style={{
              paddingHorizontal: theme.space('space.5'),
              paddingBottom: theme.space('space.3'),
            }}
          >
            <Text role="body" color="color.text.secondary">
              {banner.title}: {banner.description}
            </Text>
          </View>
        ) : null}

        <TierBoard tierList={tierList} owner={owner} onDraggingChange={onDraggingChange} />

        <View style={{ paddingHorizontal: theme.space('space.5') }}>
          <TierActionRow
            liked={like.liked}
            likePending={like.isPending}
            forkPending={forkMutation.isPending}
            onLike={() => {
              like.toggle();
            }}
            onShare={() => {
              void Share.share({
                message: tierListShareMessage(tierList),
                url: tierListShareUrl(tierList.id),
              }).catch(() => {
                void Clipboard.setStringAsync(tierListShareUrl(tierList.id));
              });
            }}
            onFork={() => {
              forkMutation.mutate(tierList, {
                onSuccess: (forked) => {
                  router.push(`/(app)/tier-list/${forked.id}`);
                },
                onError: (error) => {
                  setBanner(mapBoardError(error, isOnline));
                },
              });
            }}
          />
        </View>
      </ScrollView>

      <TierListOwnerMenu
        anchor={menuAnchor}
        onClose={() => {
          setMenuAnchor(null);
        }}
        onEdit={() => {
          router.push(`/(app)/tier-list/${tierList.id}/edit`);
        }}
        onDelete={() => {
          setDeleteOpen(true);
        }}
      />

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
