import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

import GeistLight from '../../assets/fonts/Geist-Light.ttf';
import GeistMedium from '../../assets/fonts/Geist-Medium.ttf';
import GeistRegular from '../../assets/fonts/Geist-Regular.ttf';
import IBMPlexMonoRegular from '../../assets/fonts/IBMPlexMono-Regular.ttf';

let splashLockHeld = false;

/**
 * Hold the native splash until fonts + shell providers are ready (no FOIT).
 */
export async function holdSplashUntilReady(): Promise<void> {
  if (splashLockHeld) return;
  await SplashScreen.preventAutoHideAsync();
  splashLockHeld = true;
}

export async function releaseSplash(): Promise<void> {
  if (!splashLockHeld) return;
  await SplashScreen.hideAsync();
  splashLockHeld = false;
}

/**
 * Register the two families the typography tokens name (THEME_MIGRATION.md §4).
 *
 * The keys must match `FONT_FAMILY` in `@gmrlog/ui` exactly — that is the
 * contract between the token scale and the registered faces.
 *
 * Shipping the sans is not cosmetic. Before this, nothing was registered and the
 * app fell back to whatever the platform provided; weight 300 in Roboto is
 * markedly lighter than in SF, so a hierarchy built on "large, light and quiet"
 * rendered differently on Android than on iOS.
 */
export async function loadApplicationFonts(): Promise<void> {
  try {
    await Font.loadAsync({
      'Geist-Light': GeistLight,
      'Geist-Regular': GeistRegular,
      'Geist-Medium': GeistMedium,
      'IBMPlexMono-Regular': IBMPlexMonoRegular,
    });
  } catch {
    // A failed registration degrades to the platform font rather than blocking
    // start-up — this runs inside the splash-hold bootstrap, so throwing here
    // would leave the user on the splash screen indefinitely.
  }
}
