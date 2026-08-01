import { useLocalSearchParams } from 'expo-router';

import { GameReviewsScreen } from '../../../../features/content';

function readParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }
  return value ?? '';
}

export default function GameReviewsRoute() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  return <GameReviewsScreen gameId={readParam(params.id)} />;
}
