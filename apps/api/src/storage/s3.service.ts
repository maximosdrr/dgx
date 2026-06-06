import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const PRESIGNED_TTL_SECONDS = 86400; // 24h

@Injectable()
export class S3Service {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(private readonly config: ConfigService) {
    this.bucket = config.getOrThrow<string>('S3_BUCKET');

    const endpoint = config.get<string>('S3_ENDPOINT');
    this.client = new S3Client({
      region: config.get<string>('AWS_REGION', 'us-east-1'),
      ...(endpoint && {
        endpoint,
        forcePathStyle: true, // required for MinIO
        credentials: {
          accessKeyId: config.get<string>('AWS_ACCESS_KEY_ID', 'docgen'),
          secretAccessKey: config.get<string>('AWS_SECRET_ACCESS_KEY', 'docgen123'),
        },
      }),
    });
  }

  async uploadFile(key: string, buffer: Buffer, contentType: string): Promise<void> {
    try {
      await this.client.send(new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: buffer, ContentType: contentType }));
    } catch (err) {
      throw new InternalServerErrorException(`S3 upload failed: ${(err as Error).message}`);
    }
  }

  /** Returns a public-accessible object URL.
   *  For local MinIO: <endpoint>/<bucket>/<key>
   *  For AWS S3: https://<bucket>.s3.<region>.amazonaws.com/<key>
   */
  getObjectUrl(key: string): string {
    const endpoint = this.config.get<string>('S3_ENDPOINT');
    const region = this.config.get<string>('AWS_REGION', 'us-east-1');
    return endpoint
      ? `${endpoint}/${this.bucket}/${key}`
      : `https://${this.bucket}.s3.${region}.amazonaws.com/${key}`;
  }

  async uploadPdf(key: string, buffer: Buffer): Promise<void> {
    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: buffer,
          ContentType: 'application/pdf',
        }),
      );
    } catch (err) {
      throw new InternalServerErrorException(`S3 upload failed: ${(err as Error).message}`);
    }
  }

  async getPresignedUrl(key: string): Promise<{ url: string; expiresAt: Date }> {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    const url = await getSignedUrl(this.client, command, {
      expiresIn: PRESIGNED_TTL_SECONDS,
    });
    const expiresAt = new Date(Date.now() + PRESIGNED_TTL_SECONDS * 1000);
    return { url, expiresAt };
  }

  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
}
