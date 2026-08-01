import { useLocalSearchParams } from 'expo-router';

import { GameEventsScreen } from '../../../../features/content/screens/game-hub-entity-screens';

function readParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }
  return value ?? '';
}

export default function GameEventsRoute() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  return <GameEventsScreen gameId={readParam(params.id)} />;
}
