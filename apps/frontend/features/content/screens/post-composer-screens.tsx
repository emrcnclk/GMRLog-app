import { Screen, useTheme } from '@gmrlog/ui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View } from 'react-native';

import { ComposerSkeleton } from '../components/composer-skeleton';
import { ContentErrorState } from '../components/content-error-state';
import { PostComposer } from '../components/post-composer';
import { usePost } from '../hooks/use-posts';

function readParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }
  return value ?? '';
}

export function CreatePostScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ gameId?: string | string[] }>();
  const gameId = readParam(params.gameId);

  return (
    <PostComposer
      mode="create"
      initialGameId={gameId.length > 0 ? gameId : null}
      onClose={() => {
        router.back();
      }}
    />
  );
}

export function EditPostScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const postId = readParam(params.id);
  const query = usePost(postId);
  const theme = useTheme();

  if (query.isPending) {
    return (
      <Screen edges={[]} style={{ paddingTop: 0, paddingBottom: 0 }}>
        <ComposerSkeleton />
      </Screen>
    );
  }

  if (query.isError) {
    return (
      <Screen>
        <View style={{ padding: theme.space('space.4') }}>
          <ContentErrorState
            title="Could not load post"
            onRetry={() => {
              void query.refetch();
            }}
          />
        </View>
      </Screen>
    );
  }

  const post = query.data;

  return (
    <PostComposer
      mode="edit"
      post={post}
      onClose={() => {
        router.back();
      }}
      onDeleted={() => {
        if (post.gameId) {
          router.replace(`/(app)/game/${post.gameId}/posts`);
          return;
        }
        router.back();
      }}
    />
  );
}
