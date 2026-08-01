import type { ResponsiveImage } from '@gmrlog/types';
import { useTheme } from '@gmrlog/ui';
import type { ImageContentFit } from 'expo-image';
import type { ReactElement } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { CachedImage, type CachedImagePriority } from './cached-image';

export interface GmrImageProps {
  /** D3.26 responsive projection — null renders the placeholder surface only. */
  image: ResponsiveImage | null;
  /**
   * Container height, px — required together with `width` or `aspectRatio` so
   * the box is sized before the image resolves (CLS = 0). Width defaults to
   * `100%` — pair with a sized/flex parent when a fixed width is not given.
   */
  height: number;
  width?: number | `${number}%`;
  aspectRatio?: number;
  borderRadius?: number;
  accessibilityLabel?: string;
  contentFit?: ImageContentFit;
  priority?: CachedImagePriority;
  style?: StyleProp<ViewStyle>;
}

/**
 * Reusable responsive image primitive (D3.26 —
 * docs/18_CATALOG/MEDIA_INGESTION.md). Renders a fixed-size surface up front
 * so layout never shifts, fades in a BlurHash placeholder while the real
 * WebP variant loads, then crossfades to it via `CachedImage`.
 */
export function GmrImage({
  image,
  height,
  width = '100%',
  aspectRatio,
  borderRadius = 0,
  accessibilityLabel,
  contentFit = 'cover',
  priority = 'normal',
  style,
}: GmrImageProps): ReactElement {
  const theme = useTheme();

  return (
    <View
      style={[
        {
          height,
          width,
          aspectRatio,
          borderRadius,
          overflow: 'hidden',
          backgroundColor: theme.color('color.surface.secondary'),
        },
        style,
      ]}
    >
      {image !== null ? (
        <CachedImage
          source={{ uri: image.url }}
          placeholder={image.blurHash !== null ? { blurhash: image.blurHash } : undefined}
          placeholderContentFit={contentFit}
          contentFit={contentFit}
          priority={priority}
          accessibilityLabel={accessibilityLabel}
          style={{ width: '100%', height: '100%' }}
        />
      ) : null}
    </View>
  );
}
