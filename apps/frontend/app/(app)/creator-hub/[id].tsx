import { useLocalSearchParams } from 'expo-router';

import { CreatorHubScreen } from '../../../features/creator';

function readParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }
  return value ?? '';
}

export default function CreatorHubRoute() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  return <CreatorHubScreen userId={readParam(params.id)} />;
}
