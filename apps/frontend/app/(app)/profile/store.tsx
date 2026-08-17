import { Redirect } from 'expo-router';

import { CosmeticsStoreScreen } from '../../../features/profile';
import { POST_V1_SURFACES_ENABLED } from '../../../src/config/v1-scope';

export default function CosmeticsStoreRoute() {
  if (!POST_V1_SURFACES_ENABLED) {
    return <Redirect href="/(app)/profile/customize" />;
  }
  return <CosmeticsStoreScreen />;
}
