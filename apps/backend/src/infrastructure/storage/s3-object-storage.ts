import {
  CreateBucketCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common';

import type { BackendEnv } from '../config/env.schema';

import type {
  ObjectHeadResult,
  ObjectStoragePort,
  PresignedPutResult,
} from './object-storage.port';

@Injectable()
export class S3ObjectStorage implements ObjectStoragePort {
  private readonly client: S3Client;
  private readonly bucket: string;
  private bucketReady: Promise<void> | null = null;

  constructor(private readonly env: BackendEnv) {
    this.bucket = env.S3_BUCKET;
    this.client = new S3Client({
      region: env.S3_REGION,
      endpoint: env.S3_ENDPOINT,
      forcePathStyle: env.S3_FORCE_PATH_STYLE,
      credentials: {
        accessKeyId: env.S3_ACCESS_KEY,
        secretAccessKey: env.S3_SECRET_KEY,
      },
    });
  }

  async createPresignedPut(input: {
    storageKey: string;
    contentType: string;
    byteSize: number;
    expiresInSeconds: number;
  }): Promise<PresignedPutResult> {
    await this.ensureBucket();
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: input.storageKey,
      ContentType: input.contentType,
      ContentLength: input.byteSize,
    });
    const uploadUrl = await getSignedUrl(this.client, command, {
      expiresIn: input.expiresInSeconds,
    });
    const expiresAt = new Date(Date.now() + input.expiresInSeconds * 1000);
    return {
      uploadUrl,
      headers: {
        'Content-Type': input.contentType,
        'Content-Length': String(input.byteSize),
      },
      expiresAt,
    };
  }

  async headObject(storageKey: string): Promise<ObjectHeadResult | null> {
    try {
      const result = await this.client.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: storageKey }),
      );
      return {
        contentLength: result.ContentLength ?? 0,
        contentType: result.ContentType ?? null,
        etag: result.ETag ?? null,
      };
    } catch {
      return null;
    }
  }

  async getObjectBuffer(storageKey: string): Promise<Buffer | null> {
    try {
      const result = await this.client.send(
        new GetObjectCommand({ Bucket: this.bucket, Key: storageKey }),
      );
      if (result.Body == null) {
        return null;
      }
      const bytes = await result.Body.transformToByteArray();
      return Buffer.from(bytes);
    } catch {
      return null;
    }
  }

  async putObject(storageKey: string, body: Buffer, contentType: string): Promise<void> {
    await this.ensureBucket();
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: storageKey,
        Body: body,
        ContentType: contentType,
      }),
    );
  }

  async deleteObject(storageKey: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: storageKey }));
  }

  async deleteMany(storageKeys: readonly string[]): Promise<number> {
    if (storageKeys.length === 0) {
      return 0;
    }
    const result = await this.client.send(
      new DeleteObjectsCommand({
        Bucket: this.bucket,
        Delete: {
          Objects: storageKeys.map((key) => ({ Key: key })),
          Quiet: true,
        },
      }),
    );
    return result.Deleted?.length ?? 0;
  }

  async ping(): Promise<boolean> {
    try {
      await this.ensureBucket();
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
      return true;
    } catch {
      return false;
    }
  }

  private ensureBucket(): Promise<void> {
    this.bucketReady ??= this.createBucketIfMissing();
    return this.bucketReady;
  }

  private async createBucketIfMissing(): Promise<void> {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch {
      await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
    }
  }
}
