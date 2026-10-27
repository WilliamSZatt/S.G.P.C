import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1).default('file:./dev.db'),
  PORT: z.coerce.number().int().positive().default(3333),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  JWT_SECRET: z.string().min(16).default('development-secret-change-me'),
  JWT_EXPIRES_IN: z.string().default('1d'),
  PASSWORD_RESET_EXPIRES_IN_MINUTES: z.coerce.number().int().positive().default(30),
  PASSWORD_RESET_WEBHOOK_URL: z.string().url().optional().or(z.literal(''))
});

export const config = envSchema.parse(process.env);
