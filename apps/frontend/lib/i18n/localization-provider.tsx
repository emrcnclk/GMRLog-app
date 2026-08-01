import { createContext, useContext, useMemo, type ReactNode } from 'react';

/**
 * Localization provider stub (F6.2 §5.2 shell order).
 * No copy catalogs in D1.3 — hard-coded player-facing strings remain forbidden in features.
 */
export interface LocalizationValue {
  locale: string;
}

const LocalizationContext = createContext<LocalizationValue | null>(null);

export interface LocalizationProviderProps {
  children: ReactNode;
  locale?: string;
}

export function LocalizationProvider({ children, locale = 'en' }: LocalizationProviderProps) {
  const value = useMemo(() => ({ locale }), [locale]);
  return <LocalizationContext.Provider value={value}>{children}</LocalizationContext.Provider>;
}

export function useLocalization(): LocalizationValue {
  const context = useContext(LocalizationContext);
  if (!context) {
    throw new Error('useLocalization must be used within LocalizationProvider');
  }
  return context;
}
