import { Redirect } from 'expo-router';

import { PublisherPortfolioScreen } from '../../../features/publisher';
import { POST_V1_SURFACES_ENABLED } from '../../../src/config/v1-scope';

export default function PublisherPortfolioRoute() {
  if (!POST_V1_SURFACES_ENABLED) {
    return <Redirect href="/(app)/(tabs)/home" />;
  }
  return <PublisherPortfolioScreen />;
}
