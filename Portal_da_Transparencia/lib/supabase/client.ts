import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { useState, useEffect } from "react";

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

/**
 * React hook that fetches the distinct available years from a given table
 * in the 'transparencia' schema. Returns sorted (desc) anos + loading state.
 *
 * @param table - Nome da tabela no schema 'transparencia'
 * @param empresa - Opcional: código da empresa para filtrar anos
 */
export function useAvailableYears(
  table: string,
  empresa?: string
): {
  anos: string[];
  loading: boolean;
} {
  const currentYear = new Date().getFullYear().toString();
  const [anos, setAnos] = useState<string[]>([currentYear]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchAnos() {
      setLoading(true);
      const supabase = createBrowserClient();

      let query = supabase
        .schema("transparencia")
        .from(table)
        .select("ano")
        .not("ano", "is", null)
        .order("ano", { ascending: false });

      if (empresa) {
        query = query.eq("empresa", empresa);
      }

      const { data, error } = await query;

      if (!cancelled) {
        if (!error && data) {
          const distinct = [
            ...new Set(
              data.map((r: any) => String(r.ano)).filter(Boolean)
            ),
          ];
          setAnos(distinct);
        } else {
          console.error(
            `Error fetching available years from ${table}:`,
            error
          );
          setAnos([]);
        }
        setLoading(false);
      }
    }

    fetchAnos();
    return () => {
      cancelled = true;
    };
  }, [table, empresa]);

  return { anos, loading };
}
