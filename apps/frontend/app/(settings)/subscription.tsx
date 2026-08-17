import { Redirect } from 'expo-router';

import { SubscriptionScreen } from '../../features/settings';
import { POST_V1_SURFACES_ENABLED } from '../../src/config/v1-scope';

export default function SubscriptionRoute() {
  if (!POST_V1_SURFACES_ENABLED) {
    return <Redirect href="/(settings)" />;
  }
  return <SubscriptionScreen />;
}
