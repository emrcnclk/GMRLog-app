import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AuthGate } from '../src/navigation/auth-gate';
import { LegalConsentGate } from '../src/navigation/legal-consent-gate';
import { AppProviders } from '../src/providers/app-providers';

/**
 * Root layout — D3.1 infrastructure navigation groups only.
 *
 * `LegalConsentGate` (12.4b) sits inside `AuthGate`, wrapping only the
 * `Stack` and not the `StatusBar` — so the status bar still renders during a
 * gate screen, the same way it already renders through every `AuthGate`
 * redirect. It only has an opinion once `AuthGate` has already resolved a
 * player as authenticated on a protected route.
 */
export default function RootLayout() {
  return (
    <AppProviders>
      <AuthGate>
        <StatusBar style="auto" />
        <LegalConsentGate>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(app)" />
            <Stack.Screen name="(modals)" options={{ presentation: 'modal' }} />
            <Stack.Screen name="(settings)" />
            <Stack.Screen name="legal" />
            <Stack.Screen name="+not-found" />
          </Stack>
        </LegalConsentGate>
      </AuthGate>
    </AppProviders>
  );
}
