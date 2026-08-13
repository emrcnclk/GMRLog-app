import { Loading, Screen } from '@gmrlog/ui';
import * as WebBrowser from 'expo-web-browser';
import { useEffect } from 'react';

/**
 * Web-only landing point for the OAuth popup (OAUTH.md §2 step 2: "Redirect
 * URI is a deep link on native, a route on web"). This route never talks to
 * the backend — it exists purely to hand the popup's final URL back to the
 * `WebBrowser.openAuthSessionAsync` call waiting in the tab that opened it
 * (`use-oauth-sign-in.ts`), via `maybeCompleteAuthSession`, then the popup
 * closes itself. Native never mounts this: `expo-auth-session`'s deep link
 * resolves straight back into the already-running app instead of opening a
 * second window, and `maybeCompleteAuthSession` is a no-op off web.
 */
export function OAuthCallbackScreen() {
  useEffect(() => {
    WebBrowser.maybeCompleteAuthSession();
  }, []);

  return (
    <Screen>
      <Loading label="Completing sign-in" />
    </Screen>
  );
}
