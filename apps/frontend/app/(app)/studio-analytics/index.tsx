import { Redirect } from 'expo-router';

import { StudioAnalyticsScreen } from '../../../features/studio';
import { POST_V1_SURFACES_ENABLED } from '../../../src/config/v1-scope';

export default function StudioAnalyticsRoute() {
  if (!POST_V1_SURFACES_ENABLED) {
    return <Redirect href="/(app)/(tabs)/home" />;
  }
  return <StudioAnalyticsScreen />;
}
