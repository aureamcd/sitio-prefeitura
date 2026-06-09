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
  empresa?: string,
  column: string = "ano"
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

      // Buscamos a coluna desejada e extraímos apenas os anos únicos,
      // filtrando dados inválidos (como anos bizarros < 1900 inseridos por erro humano).
      let query = supabase
        .schema("transparencia")
        .from(table)
        .select(column)
        .not(column, "is", null);

      if (empresa) {
        query = query.eq("empresa", empresa);
      }

      const { data, error } = await query;

      if (!cancelled) {
        if (!error && data && data.length > 0) {
          const anosSet = new Set<number>();
          
          for (const row of data as any[]) {
            const val = Number(row[column]);
            // Só aceita anos plausíveis (ex: >= 2000 até o ano atual + 2)
            if (!isNaN(val) && val >= 2000 && val <= new Date().getFullYear() + 2) {
              anosSet.add(val);
            }
          }
          
          const distinct = Array.from(anosSet)
            .sort((a, b) => b - a)
            .map(String);
            
          setAnos(distinct.length > 0 ? distinct : [currentYear]);
        } else {
          setAnos([currentYear]);
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
