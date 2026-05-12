import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(24, "JWT_SECRET must be at least 24 characters"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  ADMIN_API_KEY: z.string().min(1).default("pawplan-admin"),
  ADMIN_EMAIL: z.string().email().default("admin@pawplan.com"),
  ADMIN_PASSWORD: z.string().min(8).default("Password@123"),
  STORAGE_DRIVER: z.enum(["local", "s3"]).default("local"),
  AWS_REGION: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_S3_BUCKET_NAME: z.string().optional(),
  AWS_S3_PUBLIC_BASE_URL: z.string().optional()
});

export const env = envSchema.parse(process.env);
