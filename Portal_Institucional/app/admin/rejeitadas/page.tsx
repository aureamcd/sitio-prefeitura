"use client";

import { useEffect, useState, useCallback } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import AdminNewsTable, { type Noticia } from "@/components/admin/AdminNewsTable";
import { XCircle, Loader2 } from "lucide-react";

export default function RejeitadasPage() {
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createBrowserClient();

  const fetchNoticias = useCallback(async () => {
    const { data } = await supabase
      .from("noticias")
      .select("*")
      .eq("status", "rejeitado")
      .order("data", { ascending: false });
    setNoticias(data || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchNoticias();
  }, [fetchNoticias]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
          <XCircle className="w-5 h-5 text-red-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Notícias Rejeitadas
          </h1>
          <p className="text-sm text-gray-500">
            {noticias.length} notícia{noticias.length !== 1 ? "s" : ""}{" "}
            rejeitada{noticias.length !== 1 ? "s" : ""}
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
          showArchive
          showEdit
          onRefresh={fetchNoticias}
          emptyMessage="Nenhuma notícia rejeitada."
        />
      )}
    </div>
  );
}
