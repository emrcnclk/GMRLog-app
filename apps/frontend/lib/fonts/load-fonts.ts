import * as SplashScreen from 'expo-splash-screen';

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
 * Font registration foundation.
 * Typefaces are not selected in F4.3 / DESIGN_TOKENS — system fonts apply until
 * typography tokens name families. This resolves immediately so splash can release.
 */
export async function loadApplicationFonts(): Promise<void> {
  await Promise.resolve();
}
