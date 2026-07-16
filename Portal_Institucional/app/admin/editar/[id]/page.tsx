"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import { useRouter, useParams } from "next/navigation";
import {
  Save,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Image as ImageIcon,
} from "lucide-react";
import Image from "next/image";
import { atualizarNoticia } from "@/app/actions/noticias";

const CATEGORIAS = [
  { value: "saude", label: "Saúde" },
  { value: "educacao", label: "Educação" },
  { value: "obras", label: "Obras" },
  { value: "assistencia", label: "Assistência Social" },
  { value: "esporte", label: "Esporte" },
  { value: "licitacao", label: "Licitação" },
];

const STATUS_OPTIONS = [
  { value: "pendente", label: "Pendente", color: "text-amber-600" },
  { value: "publicado", label: "Publicado", color: "text-green-600" },
  { value: "rejeitado", label: "Rejeitado", color: "text-red-600" },
  { value: "arquivado", label: "Arquivado", color: "text-gray-600" },
];

export default function EditarNoticiaPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const supabase = createBrowserClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    titulo: "",
    resumo: "",
    conteudo: "",
    imagem: "",
    slug: "",
    status: "pendente",
    destaque: [] as string[],
  });

  useEffect(() => {
    async function fetchNoticia() {
      const { data, error } = await supabase
        .from("noticias")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) {
        setError("Notícia não encontrada.");
        setLoading(false);
        return;
      }

      setForm({
        titulo: data.titulo || "",
        resumo: data.resumo || "",
        conteudo: data.conteudo || "",
        imagem: data.imagem || "",
        slug: data.slug || "",
        status: data.status || "pendente",
        destaque: Array.isArray(data.destaque) ? data.destaque : [],
      });
      setLoading(false);
    }

    fetchNoticia();
  }, [id, supabase]);

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setSaved(false);
  }

  function handleCategoryToggle(cat: string) {
    setForm((prev) => ({
      ...prev,
      destaque: prev.destaque.includes(cat)
        ? prev.destaque.filter((c) => c !== cat)
        : [...prev.destaque, cat],
    }));
    setSaved(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const updateData: Record<string, unknown> = { ...form };

    try {
      await atualizarNoticia(id, updateData);
      setSaving(false);
      setSaved(true);
      window.dispatchEvent(new Event("refresh-counts"));
      setTimeout(() => {
        setSaved(false);
        router.back();
      }, 1500);
    } catch (err: any) {
      setError(`Erro ao salvar: ${err.message}`);
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-gray-300 animate-spin" />
      </div>
    );
  }

  if (error && !form.titulo) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500 font-medium">{error}</p>
        <button
          onClick={() => router.back()}
          className="mt-4 text-blue-600 font-medium"
        >
          ← Voltar
        </button>
      </div>
    );
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
          <h1 className="text-xl font-bold text-gray-900">Editar Notícia</h1>
          <p className="text-sm text-gray-500">ID: {id}</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Título */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
          <label className="block">
            <span className="text-sm font-semibold text-gray-700">Título</span>
            <input
              name="titulo"
              value={form.titulo}
              onChange={handleChange}
              className="mt-1.5 w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900
                focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-gray-700">Slug</span>
            <input
              name="slug"
              value={form.slug}
              onChange={handleChange}
              className="mt-1.5 w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-mono text-gray-900
                focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-gray-700">Resumo</span>
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
              URL da Imagem
            </span>
            <input
              name="imagem"
              value={form.imagem}
              onChange={handleChange}
              className="mt-1.5 w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900
                focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition"
            />
          </label>

          {form.imagem && (
            <div className="relative w-full h-48 rounded-xl overflow-hidden bg-gray-100">
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
            <p className="text-sm font-semibold text-gray-700 mb-3">Status</p>
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
          </div>
        </div>

        {/* Conteúdo */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">
              Conteúdo da Notícia
            </span>
            <button
              type="button"
              onClick={() => {
                const url = window.prompt("Cole o link da foto que deseja inserir no meio do texto:");
                if (url && url.trim()) {
                  const tag = `\n\n<figure class="my-8"><img src="${url.trim()}" alt="Foto da Notícia" class="rounded-2xl shadow-lg w-full max-h-[500px] object-cover mx-auto" /></figure>\n\n`;
                  setForm(prev => ({ ...prev, conteudo: prev.conteudo + tag }));
                }
              }}
              className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
            >
              🖼️ + Inserir Foto no Meio da Notícia
            </button>
          </div>
          <textarea
            name="conteudo"
            value={form.conteudo}
            onChange={handleChange}
            rows={15}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900
              focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition resize-y font-sans"
            required
            placeholder="Digite o texto da notícia aqui. Para separar em parágrafos, basta apertar Enter duas vezes..."
          />
          <p className="text-xs text-gray-500 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
            💡 <strong>Dica de formatação:</strong> Para separar os parágrafos, basta apertar <strong>Enter duas vezes</strong>. Para colocar uma foto no meio da matéria, clique no botão azul <em>"+ Inserir Foto no Meio da Notícia"</em> acima ou cole o link direto da foto em uma linha separada!
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Botão Salvar */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-[#0B3D91] text-white font-semibold rounded-xl
              hover:bg-[#0a3580] active:scale-[0.98] transition-all
              disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            {saving ? "Salvando..." : "Salvar alterações"}
          </button>

          {saved && (
            <span className="flex items-center gap-1.5 text-green-600 text-sm font-medium animate-pulse">
              <CheckCircle2 className="w-4 h-4" />
              Salvo com sucesso!
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
