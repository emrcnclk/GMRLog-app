import { BootstrapRedirect } from '../src/navigation/auth-gate';

/** App entry — splash bootstrap then auth/app redirect. */
export default function Index() {
  return <BootstrapRedirect />;
}
