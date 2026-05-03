"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function NewsForm({ noticia, onSaved }: any) {
  const [form, setForm] = useState({
    titulo: "",
    resumo: "",
    imagem: "",
    destaque: "",
    status: "rascunho",
  });

  useEffect(() => {
    if (noticia) setForm(noticia);
  }, [noticia]);

  function handleChange(e: any) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: any) {
    e.preventDefault();

    if (noticia) {
      await supabase
        .from("noticias")
        .update(form)
        .eq("id", noticia.id);
    } else {
      await supabase.from("noticias").insert([
        {
          ...form,
          slug: form.titulo.toLowerCase().replace(/\s+/g, "-"),
          data: new Date().toISOString(),
        },
      ]);
    }

    setForm({
      titulo: "",
      resumo: "",
      imagem: "",
      destaque: "",
      status: "rascunho",
    });

    onSaved();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 border p-4 rounded">
      <h2 className="font-semibold">
        {noticia ? "Editar notícia" : "Nova notícia"}
      </h2>

      <input
        name="titulo"
        placeholder="Título"
        value={form.titulo}
        onChange={handleChange}
        className="w-full border p-2"
      />

      <textarea
        name="resumo"
        placeholder="Resumo"
        value={form.resumo}
        onChange={handleChange}
        className="w-full border p-2"
      />

      <input
        name="imagem"
        placeholder="URL da imagem"
        value={form.imagem}
        onChange={handleChange}
        className="w-full border p-2"
      />

      <select
        name="destaque"
        value={form.destaque}
        onChange={handleChange}
        className="w-full border p-2"
      >
        <option value="">Categoria</option>
        <option value="saude">Saúde</option>
        <option value="educacao">Educação</option>
        <option value="obras">Obras</option>
        <option value="assistencia">Assistência</option>
      </select>

      <select
        name="status"
        value={form.status}
        onChange={handleChange}
        className="w-full border p-2"
      >
        <option value="rascunho">Rascunho</option>
        <option value="publicado">Publicado</option>
      </select>

      <button className="bg-blue-600 text-white px-4 py-2 rounded">
        Salvar
      </button>
    </form>
  );
}