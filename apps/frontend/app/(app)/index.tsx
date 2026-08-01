import { Redirect } from 'expo-router';

/** App entry redirects into the tab shell Home. */
export default function AppIndexRoute() {
  return <Redirect href="/(app)/(tabs)/home" />;
}
