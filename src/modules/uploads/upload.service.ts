import crypto from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { env } from "../../config/env.js";
import { ApiError } from "../../utils/api-error.js";

type UploadedFile = Express.Multer.File;

function createObjectKey(file: UploadedFile, folder: string) {
  const extension = path.extname(file.originalname).toLowerCase() || ".jpg";
  return `${folder}/${Date.now()}-${crypto.randomUUID()}${extension}`;
}

function assertS3Config() {
  const missing = [
    ["AWS_REGION", env.AWS_REGION],
    ["AWS_ACCESS_KEY_ID", env.AWS_ACCESS_KEY_ID],
    ["AWS_SECRET_ACCESS_KEY", env.AWS_SECRET_ACCESS_KEY],
    ["AWS_S3_BUCKET_NAME", env.AWS_S3_BUCKET_NAME]
  ]
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new ApiError(500, `Missing S3 configuration: ${missing.join(", ")}`);
  }
}

function createS3PublicUrl(key: string) {
  if (env.AWS_S3_PUBLIC_BASE_URL) {
    return `${env.AWS_S3_PUBLIC_BASE_URL.replace(/\/$/, "")}/${key}`;
  }

  return `https://${env.AWS_S3_BUCKET_NAME}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;
}

async function uploadToS3(file: UploadedFile, folder: string) {
  assertS3Config();

  const key = createObjectKey(file, folder);
  const client = new S3Client({
    region: env.AWS_REGION,
    credentials: {
      accessKeyId: env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY!
    }
  });

  await client.send(
    new PutObjectCommand({
      Bucket: env.AWS_S3_BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype
    })
  );

  return {
    url: createS3PublicUrl(key),
    key
  };
}

async function uploadToLocal(file: UploadedFile, folder: string, hostUrl: string) {
  await fs.mkdir(path.resolve(process.cwd(), "uploads", folder), { recursive: true });

  const key = createObjectKey(file, folder);
  const filepath = path.resolve(process.cwd(), "uploads", key);
  await fs.writeFile(filepath, file.buffer);

  return {
    url: `${hostUrl}/uploads/${key}`,
    key
  };
}

async function uploadFile(file: UploadedFile, folder: string, hostUrl: string) {
  if (env.STORAGE_DRIVER === "s3") {
    return uploadToS3(file, folder);
  }

  return uploadToLocal(file, folder, hostUrl);
}

export async function getStorageReadiness() {
  if (env.STORAGE_DRIVER === "s3") {
    const missing = [
      ["AWS_REGION", env.AWS_REGION],
      ["AWS_ACCESS_KEY_ID", env.AWS_ACCESS_KEY_ID],
      ["AWS_SECRET_ACCESS_KEY", env.AWS_SECRET_ACCESS_KEY],
      ["AWS_S3_BUCKET_NAME", env.AWS_S3_BUCKET_NAME]
    ]
      .filter(([, value]) => !value)
      .map(([key]) => key);

    return {
      driver: "s3",
      ready: missing.length === 0,
      details: missing.length === 0 ? "S3 configuration present" : `Missing: ${missing.join(", ")}`
    } as const;
  }

  const baseDir = path.resolve(process.cwd(), "uploads");
  await fs.mkdir(baseDir, { recursive: true });

  return {
    driver: "local",
    ready: true,
    details: baseDir
  } as const;
}

export async function uploadProfileImage(file: UploadedFile, hostUrl: string) {
  return uploadFile(file, "profile-images", hostUrl);
}

export async function uploadCourseVideo(file: UploadedFile, hostUrl: string) {
  return uploadFile(file, "course-videos", hostUrl);
}

export async function uploadCourseThumbnail(file: UploadedFile, hostUrl: string) {
  return uploadFile(file, "course-thumbnails", hostUrl);
}
