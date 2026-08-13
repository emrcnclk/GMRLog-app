import { Screen } from '@gmrlog/ui';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';

import { StudioAnalyticsGap } from '../components/studio-analytics-gap';
import { StudioAnalyticsHeader } from '../components/studio-analytics-header';

/**
 * §23 — Studio analytics (developer). Not linked from anywhere in the app's
 * navigation: every entry point would need an `isStudio`/organisation-account
 * check to gate it, and that concept doesn't exist either (see
 * `StudioAnalyticsGap`'s doc comment). Reachable only by direct navigation,
 * the same standing gap as the entity itself — recorded in `TASKS.md` rather
 * than worked around with a fabricated gate.
 *
 * Read-only per the brief: the only control on the whole screen is Close.
 */
export function StudioAnalyticsScreen() {
  const router = useRouter();

  const onClose = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <Screen edges={['bottom']}>
      <StudioAnalyticsHeader title="Studio analytics" onClose={onClose} />
      <StudioAnalyticsGap />
    </Screen>
  );
}
