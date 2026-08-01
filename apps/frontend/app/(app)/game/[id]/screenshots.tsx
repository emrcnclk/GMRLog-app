import { useLocalSearchParams } from 'expo-router';

import { GameScreenshotsScreen } from '../../../../features/content/screens/game-hub-list-screens';

function readParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }
  return value ?? '';
}

export default function GameScreenshotsRoute() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  return <GameScreenshotsScreen gameId={readParam(params.id)} />;
}
