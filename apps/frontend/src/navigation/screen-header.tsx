import { NavHeader, type NavHeaderProps } from '@gmrlog/ui';
import { memo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type ScreenHeaderProps = Omit<NavHeaderProps, 'topInset'> & {
  /**
   * Set false for a header that is not the topmost element on screen — inside a
   * presented sheet, or below another bar that already consumed the inset.
   */
  safeArea?: boolean;
};

/**
 * `NavHeader` with the device safe-area inset filled in.
 *
 * The design system takes no safe-area peer dependency by design (see `Screen`
 * in `@gmrlog/ui`), so the measurement happens here, at the app layer, where
 * `react-native-safe-area-context` already lives. This adapter is the only
 * place in the app that reads `insets.top` for header chrome — every screen
 * header composes it rather than rebuilding the bar.
 */
function ScreenHeaderComponent({ safeArea = true, ...rest }: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();
  return <NavHeader {...rest} topInset={safeArea ? insets.top : 0} />;
}

export const ScreenHeader = memo(ScreenHeaderComponent);
