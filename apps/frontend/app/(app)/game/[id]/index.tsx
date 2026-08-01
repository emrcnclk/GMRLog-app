import { useLocalSearchParams } from 'expo-router';

import { GameHubScreen } from '../../../../features/content';

function readParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }
  return value ?? '';
}

export default function GameDetailRoute() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  return <GameHubScreen gameId={readParam(params.id)} />;
}
