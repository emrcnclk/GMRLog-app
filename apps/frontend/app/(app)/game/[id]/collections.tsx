import { useLocalSearchParams } from 'expo-router';

import { GameCollectionsScreen } from '../../../../features/content/screens/game-hub-entity-screens';

function readParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }
  return value ?? '';
}

export default function GameCollectionsRoute() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  return <GameCollectionsScreen gameId={readParam(params.id)} />;
}
