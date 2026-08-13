import { Screen } from '@gmrlog/ui';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';

import { PublisherPortfolioGap } from '../components/publisher-portfolio-gap';
import { PublisherPortfolioHeader } from '../components/publisher-portfolio-header';

/**
 * §24 — Publisher portfolio. Not linked from anywhere in the app's
 * navigation, the same standing gap §23's `StudioAnalyticsScreen` records:
 * every entry point would need a publisher-account concept that doesn't
 * exist (see `PublisherPortfolioGap`'s doc comment). Reachable only by
 * direct navigation to `/publisher-portfolio`.
 *
 * Read-only per the brief: the only control on the whole screen is Close.
 */
export function PublisherPortfolioScreen() {
  const router = useRouter();

  const onClose = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <Screen edges={['bottom']}>
      <PublisherPortfolioHeader title="Publisher portfolio" onClose={onClose} />
      <PublisherPortfolioGap />
    </Screen>
  );
}
