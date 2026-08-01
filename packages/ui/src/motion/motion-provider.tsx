import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AccessibilityInfo } from 'react-native';

export interface MotionContextValue {
  /** Effective reduce-motion: OS ∨ app preference. */
  reduceMotion: boolean;
  /** OS AccessibilityInfo reduce-motion. */
  osReduceMotion: boolean;
  /** App/settings preference (null = unset). */
  appReduceMotion: boolean | null;
  setAppReduceMotion: (value: boolean | null) => void;
}

const MotionContext = createContext<MotionContextValue | null>(null);

export interface MotionProviderProps {
  children: ReactNode;
  /** Optional initial app preference (e.g. hydrated settings). */
  initialAppReduceMotion?: boolean | null;
}

/**
 * Motion preference provider — OS + optional settings preference.
 * Screens/components should prefer `useReduceMotion()` over raw AccessibilityInfo.
 */
export function MotionProvider({ children, initialAppReduceMotion = null }: MotionProviderProps) {
  const [osReduceMotion, setOsReduceMotion] = useState(false);
  const [appReduceMotion, setAppReduceMotion] = useState<boolean | null>(initialAppReduceMotion);

  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) {
        setOsReduceMotion(enabled);
      }
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setOsReduceMotion);
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  useEffect(() => {
    setAppReduceMotion(initialAppReduceMotion);
  }, [initialAppReduceMotion]);

  const value = useMemo<MotionContextValue>(() => {
    const reduceMotion = osReduceMotion || appReduceMotion === true;
    return {
      reduceMotion,
      osReduceMotion,
      appReduceMotion,
      setAppReduceMotion,
    };
  }, [osReduceMotion, appReduceMotion]);

  return <MotionContext.Provider value={value}>{children}</MotionContext.Provider>;
}

export function useMotion(): MotionContextValue {
  const ctx = useContext(MotionContext);
  if (!ctx) {
    throw new Error('useMotion must be used within MotionProvider');
  }
  return ctx;
}

/** Safe hook — falls back to OS-only when provider is absent (tests / Storybook). */
export function useReduceMotion(): boolean {
  const ctx = useContext(MotionContext);
  const [osOnly, setOsOnly] = useState(false);

  useEffect(() => {
    if (ctx) {
      return;
    }
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) {
        setOsOnly(enabled);
      }
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setOsOnly);
    return () => {
      mounted = false;
      sub.remove();
    };
  }, [ctx]);

  return ctx?.reduceMotion ?? osOnly;
}
