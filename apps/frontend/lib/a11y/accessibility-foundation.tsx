import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { AccessibilityInfo, PixelRatio } from 'react-native';

export interface AccessibilityFoundationValue {
  isReduceMotionEnabled: boolean;
  isScreenReaderEnabled: boolean;
  /** OS font scale — type roles multiply this; screens never invent raw sizes. */
  fontScale: number;
  refresh: () => Promise<void>;
}

const AccessibilityFoundationContext = createContext<AccessibilityFoundationValue | null>(null);

export interface AccessibilityFoundationProviderProps {
  children: ReactNode;
}

/**
 * Accessibility foundation only (F6.2).
 * Dynamic type, reduced motion, screen-reader readiness — no product chrome.
 */
export function AccessibilityFoundationProvider({
  children,
}: AccessibilityFoundationProviderProps) {
  const [isReduceMotionEnabled, setReduceMotion] = useState(false);
  const [isScreenReaderEnabled, setScreenReader] = useState(false);
  const [fontScale, setFontScale] = useState(PixelRatio.getFontScale());

  const refresh = useCallback(async () => {
    const [reduceMotion, screenReader] = await Promise.all([
      AccessibilityInfo.isReduceMotionEnabled(),
      AccessibilityInfo.isScreenReaderEnabled(),
    ]);
    setReduceMotion(reduceMotion);
    setScreenReader(screenReader);
    setFontScale(PixelRatio.getFontScale());
  }, []);

  useEffect(() => {
    void refresh();
    const reduceMotionSub = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion,
    );
    const screenReaderSub = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      setScreenReader,
    );
    return () => {
      reduceMotionSub.remove();
      screenReaderSub.remove();
    };
  }, [refresh]);

  const value = useMemo(
    () => ({
      isReduceMotionEnabled,
      isScreenReaderEnabled,
      fontScale,
      refresh,
    }),
    [isReduceMotionEnabled, isScreenReaderEnabled, fontScale, refresh],
  );

  return (
    <AccessibilityFoundationContext.Provider value={value}>
      {children}
    </AccessibilityFoundationContext.Provider>
  );
}

export function useAccessibilityFoundation(): AccessibilityFoundationValue {
  const context = useContext(AccessibilityFoundationContext);
  if (!context) {
    throw new Error(
      'useAccessibilityFoundation must be used within AccessibilityFoundationProvider',
    );
  }
  return context;
}
