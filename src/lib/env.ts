import { z } from "zod";

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),
});

const serverEnvSchema = publicEnvSchema.extend({
  PERPLEXITY_API_KEY: z.string().optional(),           // требуется на Итерации 4
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),    // только для админ-скриптов
});

export const publicEnv = publicEnvSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});

export function getServerEnv() {
  // Ленивая проверка на сервере, чтобы не падало в браузере.
  if (typeof window !== "undefined") {
    throw new Error("getServerEnv() called on the client");
  }
  return serverEnvSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    PERPLEXITY_API_KEY: process.env.PERPLEXITY_API_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  });
}
