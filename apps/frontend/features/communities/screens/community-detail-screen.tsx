import {
  type BottomSheetAnchor,
  ErrorBanner,
  SCREEN_GUTTER,
  Screen,
  SegmentedTabs,
  useTheme,
} from '@gmrlog/ui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';

import { mapAuthError } from '../../../src/auth/map-auth-error';
import { useConnectivityStore } from '../../../src/state/stores';
import { ConfirmDialog } from '../../content/components/confirm-dialog';
import {
  CommunityAboutTab,
  CommunityEventsTab,
  CommunityFeedTab,
  CommunityMembersTab,
} from '../components/community-detail-tabs';
import { CommunityErrorState } from '../components/community-error-state';
import { CommunityHeader } from '../components/community-header';
import { CommunityOwnerMenu } from '../components/community-owner-menu';
import { CommunityDetailSkeleton } from '../components/community-skeleton';
import {
  COMMUNITY_DETAIL_TABS,
  type CommunityDetailTabId,
} from '../hooks/community-directory-model';
import { isCommunityOwner } from '../hooks/community-model';
import { useCommunity, useDeleteCommunity } from '../hooks/use-communities';

/** Community detail — GET /communities/{id}. */
export function CommunityDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const communityId = typeof params.id === 'string' ? params.id : '';
  const isOnline = useConnectivityStore((s) => s.isOnline);
  const detail = useCommunity(communityId);
  const deleteMutation = useDeleteCommunity();
  const [banner, setBanner] = useState<{ title: string; description: string } | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [tab, setTab] = useState<CommunityDetailTabId>('feed');
  const [ownerMenuAnchor, setOwnerMenuAnchor] = useState<BottomSheetAnchor | null>(null);

  const openOwnerActions = useCallback((anchor: BottomSheetAnchor) => {
    setOwnerMenuAnchor(anchor);
  }, []);

  const closeOwnerActions = useCallback(() => {
    setOwnerMenuAnchor(null);
  }, []);

  const onBack = useCallback(() => {
    router.back();
  }, [router]);

  const openMembers = useCallback(() => {
    router.push(`/(app)/community/${communityId}/members`);
  }, [communityId, router]);

  const openEdit = useCallback(() => {
    router.push(`/(app)/community/${communityId}/edit`);
  }, [communityId, router]);

  const onJoinError = useCallback(
    (message: string) => {
      const mapped = mapAuthError(new Error(message), isOnline);
      setBanner({ title: mapped.title, description: mapped.description });
    },
    [isOnline],
  );

  if (detail.isPending && !detail.community) {
    return (
      <Screen edges={[]}>
        <CommunityDetailSkeleton />
      </Screen>
    );
  }

  if (detail.isError && !detail.community) {
    const mapped = mapAuthError(detail.error, isOnline);
    return (
      <Screen edges={[]}>
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

  if (!detail.community) {
    return (
      <Screen edges={[]}>
        <CommunityErrorState
          title="Community not found"
          description="This community may have been removed."
          onRetry={onBack}
        />
      </Screen>
    );
  }

  const community = detail.community;
  const owner = isCommunityOwner(community);

  return (
    <Screen edges={[]}>
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
        contentContainerStyle={{
          paddingBottom: theme.space('space.10'),
          gap: theme.space('space.4'),
        }}
      >
        <CommunityHeader
          community={community}
          onBack={onBack}
          onError={onJoinError}
          {...(owner ? { onOverflow: openOwnerActions } : {})}
        />

        {banner ? (
          <View style={{ paddingHorizontal: theme.space(SCREEN_GUTTER) }}>
            <ErrorBanner title={banner.title} description={banner.description} />
          </View>
        ) : null}

        {/* §14's underlined tabs. `SegmentedTabs` already draws the accent as a
            rule under the label, so there is no new tab strip here. */}
        <SegmentedTabs
          items={COMMUNITY_DETAIL_TABS}
          activeId={tab}
          onChange={setTab}
          variant="underline"
          accessibilityLabel="Community sections"
        />

        <View style={{ paddingHorizontal: theme.space(SCREEN_GUTTER) }}>
          {tab === 'about' ? (
            <CommunityAboutTab community={community} />
          ) : tab === 'members' ? (
            <CommunityMembersTab communityId={community.id} onSeeAll={openMembers} />
          ) : tab === 'events' ? (
            <CommunityEventsTab communityId={community.id} />
          ) : (
            <CommunityFeedTab communityId={community.id} />
          )}
        </View>
      </ScrollView>

      <CommunityOwnerMenu
        anchor={ownerMenuAnchor}
        onClose={closeOwnerActions}
        onEdit={openEdit}
        onDelete={() => {
          setDeleteOpen(true);
        }}
      />

      <ConfirmDialog
        visible={deleteOpen}
        title="Delete community?"
        description="This removes the community for everyone. This cannot be undone from the app."
        confirmLabel="Delete"
        danger
        loading={deleteMutation.isPending}
        onCancel={() => {
          setDeleteOpen(false);
        }}
        onConfirm={() => {
          deleteMutation.mutate(community.id, {
            onSuccess: () => {
              setDeleteOpen(false);
              router.replace('/(app)/communities');
            },
            onError: (error) => {
              setDeleteOpen(false);
              const mapped = mapAuthError(error, isOnline);
              setBanner({ title: mapped.title, description: mapped.description });
            },
          });
        }}
      />
    </Screen>
  );
}
