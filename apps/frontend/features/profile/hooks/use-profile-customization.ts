import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { create } from 'zustand';

import {
  DEFAULT_CUSTOMIZATION,
  DEFAULT_WIDGET_ORDER,
  moveWidget,
  parseCustomization,
  reorderWidget,
  serializeCustomization,
  toggleInList,
  type ProfileCustomization,
  type ProfileWidgetId,
} from './profile-customization-model';

const STORAGE_KEY = 'gmrlog.profile.customization.v1';

interface CustomizationStore {
  customization: ProfileCustomization;
  hydrated: boolean;
  hydrate: (next: ProfileCustomization) => void;
  patch: (next: Partial<ProfileCustomization>) => void;
}

/**
 * Device-local customization state. Kept in a store rather than component state
 * so the accent can drive `ThemeProvider` at the app root while the editor lives
 * deep inside the profile screen.
 */
export const useCustomizationStore = create<CustomizationStore>((set) => ({
  customization: { ...DEFAULT_CUSTOMIZATION, widgetOrder: [...DEFAULT_WIDGET_ORDER] },
  hydrated: false,
  hydrate: (next) => {
    set({ customization: next, hydrated: true });
  },
  patch: (next) => {
    set((state) => {
      const merged = { ...state.customization, ...next };
      void AsyncStorage.setItem(STORAGE_KEY, serializeCustomization(merged));
      return { customization: merged };
    });
  },
}));

/** Loads persisted customization once at startup. Safe to mount more than once. */
export function useHydrateCustomization(): boolean {
  const hydrated = useCustomizationStore((s) => s.hydrated);
  const hydrate = useCustomizationStore((s) => s.hydrate);

  useEffect(() => {
    if (hydrated) {
      return;
    }
    let cancelled = false;

    void AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!cancelled) {
          hydrate(parseCustomization(raw));
        }
      })
      .catch(() => {
        // A read failure must not block the profile — fall back to defaults.
        if (!cancelled) {
          hydrate(parseCustomization(null));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [hydrated, hydrate]);

  return hydrated;
}

/** Editor API over the customization store. */
export function useProfileCustomization() {
  const customization = useCustomizationStore((s) => s.customization);
  const patch = useCustomizationStore((s) => s.patch);
  const hydrated = useHydrateCustomization();
  const [pendingDrag, setPendingDrag] = useState<ProfileWidgetId | null>(null);

  const setAccent = useCallback(
    (accent: ProfileCustomization['accent']) => {
      patch({ accent });
    },
    [patch],
  );

  const setCardStyle = useCallback(
    (cardStyle: ProfileCustomization['cardStyle']) => {
      patch({ cardStyle });
    },
    [patch],
  );

  const setHeroStyle = useCallback(
    (heroStyle: ProfileCustomization['heroStyle']) => {
      patch({ heroStyle });
    },
    [patch],
  );

  const setBannerStyle = useCallback(
    (bannerStyle: ProfileCustomization['bannerStyle']) => {
      patch({ bannerStyle });
    },
    [patch],
  );

  const setFavoritePlatform = useCallback(
    (favoritePlatform: string | null) => {
      patch({ favoritePlatform });
    },
    [patch],
  );

  const setConsoleGeneration = useCallback(
    (consoleGeneration: ProfileCustomization['consoleGeneration']) => {
      patch({ consoleGeneration });
    },
    [patch],
  );

  const move = useCallback(
    (id: ProfileWidgetId, direction: 'up' | 'down') => {
      patch({ widgetOrder: moveWidget(customization.widgetOrder, id, direction) });
    },
    [customization.widgetOrder, patch],
  );

  const dropAt = useCallback(
    (id: ProfileWidgetId, index: number) => {
      patch({ widgetOrder: reorderWidget(customization.widgetOrder, id, index) });
      setPendingDrag(null);
    },
    [customization.widgetOrder, patch],
  );

  const togglePinned = useCallback(
    (id: ProfileWidgetId) => {
      patch({ pinnedWidgets: toggleInList(customization.pinnedWidgets, id) });
    },
    [customization.pinnedWidgets, patch],
  );

  const toggleHidden = useCallback(
    (id: ProfileWidgetId) => {
      patch({ hiddenWidgets: toggleInList(customization.hiddenWidgets, id) });
    },
    [customization.hiddenWidgets, patch],
  );

  const reset = useCallback(() => {
    patch({ ...DEFAULT_CUSTOMIZATION, widgetOrder: [...DEFAULT_WIDGET_ORDER] });
  }, [patch]);

  return {
    customization,
    hydrated,
    pendingDrag,
    setPendingDrag,
    setAccent,
    setCardStyle,
    setHeroStyle,
    setBannerStyle,
    setFavoritePlatform,
    setConsoleGeneration,
    move,
    dropAt,
    togglePinned,
    toggleHidden,
    reset,
  };
}
