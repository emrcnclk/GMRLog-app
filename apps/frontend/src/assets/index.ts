export {
  CachedImage,
  prefetchCachedImages,
  type CachedImageProps,
  type CachedImagePriority,
} from './cached-image';
export { GmrImage, type GmrImageProps } from './gmr-image';

/**
 * Font / icon / illustration catalogs register here as assets land.
 * Application fonts continue to load via `lib/fonts/load-fonts`.
 */
export const assetCatalog = {
  fonts: 'lib/fonts/load-fonts',
  icons: '@gmrlog/ui Icon',
  illustrations: 'deferred',
} as const;
