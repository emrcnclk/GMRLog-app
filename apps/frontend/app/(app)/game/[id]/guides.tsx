import { useLocalSearchParams } from 'expo-router';

import { GameGuidesScreen } from '../../../../features/content/screens/game-hub-list-screens';

function readParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }
  return value ?? '';
}

export default function GameGuidesRoute() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  return <GameGuidesScreen gameId={readParam(params.id)} />;
}
