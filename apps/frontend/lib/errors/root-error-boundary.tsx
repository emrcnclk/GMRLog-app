import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Appearance, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { isDevelopmentBuild } from '../../src/config/runtime-flags';
import { getLogger } from '../../src/logging/logger';
import { getMonitoring } from '../../src/monitoring';

export interface RootErrorBoundaryProps {
  children: ReactNode;
  onReset?: () => void;
}

interface RootErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  componentStack: string | null;
}

/**
 * Root error boundary (F6.2 §5.5 · D3.15) — retry · reload · never blank.
 * Lives outside ThemeProvider, so recovery chrome uses Appearance neutrals only.
 */
export class RootErrorBoundary extends Component<RootErrorBoundaryProps, RootErrorBoundaryState> {
  override state: RootErrorBoundaryState = {
    hasError: false,
    error: null,
    componentStack: null,
  };

  static getDerivedStateFromError(error: Error): Partial<RootErrorBoundaryState> {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    getLogger().error('RootErrorBoundary caught', {
      message: error.message,
      stack: error.stack,
      componentStack: info.componentStack,
    });
    getMonitoring().crash.captureException(error, {
      componentStack: info.componentStack ?? undefined,
    });
    this.setState({ componentStack: info.componentStack ?? null });
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, error: null, componentStack: null });
    this.props.onReset?.();
  };

  private handleReload = (): void => {
    this.setState({ hasError: false, error: null, componentStack: null });
    this.props.onReset?.();
  };

  override render(): ReactNode {
    if (this.state.hasError) {
      return (
        <BlockingSystemErrorView
          onRetry={this.handleReset}
          onReload={this.handleReload}
          error={this.state.error}
          componentStack={this.state.componentStack}
        />
      );
    }
    return this.props.children;
  }
}

function BlockingSystemErrorView({
  onRetry,
  onReload,
  error,
  componentStack,
}: {
  onRetry: () => void;
  onReload: () => void;
  error: Error | null;
  componentStack: string | null;
}) {
  const isDark = Appearance.getColorScheme() === 'dark';
  const backgroundColor = isDark ? '#09090B' : '#FFFFFF';
  const textPrimary = isDark ? '#FAFAFA' : '#18181B';
  const textSecondary = isDark ? '#D4D4D8' : '#3F3F46';
  const buttonBg = isDark ? '#FAFAFA' : '#18181B';
  const buttonText = isDark ? '#18181B' : '#FAFAFA';
  const showDiagnostics = isDevelopmentBuild();

  return (
    <View
      style={[styles.root, { backgroundColor }]}
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
    >
      <Text style={[styles.title, { color: textPrimary }]}>Something went wrong</Text>
      <Text style={[styles.body, { color: textSecondary }]}>
        GMRLOG could not continue. You can try again or reload the screen.
      </Text>
      <View style={styles.actions}>
        <Pressable
          onPress={onRetry}
          accessibilityRole="button"
          accessibilityLabel="Retry"
          style={[styles.button, { backgroundColor: buttonBg }]}
        >
          <Text style={{ color: buttonText }}>Retry</Text>
        </Pressable>
        <Pressable
          onPress={onReload}
          accessibilityRole="button"
          accessibilityLabel="Reload"
          style={[styles.buttonSecondary, { borderColor: textSecondary }]}
        >
          <Text style={{ color: textPrimary }}>Reload</Text>
        </Pressable>
      </View>
      {showDiagnostics && error ? (
        <ScrollView style={styles.diagnostics} accessibilityLabel="Developer diagnostics">
          <Text style={[styles.diagTitle, { color: textSecondary }]}>Developer diagnostics</Text>
          <Text style={[styles.diagBody, { color: textSecondary }]}>{error.message}</Text>
          {error.stack ? (
            <Text style={[styles.diagBody, { color: textSecondary }]}>{error.stack}</Text>
          ) : null}
          {componentStack ? (
            <Text style={[styles.diagBody, { color: textSecondary }]}>{componentStack}</Text>
          ) : null}
        </ScrollView>
      ) : null}
    </View>
  );
}

/**
 * @deprecated D3.15 — do not blank the tree. Prefer OfflineBanner.
 * Kept for compatibility; renders children with no replacement.
 */
export function OfflineBoundary({ children }: { children: ReactNode; isOffline?: boolean }) {
  return children;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  body: {
    fontSize: 16,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  button: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonSecondary: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  diagnostics: {
    marginTop: 16,
    maxHeight: 200,
  },
  diagTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  diagBody: {
    fontSize: 11,
    fontFamily: 'monospace',
  },
});
