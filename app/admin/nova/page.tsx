"use client";

import { useState } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  Save,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Image as ImageIcon,
} from "lucide-react";
import Image from "next/image";
import { inserirNoticia } from "@/app/actions/noticias";

const CATEGORIAS = [
  { value: "saude", label: "Saúde" },
  { value: "educacao", label: "Educação" },
  { value: "obras", label: "Obras" },
  { value: "assistencia", label: "Assistência Social" },
  { value: "esporte", label: "Esporte" },
  { value: "licitacao", label: "Licitação" },
];

const STATUS_OPTIONS = [
  { value: "pendente", label: "Pendente (Revisão)" },
  { value: "publicado", label: "Publicado (Visível no site)" },
];

export default function NovaNoticiaPage() {
  const router = useRouter();
  const supabase = createBrowserClient();

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    titulo: "",
    slug: "",
    resumo: "",
    imagem: "",
    conteudo: "",
    destaque: [] as string[],
    status: "pendente",
    prioridade: "normal",
    fonte: "Portal Municipal",
  });

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    // Se estiver digitando o título e o slug estiver vazio, gera automático
    if (name === "titulo" && !form.slug) {
      const generatedSlug = value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setForm((prev) => ({ ...prev, slug: generatedSlug, titulo: value }));
    }
  }

  function handleCategoryToggle(value: string) {
    setForm((prev) => {
      const isActive = prev.destaque.includes(value);
      if (isActive) {
        return { ...prev, destaque: prev.destaque.filter((c) => c !== value) };
      } else {
        return { ...prev, destaque: [...prev.destaque, value] };
      }
    });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.titulo || !form.slug || !form.conteudo) {
      setError("Título, Slug e Conteúdo são obrigatórios.");
      return;
    }
    setSaving(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      await inserirNoticia(form, user?.email || "admin");
      
      setSaving(false);
      setSaved(true);
      window.dispatchEvent(new Event("refresh-counts"));
      setTimeout(() => {
        router.push("/admin"); // Volta para a página inicial do admin
      }, 1500);
    } catch (err: any) {
      setError(`Erro ao salvar: ${err.message}`);
      setSaving(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl hover:bg-gray-100 transition"
        >
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Nova Notícia</h1>
          <p className="text-sm text-gray-500">Crie e publique manualmente</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Título e Resumo */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
          <label className="block">
            <span className="text-sm font-semibold text-gray-700">Título</span>
            <input
              name="titulo"
              value={form.titulo}
              onChange={handleChange}
              className="mt-1.5 w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900
                focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition"
              required
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-gray-700">Slug (URL amigável)</span>
            <input
              name="slug"
              value={form.slug}
              onChange={handleChange}
              className="mt-1.5 w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-mono text-gray-900
                focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition"
              required
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-gray-700">Resumo da Chamada</span>
            <textarea
              name="resumo"
              value={form.resumo}
              onChange={handleChange}
              rows={3}
              className="mt-1.5 w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900
                focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition resize-none"
            />
          </label>
        </div>

        {/* Imagem */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
          <label className="block">
            <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              URL da Imagem de Capa
            </span>
            <input
              name="imagem"
              value={form.imagem}
              onChange={handleChange}
              placeholder="https://..."
              className="mt-1.5 w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900
                focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition"
            />
          </label>

          {form.imagem && (
            <div className="relative w-full h-48 rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
              <Image
                src={form.imagem}
                alt="Preview"
                fill
                className="object-contain"
              />
            </div>
          )}
        </div>

        {/* Categorias + Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Categorias */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <p className="text-sm font-semibold text-gray-700 mb-3">
              Categorias
            </p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIAS.map((cat) => {
                const isActive = form.destaque.includes(cat.value);
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => handleCategoryToggle(cat.value)}
                    className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition ${
                      isActive
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Status */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <label className="block h-full">
              <span className="text-sm font-semibold text-gray-700 mb-3 block">
                Status Inicial
              </span>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900
                  focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <label className="block">
            <span className="text-sm font-semibold text-gray-700">
              Conteúdo
            </span>
            <textarea
              name="conteudo"
              value={form.conteudo}
              onChange={handleChange}
              rows={15}
              className="mt-1.5 w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900
                focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition resize-y"
              required
            />
          </label>
        </div>

        {/* Erro */}
        {error && (
          <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm border border-red-200">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving || saved}
            className="flex items-center gap-2 px-8 py-3 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : saved ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            {saved ? "Criado com sucesso!" : "Criar Notícia"}
          </button>
        </div>
      </form>
    </div>
  );
}
