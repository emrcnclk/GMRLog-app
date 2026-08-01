import { Stack } from 'expo-router';

import { RoutePlaceholder } from '../lib/navigation/route-placeholder';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not found', headerShown: true }} />
      <RoutePlaceholder
        title="Not found"
        description="This route is not part of the GMRLOG foundation shell."
      />
    </>
  );
}
