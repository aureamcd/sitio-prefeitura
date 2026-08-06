"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { createBrowserClient } from "@/lib/supabase/client";
import AdminNewsTable, {
  type Noticia,
} from "@/components/admin/AdminNewsTable";
import { Clock, Loader2, Database, ChevronRight } from "lucide-react";
import { TABELAS_TRANSPARENCIA } from "@/lib/admin/transparencia-tables";

type TransparenciaCounts = Record<string, number>;

export default function AdminPage() {
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState<TransparenciaCounts>({});
  const [countsLoading, setCountsLoading] = useState(true);
  const supabase = createBrowserClient();

  const fetchNoticias = useCallback(async () => {
    const { data } = await supabase
      .from("noticias")
      .select("*")
      .eq("status", "pendente")
      .order("created_at", { ascending: false });
    setNoticias(data || []);
    setLoading(false);
  }, [supabase]);

  // Buscar contagens de todas as tabelas da transparência
  useEffect(() => {
    async function fetchCounts() {
      const queries = TABELAS_TRANSPARENCIA.map(async (t) => {
        const { count } = await supabase
          .schema(t.schema)
          .from(t.table)
          .select("*", { count: "exact", head: true });
        return { slug: t.slug, count: count || 0 };
      });

      const results = await Promise.all(queries);
      const map: TransparenciaCounts = {};
      results.forEach((r) => { map[r.slug] = r.count; });
      setCounts(map);
      setCountsLoading(false);
    }

    fetchCounts();
  }, [supabase]);

  useEffect(() => {
    fetchNoticias();
  }, [fetchNoticias]);

  return (
    <div className="space-y-10">
      {/* ═══ SEÇÃO: NOTÍCIAS ═══ */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Notícias Pendentes
            </h2>
            <p className="text-sm text-gray-500">
              {noticias.length} notícia{noticias.length !== 1 ? "s" : ""} aguardando aprovação
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-gray-300 animate-spin" />
          </div>
        ) : (
          <AdminNewsTable
            noticias={noticias}
            showApprove
            showReject
            showEdit
            onRefresh={fetchNoticias}
            emptyMessage="Nenhuma notícia pendente. Todas foram moderadas!"
          />
        )}
      </div>
    </div>
  );
}
