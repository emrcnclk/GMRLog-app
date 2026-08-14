import { useWindowDimensions } from 'react-native';

import { TABLET_BREAKPOINT } from './tokens';

/**
 * True at and above the tablet breakpoint (8.1 Cross-platform pass).
 *
 * `useWindowDimensions` is a plain, ordinary React re-render on width change —
 * not `Animated`/Reanimated's props bridge, so none of CLAUDE.md's RNW dead-on-web
 * traps apply here. This is the single place that reads viewport width against
 * `TABLET_BREAKPOINT`; a screen or primitive that needs to branch on the
 * breakpoint calls this hook rather than re-deriving the comparison, which is
 * exactly the "two screens disagree about where tablet starts" bug 8.1 exists
 * to close.
 *
 * Deliberately not gated on `Platform.OS`. The design brief's "native is a
 * single column at phone width" describes what real native devices measure
 * today, not a rule enforced by checking the platform — a native tablet
 * reports the same `useWindowDimensions` width a wide web viewport does, and
 * gets the same layout, which is the correct cross-platform reading rather
 * than a web-only fork.
 */
export function useIsTabletUp(): boolean {
  const { width } = useWindowDimensions();
  return width >= TABLET_BREAKPOINT;
}
