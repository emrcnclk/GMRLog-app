import { Button, ErrorBanner, Screen, Text, useTheme } from '@gmrlog/ui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';

import { mapAuthError } from '../../../src/auth/map-auth-error';
import { useConnectivityStore } from '../../../src/state/stores';
import { ConfirmDialog } from '../../content/components/confirm-dialog';
import { CommunityErrorState } from '../components/community-error-state';
import { CommunityHeader } from '../components/community-header';
import { CommunityDetailSkeleton } from '../components/community-skeleton';
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
        <CommunityHeader community={community} onBack={onBack} onError={onJoinError} />

        {banner ? (
          <View style={{ paddingHorizontal: theme.space('space.4') }}>
            <ErrorBanner title={banner.title} description={banner.description} />
          </View>
        ) : null}

        <View
          style={{
            paddingHorizontal: theme.space('space.4'),
            gap: theme.space('space.3'),
          }}
        >
          {community.description ? (
            <View style={{ gap: theme.space('space.1') }}>
              <Text role="label" color="color.text.secondary">
                Description
              </Text>
              <Text role="body" color="color.text.primary">
                {community.description}
              </Text>
            </View>
          ) : (
            <Text role="body" color="color.text.tertiary">
              No description yet.
            </Text>
          )}

          <Text role="meta" color="color.text.tertiary">
            {String(community.counts.members)} members
          </Text>

          <Text role="caption" color="color.text.tertiary">
            Visibility is enforced by the API and is not projected on CommunityResponse.
          </Text>

          <Button variant="secondary" accessibilityLabel="View members" onPress={openMembers}>
            Members
          </Button>

          {owner ? (
            <>
              <Button variant="secondary" accessibilityLabel="Edit community" onPress={openEdit}>
                Edit
              </Button>
              <Button
                variant="ghost"
                accessibilityLabel="Delete community"
                onPress={() => {
                  setDeleteOpen(true);
                }}
              >
                Delete
              </Button>
            </>
          ) : null}
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
