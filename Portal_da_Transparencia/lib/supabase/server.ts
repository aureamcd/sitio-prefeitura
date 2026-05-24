import { createClient } from "@supabase/supabase-js";

/**
 * Supabase client para uso no SERVIDOR (Server Components, API Routes, Middleware).
 * Usa a service_role key — bypassa RLS.
 * NUNCA usar no client.
 */
export function createServerClient() {
  return createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
