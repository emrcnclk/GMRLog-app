import { useLocalSearchParams } from 'expo-router';

import { GamePostsScreen } from '../../../../features/content';

function readParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }
  return value ?? '';
}

export default function GamePostsRoute() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  return <GamePostsScreen gameId={readParam(params.id)} />;
}
