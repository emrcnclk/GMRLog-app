import { Loading, Screen } from '@gmrlog/ui';
import { Redirect, Stack } from 'expo-router';

import { useAuth } from '../../src/auth/auth-provider';

/** Guest route group — visible only when unauthenticated. */
export default function AuthLayout() {
  const { isAuthenticated, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return (
      <Screen>
        <Loading label="Starting GMRLOG" />
      </Screen>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/(app)/(tabs)/home" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
