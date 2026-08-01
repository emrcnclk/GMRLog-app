import { ToastHost } from '@gmrlog/ui';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { useEffect, useState, type ReactNode } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AccessibilityFoundationProvider } from '../../lib/a11y/accessibility-foundation';
import { RootErrorBoundary } from '../../lib/errors/root-error-boundary';
import {
  holdSplashUntilReady,
  loadApplicationFonts,
  releaseSplash,
} from '../../lib/fonts/load-fonts';
import { LocalizationProvider } from '../../lib/i18n/localization-provider';
import { ApiProvider } from '../api/api-provider';
import { AuthProvider } from '../auth/auth-provider';
import { AuthSessionBootstrap } from '../auth/auth-session-bootstrap';
import { getFrontendEnv } from '../config/runtime-flags';
import { runCrashRecovery } from '../crash/crash-recovery';
import { createLogger, setLogger } from '../logging/logger';
import { AppMotionProvider } from '../motion/app-motion-provider';
import { AppQueryProvider } from '../query/query-provider';
import { runParallelBootstrap } from '../startup/startup-order';
import { AppThemeProvider } from '../theme/app-theme-provider';

import { ConnectivityBridge } from './connectivity-bridge';

export interface AppProvidersProps {
  children: ReactNode;
}

/**
 * D3.2 / D3.14 / D3.15 application shell providers.
 * Order: Error → Theme → Localization → Query(persist) → Auth → Api → Bootstrap → Motion → A11y → Toast → Sheets → Connectivity
 */
export function AppProviders({ children }: AppProvidersProps) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function prepare(): Promise<void> {
      setLogger(createLogger(getFrontendEnv().APP_ENV));
      await holdSplashUntilReady();
      await runParallelBootstrap([
        async () => {
          await loadApplicationFonts();
        },
        async () => {
          await runCrashRecovery();
        },
      ]);
      if (!cancelled) {
        setIsReady(true);
        await releaseSplash();
      }
    }

    void prepare();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!isReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <RootErrorBoundary>
        <SafeAreaProvider>
          <AppThemeProvider>
            <LocalizationProvider>
              <AppQueryProvider>
                <AuthProvider>
                  <ApiProvider>
                    <AuthSessionBootstrap>
                      <AppMotionProvider>
                        <AccessibilityFoundationProvider>
                          <ToastHost>
                            <BottomSheetModalProvider>
                              <ConnectivityBridge>{children}</ConnectivityBridge>
                            </BottomSheetModalProvider>
                          </ToastHost>
                        </AccessibilityFoundationProvider>
                      </AppMotionProvider>
                    </AuthSessionBootstrap>
                  </ApiProvider>
                </AuthProvider>
              </AppQueryProvider>
            </LocalizationProvider>
          </AppThemeProvider>
        </SafeAreaProvider>
      </RootErrorBoundary>
    </GestureHandlerRootView>
  );
}
