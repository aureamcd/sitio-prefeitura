"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import AdminNewsList from "@/components/admin/AdminNewsList";
import NewsForm from "@/components/admin/NewsForm";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AdminPage() {
  const [user, setUser] = useState<any>(null);
  const [editing, setEditing] = useState<any>(null);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
  }, []);

  async function handleLogin() {
    await supabase.auth.signInWithOAuth({ provider: "google" });
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setUser(null);
  }

  if (!user) {
    return (
      <div className="p-10 text-center">
        <h1 className="text-xl mb-4">Acesso restrito</h1>
        <button
          onClick={handleLogin}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Entrar com Google
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Painel de Notícias</h1>
        <button onClick={handleLogout}>Sair</button>
      </div>

      <NewsForm
        noticia={editing}
        onSaved={() => {
          setEditing(null);
          setRefresh((r) => r + 1);
        }}
      />

      <AdminNewsList
        key={refresh}
        onEdit={(n) => setEditing(n)}
      />
    </div>
  );
}