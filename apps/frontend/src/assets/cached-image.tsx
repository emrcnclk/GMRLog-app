import { FADE_IMAGE_TRANSITION_MS, useReduceMotion } from '@gmrlog/ui';
import { Image, type ImageProps } from 'expo-image';
import type { ReactElement } from 'react';

export type CachedImagePriority = 'low' | 'normal' | 'high';

export interface CachedImageProps extends ImageProps {
  priority?: CachedImagePriority;
}

/**
 * Cached image primitive (expo-image disk/memory cache).
 * Transition respects effective reduce-motion.
 */
export function CachedImage({
  priority = 'normal',
  transition,
  cachePolicy = 'memory-disk',
  ...props
}: CachedImageProps): ReactElement {
  const reduceMotion = useReduceMotion();
  const resolvedTransition =
    transition === undefined
      ? reduceMotion
        ? 0
        : FADE_IMAGE_TRANSITION_MS
      : reduceMotion
        ? 0
        : transition;

  return (
    <Image
      cachePolicy={cachePolicy}
      transition={resolvedTransition}
      priority={priority}
      {...props}
    />
  );
}

/** Prefetch helper for avatars / covers / banners — fire-and-forget. */
export function prefetchCachedImages(uris: readonly (string | null | undefined)[]): void {
  const unique = [...new Set(uris.filter((uri): uri is string => Boolean(uri && uri.length > 0)))];
  if (unique.length === 0) {
    return;
  }
  void Image.prefetch(unique);
}
