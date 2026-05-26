'use client';

import { useState, useEffect } from 'react';
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

/**
 * Hook que busca dinamicamente todos os anos disponíveis em uma tabela
 * do schema "transparencia" no banco de dados.
 * Retorna { anos: string[], loading: boolean }.
 * Inicializa com o ano corrente como fallback para evitar flicker.
 */
export function useAvailableYears(table: string): {
  anos: string[];
  loading: boolean;
} {
  const [anos, setAnos] = useState<string[]>([String(new Date().getFullYear())]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createBrowserClient();

    supabase
      .schema('transparencia')
      .from(table)
      .select('ano')
      .not('ano', 'is', null)
      .order('ano', { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) {
          const unique = [...new Set(data.map((r: any) => String(r.ano)))]
            .sort()
            .reverse();
          setAnos(unique.length > 0 ? unique : [String(new Date().getFullYear())]);
        } else {
          console.error(`Error fetching years from ${table}:`, error);
        }
        setLoading(false);
      });
  }, [table]);

  return { anos, loading };
}
