"use client";

import { useEffect, useState, useCallback } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import AdminNewsTable, { type Noticia } from "@/components/admin/AdminNewsTable";
import { Clock, Loader2 } from "lucide-react";

export default function PendentesPage() {
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createBrowserClient();

  const fetchNoticias = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("noticias")
      .select("*")
      .eq("status", "pendente")
      .order("created_at", { ascending: false });
    setNoticias(data || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchNoticias();
  }, [fetchNoticias]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
          <Clock className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Notícias Pendentes
          </h1>
          <p className="text-sm text-gray-500">
            {noticias.length} notícia{noticias.length !== 1 ? "s" : ""}{" "}
            aguardando aprovação
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
  );
}
