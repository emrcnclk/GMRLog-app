import { useLocalSearchParams } from 'expo-router';

import { GameTimelineScreen } from '../../../../features/content/screens/game-timeline-screen';

function readParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }
  return value ?? '';
}

export default function GameTimelineRoute() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  return <GameTimelineScreen gameId={readParam(params.id)} />;
}
