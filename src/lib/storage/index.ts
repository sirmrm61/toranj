import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { env } from "@/lib/env";

let client: S3Client | null = null;
let bucketReady: Promise<void> | null = null;

function s3() {
  if (!client) {
    client = new S3Client({
      endpoint: env.storage.endpoint,
      region: env.storage.region,
      forcePathStyle: env.storage.forcePathStyle,
      credentials: { accessKeyId: env.storage.accessKey, secretAccessKey: env.storage.secretKey },
    });
  }
  return client;
}

async function ensureBucket() {
  bucketReady ??= (async () => {
    const Bucket = env.storage.bucket;
    try {
      await s3().send(new HeadBucketCommand({ Bucket }));
    } catch {
      await s3().send(new CreateBucketCommand({ Bucket }));
    }
  })().catch((e) => {
    bucketReady = null;
    throw e;
  });
  return bucketReady;
}

/** Private object storage. The bucket is never exposed publicly; objects are streamed through the app. */
export const storage = {
  async put(key: string, body: Buffer, contentType: string) {
    await ensureBucket();
    await s3().send(
      new PutObjectCommand({
        Bucket: env.storage.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
        ServerSideEncryption: process.env.STORAGE_SSE === "true" ? "AES256" : undefined,
      }),
    );
  },

  async get(key: string): Promise<{ body: Buffer; contentType: string } | null> {
    await ensureBucket();
    try {
      const res = await s3().send(new GetObjectCommand({ Bucket: env.storage.bucket, Key: key }));
      const bytes = await res.Body!.transformToByteArray();
      return { body: Buffer.from(bytes), contentType: res.ContentType ?? "application/octet-stream" };
    } catch (e) {
      if ((e as { name?: string }).name === "NoSuchKey") return null;
      throw e;
    }
  },

  async delete(key: string) {
    await ensureBucket();
    await s3().send(new DeleteObjectCommand({ Bucket: env.storage.bucket, Key: key }));
  },
};

export const keys = {
  tryonInput: (userId: string, jobId: string) => `tryon/${userId}/${jobId}/input.jpg`,
  tryonResult: (userId: string, jobId: string) => `tryon/${userId}/${jobId}/result.jpg`,
  tryonPreview: (userId: string, jobId: string) => `tryon/${userId}/${jobId}/preview.jpg`,
  gownImage: (id: string, ext: string) => `gowns/${id}.${ext}`,
};
