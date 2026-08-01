import { useLocalSearchParams } from 'expo-router';

import { PublicProfileScreen } from '../../../features/profile';

function readParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }
  return value ?? '';
}

export default function UserProfileRoute() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  return <PublicProfileScreen userId={readParam(params.id)} />;
}
