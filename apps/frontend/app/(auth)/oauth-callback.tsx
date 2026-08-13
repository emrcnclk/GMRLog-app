import { OAuthCallbackScreen } from '../../features/auth/oauth-callback-screen';

/** Web OAuth redirect landing point — see `OAuthCallbackScreen` (D4.3 / OAUTH.md §2). */
export default function AuthOAuthCallbackRoute() {
  return <OAuthCallbackScreen />;
}
