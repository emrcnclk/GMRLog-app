import { Button, ErrorBanner, SCREEN_GUTTER, Screen, SegmentedTabs, useTheme } from '@gmrlog/ui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';

import { mapAuthError } from '../../../src/auth/map-auth-error';
import { useConnectivityStore } from '../../../src/state/stores';
import { ConfirmDialog } from '../../content/components/confirm-dialog';
import {
  CommunityAboutTab,
  CommunityFeedTab,
  CommunityMembersTab,
} from '../components/community-detail-tabs';
import { CommunityErrorState } from '../components/community-error-state';
import { CommunityHeader } from '../components/community-header';
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
  const [ownerActionsOpen, setOwnerActionsOpen] = useState(false);

  const openOwnerActions = useCallback(() => {
    setOwnerActionsOpen((open) => !open);
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
      <Screen edges={['left', 'right', 'bottom']} style={{ paddingTop: 0, paddingBottom: 0 }}>
        <CommunityDetailSkeleton />
      </Screen>
    );
  }

  if (detail.isError && !detail.community) {
    const mapped = mapAuthError(detail.error, isOnline);
    return (
      <Screen edges={['left', 'right', 'bottom']} style={{ paddingTop: 0, paddingBottom: 0 }}>
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
      <Screen edges={['left', 'right', 'bottom']} style={{ paddingTop: 0, paddingBottom: 0 }}>
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

        {/* §14 names an overflow button but not what it opens. Revealed inline
            as a hairline pair rather than a sheet or popover: §15 is the section
            that specifies "a sheet on native, a popover on web", so the menu
            primitive belongs to 3b.3, not to this shell. */}
        {owner && ownerActionsOpen ? (
          <View
            style={{
              marginHorizontal: theme.space(SCREEN_GUTTER),
              borderWidth: 1,
              borderColor: theme.color('color.border.default'),
              borderRadius: theme.radius('radius.lg'),
              padding: theme.space('space.3'),
              gap: theme.space('space.2'),
            }}
          >
            <Button variant="secondary" accessibilityLabel="Edit community" onPress={openEdit}>
              Edit
            </Button>
            <Button
              variant="ghost"
              accessibilityLabel="Delete community"
              onPress={() => {
                setOwnerActionsOpen(false);
                setDeleteOpen(true);
              }}
            >
              Delete
            </Button>
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
          ) : (
            <CommunityFeedTab communityId={community.id} />
          )}
        </View>
      </ScrollView>

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
