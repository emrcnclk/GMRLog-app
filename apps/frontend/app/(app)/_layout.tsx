import { Loading, Screen } from '@gmrlog/ui';
import { Redirect, Stack } from 'expo-router';

import { useAuth } from '../../src/auth/auth-provider';
import {
  useModalMotionOptions,
  useStackMotionOptions,
} from '../../src/motion/use-stack-motion-options';

/** Protected application shell — authenticated only. */
export default function AppLayout() {
  const { isAuthenticated, isBootstrapping } = useAuth();
  const stackMotion = useStackMotionOptions();
  const modalMotion = useModalMotionOptions();

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

  return (
    <Stack screenOptions={stackMotion}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="profile/customize" options={modalMotion} />
      <Stack.Screen name="messages/new" options={modalMotion} />
      <Stack.Screen name="communities/create" options={modalMotion} />
      <Stack.Screen name="community/[id]/edit" options={modalMotion} />
      <Stack.Screen name="collections/create" options={modalMotion} />
      <Stack.Screen name="collection/[id]/edit" options={modalMotion} />
      <Stack.Screen name="collection/[id]/entries" options={modalMotion} />
      <Stack.Screen name="tier-lists/create" options={modalMotion} />
      <Stack.Screen name="tier-list/[id]/edit" options={modalMotion} />
      <Stack.Screen name="tier-list/[id]/builder" options={modalMotion} />
      <Stack.Screen name="review/create" options={modalMotion} />
      <Stack.Screen name="review/[id]/edit" options={modalMotion} />
      <Stack.Screen name="post/create" options={modalMotion} />
      <Stack.Screen name="post/[id]/edit" options={modalMotion} />
    </Stack>
  );
}
