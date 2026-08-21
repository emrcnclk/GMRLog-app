import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AuthGate } from '../src/navigation/auth-gate';
import { AppProviders } from '../src/providers/app-providers';

/**
 * Root layout — D3.1 infrastructure navigation groups only.
 */
export default function RootLayout() {
  return (
    <AppProviders>
      <AuthGate>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(app)" />
          <Stack.Screen name="(modals)" options={{ presentation: 'modal' }} />
          <Stack.Screen name="(settings)" />
          <Stack.Screen name="legal" />
          <Stack.Screen name="+not-found" />
        </Stack>
      </AuthGate>
    </AppProviders>
  );
}
