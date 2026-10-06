import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default("5000"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  JWT_SECRET: z.string().min(32, "JWT secret must be at least 32 characters long"),
  JWT_REFRESH_SECRET: z.string().min(32, "JWT refresh secret must be at least 32 characters long"),
  DATABASE_URL: z.string().url("Must be a valid database connection string"),
  SMTP_HOST: z.string(),
  SMTP_PORT: z.string().transform((val) => parseInt(val, 10)),
  SMTP_USER: z.string(),
  SMTP_PASS: z.string(),
  SMTP_FROM: z.string().email(),
});

export const env = envSchema.parse(process.env);

export const DATABASE_URL = env.DATABASE_URL;