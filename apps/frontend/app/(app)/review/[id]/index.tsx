import { useLocalSearchParams } from 'expo-router';

import { ReviewDetailScreen } from '../../../../features/content';

function readParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }
  return value ?? '';
}

export default function ReviewDetailRoute() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  return <ReviewDetailScreen reviewId={readParam(params.id)} />;
}
