import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase client SINGLETON para uso no BROWSER (client components).
 * Usa a anon key — respeita RLS.
 * Garante uma única instância para evitar "Multiple GoTrueClient instances".
 */
let client: SupabaseClient | null = null;

export function createBrowserClient(): SupabaseClient {
  if (!client) {
    client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return client;
}
