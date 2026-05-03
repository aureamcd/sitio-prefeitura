"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AdminNewsList({ onEdit }: any) {
  const [noticias, setNoticias] = useState<any[]>([]);

  useEffect(() => {
    fetchNoticias();
  }, []);

  async function fetchNoticias() {
    const { data } = await supabase
      .from("noticias")
      .select("*")
      .order("data", { ascending: false });

    setNoticias(data || []);
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir?")) return;

    await supabase.from("noticias").delete().eq("id", id);
    fetchNoticias();
  }

  return (
    <div className="space-y-2">
      {noticias.map((n) => (
        <div
          key={n.id}
          className="border p-3 rounded flex justify-between items-center"
        >
          <div>
            <p className="font-semibold">{n.titulo}</p>
            <p className="text-sm text-gray-500">
              {n.status}
            </p>
          </div>

          <div className="flex gap-2">
            <button onClick={() => onEdit(n)}>✏️</button>
            <button onClick={() => handleDelete(n.id)}>🗑️</button>
          </div>
        </div>
      ))}
    </div>
  );
}