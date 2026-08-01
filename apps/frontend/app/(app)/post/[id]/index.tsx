import { useLocalSearchParams } from 'expo-router';

import { PostDetailScreen } from '../../../../features/content/screens/post-detail-screen';

function readParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }
  return value ?? '';
}

export default function PostDetailRoute() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  return <PostDetailScreen postId={readParam(params.id)} />;
}
