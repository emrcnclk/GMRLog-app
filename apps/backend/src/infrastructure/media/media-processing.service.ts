import { Inject, Injectable } from '@nestjs/common';
import { encode } from 'blurhash';
import sharp from 'sharp';

import { AppLogger } from '../logging/app-logger.service';
import type { ObjectStoragePort } from '../storage/object-storage.port';
import { OBJECT_STORAGE } from '../storage/storage.tokens';

/**
 * Original → Sharp → WebP variants → BlurHash → object storage (D3.26 —
 * docs/18_CATALOG/MEDIA_INGESTION.md). The original bytes are never
 * persisted; only derived WebP variants leave this service.
 */

export type ImageVariantName = 'thumb' | 'standard' | 'hero';

/** Longest edge, px, per variant — `fit: inside`, never upscaled. */
const VARIANT_EDGE_PX: Record<ImageVariantName, number> = {
  thumb: 200,
  standard: 800,
  hero: 1920,
};

const WEBP_QUALITY = 82;
const BLURHASH_SAMPLE_PX = 32;
const BLURHASH_COMPONENTS_X = 4;
const BLURHASH_COMPONENTS_Y = 3;

export type ImageVariantKeys = Record<ImageVariantName, string>;

export interface ProcessImageInput {
  /** Original, undecoded image bytes. Never written to storage as-is. */
  sourceBuffer: Buffer;
  /** Storage key prefix, no extension, e.g. `games/{gameId}/{kind}/{digest}`. */
  keyPrefix: string;
}

export interface ProcessedImageResult {
  variants: ImageVariantKeys;
  blurHash: string;
  width: number;
  height: number;
}

@Injectable()
export class MediaProcessingService {
  constructor(
    @Inject(OBJECT_STORAGE) private readonly storage: ObjectStoragePort,
    private readonly logger: AppLogger,
  ) {}

  async processImage(input: ProcessImageInput): Promise<ProcessedImageResult> {
    const source = sharp(input.sourceBuffer, { failOn: 'none' }).rotate();
    const metadata = await source.metadata();

    const blurHash = await this.computeBlurHash(input.sourceBuffer);

    const variantEntries = await Promise.all(
      (Object.entries(VARIANT_EDGE_PX) as [ImageVariantName, number][]).map(
        async ([name, edge]) => {
          const buffer = await sharp(input.sourceBuffer, { failOn: 'none' })
            .rotate()
            .resize(edge, edge, { fit: 'inside', withoutEnlargement: true })
            .webp({ quality: WEBP_QUALITY })
            .toBuffer();
          const key = `${input.keyPrefix}-${name}.webp`;
          await this.storage.putObject(key, buffer, 'image/webp');
          return [name, key] as const;
        },
      ),
    );

    const variants = Object.fromEntries(variantEntries) as ImageVariantKeys;

    this.logger.event(
      'info',
      { keyPrefix: input.keyPrefix, blurHash, variants },
      'media.process.completed',
    );

    return {
      variants,
      blurHash,
      width: metadata.width,
      height: metadata.height,
    };
  }

  private async computeBlurHash(sourceBuffer: Buffer): Promise<string> {
    const { data, info } = await sharp(sourceBuffer, { failOn: 'none' })
      .rotate()
      .resize(BLURHASH_SAMPLE_PX, BLURHASH_SAMPLE_PX, { fit: 'inside' })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    return encode(
      new Uint8ClampedArray(data),
      info.width,
      info.height,
      BLURHASH_COMPONENTS_X,
      BLURHASH_COMPONENTS_Y,
    );
  }
}
