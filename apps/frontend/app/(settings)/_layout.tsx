import { Loading, Screen } from '@gmrlog/ui';
import { Redirect, Stack } from 'expo-router';

import { useAuth } from '../../src/auth/auth-provider';
import { useStackMotionOptions } from '../../src/motion/use-stack-motion-options';

/** Settings group — protected. */
export default function SettingsLayout() {
  const { isAuthenticated, isBootstrapping } = useAuth();
  const stackMotion = useStackMotionOptions();

  if (isBootstrapping) {
    return (
      <Screen>
        <Loading label="Starting GMRLOG" />
      </Screen>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)" />;
  }

  return <Stack screenOptions={stackMotion} />;
}
