import { useLocalSearchParams } from 'expo-router';

import { GamePlayersScreen } from '../../../../features/content/screens/game-hub-entity-screens';

function readParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }
  return value ?? '';
}

export default function GamePlayersRoute() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  return <GamePlayersScreen gameId={readParam(params.id)} />;
}
