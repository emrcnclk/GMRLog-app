import type { ComponentProps } from 'react';
import { Image as RNImage } from 'react-native';

/**
 * Stand-in for `expo-image` under vitest.
 *
 * The real module calls `requireNativeViewManager` at module scope and throws
 * `UnavailabilityError` outside a native runtime, so importing anything from
 * `@gmrlog/ui` — whose `Avatar` imports it — brought the whole barrel down
 * before a single component could mount. Aliased in `vitest.config.ts`.
 *
 * It renders a real `Image`, so a spec can still assert that an avatar or a
 * cover exists and carries its accessibility label; it just does not exercise
 * expo's caching, which is not a render concern.
 */
export function Image(props: ComponentProps<typeof RNImage>) {
  return <RNImage {...props} />;
}

export type ImageContentFit = 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
export type ImageProps = ComponentProps<typeof RNImage>;
