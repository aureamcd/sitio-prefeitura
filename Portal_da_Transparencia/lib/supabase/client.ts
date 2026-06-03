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

      // Para evitar baixar milhares de linhas e travar o navegador,
      // buscamos apenas o maior e o menor ano e preenchemos o intervalo.
      let maxQuery = supabase
        .schema("transparencia")
        .from(table)
        .select(column)
        .not(column, "is", null)
        .order(column, { ascending: false })
        .limit(1);

      let minQuery = supabase
        .schema("transparencia")
        .from(table)
        .select(column)
        .not(column, "is", null)
        .order(column, { ascending: true })
        .limit(1);

      if (empresa) {
        maxQuery = maxQuery.eq("empresa", empresa);
        minQuery = minQuery.eq("empresa", empresa);
      }

      const { data: maxData, error: maxError } = await maxQuery;
      const { data: minData, error: minError } = await minQuery;

      if (!cancelled) {
        if (!maxError && !minError && maxData?.length > 0 && minData?.length > 0) {
          const maxAno = Number((maxData as any[])[0][column]);
          const minAno = Number((minData as any[])[0][column]);
          
          const distinct = [];
          for (let i = maxAno; i >= minAno; i--) {
            distinct.push(String(i));
          }
          setAnos(distinct);
        } else {
          // Se estiver vazio ou der erro, mantém o ano atual
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
