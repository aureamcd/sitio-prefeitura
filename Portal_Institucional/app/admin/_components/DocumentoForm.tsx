"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/client";
import slugify from "slugify";
import {
  Save, ArrowLeft, Loader2, CheckCircle2, XCircle, FileUp, FileText,
  X, Eye, RefreshCw, ExternalLink, ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import ModalTarjamentoInterativo from "./ModalTarjamentoInterativo";

import {
  TIPOS_LEGISLACAO,
  TIPOS_PUBLICACAO,
  TIPOS_PRESTACAO_CONTAS,
  CATEGORIA_LABEL,
  CATEGORIA_TABELA,
  type CategoriaForm,
} from "@/lib/types/tipos-documento";

/* ─────────────────────────────────────────
   DATA TYPE
───────────────────────────────────────── */

export type DocumentoFormData = {
  id?: number;
  categoria: CategoriaForm;
  titulo: string;
  tipo: string;
  tipoCustom?: string;
  numero: string;
  ano: number;
  descricao: string;
  orgao: string;
  data_publicacao: string;
  publicado: boolean;
  slug: string;
  arquivo_r2_url: string;
  arquivo_nome: string;
};

type Props = {
  initialData?: Partial<DocumentoFormData>;
  mode: "nova" | "editar";
  /** Se vier de /admin/publicacoes, já inicia nessa categoria */
  categoriaInicial?: CategoriaForm;
};

const MAX_PDF_MB = Number.MAX_SAFE_INTEGER;

type Toast = { type: "success" | "error"; msg: string };

function gerarSlug(tipo: string, numero: string, ano: number | string): string {
  const num = numero.replace(/\//g, "-") || "00";
  return slugify(`${tipo}-${num}-${ano}`, { lower: true, strict: true });
}

/* ─────────────────────────────────────────
   COMPONENTE
───────────────────────────────────────── */

export default function DocumentoForm({ initialData, mode, categoriaInicial }: Props) {
  const router = useRouter();
  const supabase = createBrowserClient();

  const emptyForm: DocumentoFormData = {
    categoria: categoriaInicial ?? "leis-normas",
    titulo: "",
    tipo: "Lei",
    tipoCustom: "",
    numero: "",
    ano: new Date().getFullYear(),
    descricao: "",
    orgao: "",
    data_publicacao: "",
    publicado: true,
    slug: "",
    arquivo_r2_url: "",
    arquivo_nome: "",
  };

  const [form, setForm] = useState<DocumentoFormData>(() => {
    // Se veio com dados iniciais, detectar categoria automaticamente
    if (initialData) {
      const detectCategoria = (initialData as any).categoria as CategoriaForm
        ?? initialData.categoria ?? categoriaInicial ?? detectarCategoria(initialData);
      return { ...emptyForm, ...initialData, categoria: detectCategoria };
    }
    return emptyForm;
  });

  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [pdfPreview, setPdfPreview] = useState(initialData?.arquivo_r2_url ?? "");
  const [openLgpdModal, setOpenLgpdModal] = useState(false);
  const [slugEditado, setSlugEditado] = useState(mode === "editar" && !!initialData?.slug);

  /* ── Detecta categoria com base nos dados iniciais ── */
  function detectarCategoria(data: Partial<DocumentoFormData>): CategoriaForm {
    if (data.categoria) return data.categoria;
    // Se tem slug, provavelmente é legislação
    if (data.slug) return "leis-normas";
    return "publicacoes-oficiais";
  }

  const tabelaDestino = CATEGORIA_TABELA[form.categoria];

  /* ── Tipos disponíveis conforme categoria ── */
  const tiposDisponiveis = 
    form.categoria === "leis-normas" ? TIPOS_LEGISLACAO : 
    form.categoria === "prestacao-contas" ? TIPOS_PRESTACAO_CONTAS : TIPOS_PUBLICACAO;

  const temTipoCustomValue = form.tipo === "__outro__";
  const tipoExibicao = temTipoCustomValue ? (form.tipoCustom ?? "") : form.tipo;

  /* ── Auto-slug ── */
  useEffect(() => {
    if (form.categoria === "leis-normas" && !slugEditado && form.tipo && form.numero && form.ano) {
      setForm(prev => ({ ...prev, slug: gerarSlug(tipoExibicao, form.numero, form.ano) }));
    }
  }, [form.tipo, form.numero, form.ano, slugEditado, form.categoria]);

  function showToast(type: Toast["type"], msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 5000);
  }

  function set(field: keyof DocumentoFormData, value: any) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  /* ── Upload PDF ── */
  async function handleFileSelect(f: File) {
    if (!f.name.toLowerCase().endsWith(".pdf")) {
      showToast("error", "Apenas arquivos PDF são aceitos.");
      return;
    }
    setFile(f);
  }

  async function uploadPDF(): Promise<string | null> {
    if (!file) return form.arquivo_r2_url || null;
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadUrl = tabelaDestino === "legislacoes"
        ? "/api/admin/legislacoes/upload"
        : "/api/admin/publicacoes/upload";

      // Adiciona tipo e ano para leg
      if (tabelaDestino === "legislacoes") {
        formData.append("tipo", form.tipo);
        formData.append("ano", String(form.ano));
      } else {
        formData.append("tipo", "publicacao");
      }

      const res = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
      });

      const json = await res.json();

      if (!res.ok || json.error) {
        throw new Error(json.error || "Erro desconhecido no upload");
      }

      setForm(prev => ({ ...prev, arquivo_r2_url: json.url, arquivo_nome: json.fileName }));
      setPdfPreview(json.url);
      setUploading(false);
      return json.url;
    } catch (err: any) {
      showToast("error", "Erro no upload para o R2: " + err.message);
      setUploading(false);
      return null;
    }
  }

  /* ── Slug único ── */
  async function gerarSlugUnico(slugBase: string, idToIgnore?: number) {
    let query = supabase
      .from("legislacoes")
      .select("id")
      .eq("slug", slugBase);

    if (idToIgnore) {
      query = query.neq("id", idToIgnore);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Erro verificando slug:", error);
      return `${slugBase}-${Date.now()}`;
    }
    if (!data || data.length === 0) return slugBase;

    return `${slugBase}-${Date.now()}`;
  }

  /* ── Submit ── */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    // Validar tipo customizado
    if (temTipoCustomValue && !form.tipoCustom?.trim()) {
      showToast("error", "Digite o tipo personalizado ou selecione um tipo da lista.");
      setSaving(false);
      return;
    }

    let finalUrl: string | null = form.arquivo_r2_url || null;
    if (file) {
      finalUrl = await uploadPDF();
      if (!finalUrl) { setSaving(false); return; }
    }

    // Slug apenas para legislações
    let slugFinal: string | undefined;
    if (form.categoria === "leis-normas") {
      const slugBase = form.slug || gerarSlug(tipoExibicao, form.numero, form.ano);
      slugFinal = await gerarSlugUnico(slugBase, initialData?.id);
    }

    // Construir payload conforme tabela
    const basePayload: Record<string, any> = {
      titulo: form.titulo.trim(),
      descricao: form.descricao.trim() || null,
      orgao: form.orgao.trim() || null,
      data_publicacao: form.data_publicacao || null,
      publicado: form.publicado,
      arquivo_r2_url: finalUrl || null,
      arquivo_nome: form.arquivo_nome || null,
      updated_at: new Date().toISOString(),
    };

    let payload: Record<string, any>;

    if (tabelaDestino === "legislacoes") {
      payload = {
        ...basePayload,
        tipo: tipoExibicao,
        numero: form.numero.trim() || null,
        ano: Number(form.ano),
        slug: slugFinal,
      };
    } else {
      payload = {
        titulo: form.titulo.trim(),
        descricao: form.descricao.trim() || null,
        data_publicacao: form.data_publicacao || null,
        arquivo_url: finalUrl || null,
        arquivo_nome: file?.name || null,
        tipo: tipoExibicao,
        categoria: ["PPA", "LDO", "LOA"].includes(tipoExibicao) ? "PLANEJAMENTO_ORCAMENTARIO" : null,
        exercicio: Number(form.ano),
      };
    }

    let dbError: any = null;

    if (mode === "nova") {
      const { error } = await supabase.from(tabelaDestino).insert([payload]);
      dbError = error;
    } else {
      const { error } = await supabase.from(tabelaDestino).update(payload).eq("id", initialData!.id!);
      dbError = error;
    }

    setSaving(false);

    if (dbError) {
      console.error("ERRO COMPLETO:", dbError);
      showToast("error", `Erro ao salvar: ${dbError.message}`);
      return;
    }

    showToast("success", mode === "nova" ? "Documento cadastrado!" : "Documento atualizado!");
    setTimeout(() => {
      router.push(tabelaDestino === "publicacoes" ? "/admin/publicacoes" : "/admin/legislacoes");
    }, 1200);
  }

  /* ── Render ── */
  return (
    <div className={`flex flex-col lg:flex-row gap-8 ${mode === "editar" && pdfPreview ? "max-w-[1600px]" : "max-w-4xl"} mx-auto`}>
      <div className="flex-1 space-y-6">
        {/* Toast */}
        {toast && (
          <div
            className="fixed top-4 right-4 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-sm font-semibold animate-in slide-in-from-top-2 duration-200"
            style={{
              backgroundColor: toast.type === "success" ? "#16a34a" : "#dc2626",
              color: "#ffffff"
            }}
          >
            {toast.type === "success" ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
            {toast.msg}
          </div>
        )}

        {/* Header */}
        <div className="flex items-center gap-3">
          <Link
            href={tabelaDestino === "publicacoes" ? "/admin/publicacoes" : "/admin/legislacoes"}
            className="p-2 hover:bg-gray-100 rounded-xl transition text-gray-700"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-black text-gray-900">
              {mode === "nova" ? "Novo Documento" : "Editar Documento"}
            </h1>
            <p className="text-sm text-gray-700">
              {mode === "nova" ? `Cadastrar ${CATEGORIA_LABEL[form.categoria].toLowerCase()}` : `ID ${initialData?.id}`}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ── Seção: Upload PDF ── */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest">Arquivo PDF</h2>

            {!file && !pdfPreview ? (
              <label className="group relative flex flex-col items-center justify-center gap-3 border-2 border-dashed border-gray-200 hover:border-[#0B3D91] rounded-2xl p-10 cursor-pointer transition-all hover:bg-blue-50/30">
                <input
                  type="file"
                  accept=".pdf"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
                />
                <div className="p-4 bg-gray-100 group-hover:bg-blue-100 rounded-2xl transition-colors">
                  <FileUp size={28} className="text-gray-600 group-hover:text-[#0B3D91] transition-colors" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-gray-700">Clique ou arraste o PDF aqui</p>
                  <p className="text-xs text-gray-600 mt-1">Sem limite de tamanho</p>
                </div>
              </label>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-100 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-600 rounded-xl">
                      <FileUp size={18} className="text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-blue-900 truncate max-w-xs">
                        {file ? file.name : form.arquivo_nome || "Arquivo vinculado"}
                      </p>
                      <p className="text-[10px] text-blue-500 font-bold uppercase tracking-widest">
                        {file ? `${(file.size / 1_000_000).toFixed(2)} MB · Pendente de upload` : "Arquivo salvo"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {pdfPreview && (
                      <>
                        <button
                          type="button"
                          onClick={() => setOpenLgpdModal(true)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 rounded-lg text-xs font-bold transition shadow-sm"
                          title="Auditar e tarjar dados sensíveis (LGPD)"
                        >
                          <ShieldAlert size={14} className="text-red-600 animate-pulse" />
                          Tarjar (LGPD)
                        </button>
                        <a
                          href={pdfPreview}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                          title="Abrir PDF"
                        >
                          <Eye size={16} />
                        </a>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => { setFile(null); setPdfPreview(""); set("arquivo_r2_url", ""); set("arquivo_nome", ""); }}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Remover arquivo"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}
            {openLgpdModal && pdfPreview && (
              <ModalTarjamentoInterativo
                pdfUrl={pdfPreview}
                onClose={() => setOpenLgpdModal(false)}
                onSuccess={(newUrl) => {
                  set("arquivo_r2_url", newUrl);
                  setPdfPreview(newUrl);
                  setOpenLgpdModal(false);
                }}
              />
            )}
          </div>

          {/* ── Seção: Dados do Documento ── */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5">
            <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest">Dados do Documento</h2>

            {/* Categoria */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Categoria <span className="text-red-600">*</span></label>
              <div className="flex gap-2">
                {(["leis-normas", "publicacoes-oficiais", "prestacao-contas"] as CategoriaForm[]).map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      set("categoria", cat);
                      // Reset tipo ao mudar de categoria
                      const defaultTipo = cat === "leis-normas" ? "Lei" : cat === "prestacao-contas" ? "RGF" : "Boletim";
                      set("tipo", defaultTipo);
                      set("tipoCustom", "");
                    }}
                    className={`flex-1 px-4 py-3 rounded-xl text-sm font-bold tracking-wide transition-all border-2 ${
                      form.categoria === cat
                        ? "bg-[#0B3D91] text-white border-[#0B3D91] shadow-md"
                        : "bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {CATEGORIA_LABEL[cat]}
                  </button>
                ))}
              </div>
            </div>

            {/* Título */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Título <span className="text-red-600">*</span></label>
              <input
                required
                type="text"
                value={form.titulo}
                onChange={e => set("titulo", e.target.value)}
                placeholder={form.categoria === "leis-normas"
                  ? "Ex: Dispõe sobre o Plano Plurianual do Município..."
                  : "Ex: Edital de Licitação nº 001/2026..."
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-[#0B3D91]/30 focus:border-[#0B3D91] transition text-sm text-gray-900"
              />
            </div>

            {/* Tipo + Número + Ano */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Tipo <span className="text-red-600">*</span></label>
                <select
                  required
                  value={temTipoCustomValue ? "__outro__" : form.tipo}
                  onChange={e => {
                    if (e.target.value === "__outro__") {
                      set("tipo", "__outro__");
                    } else {
                      set("tipo", e.target.value);
                      set("tipoCustom", "");
                    }
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-[#0B3D91]/30 focus:border-[#0B3D91] transition text-sm text-gray-900 bg-white cursor-pointer"
                >
                  {tiposDisponiveis.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                  <option value="__outro__">Outro...</option>
                </select>

                {/* Campo customizado para "Outro" */}
                {temTipoCustomValue && (
                  <input
                    type="text"
                    value={form.tipoCustom ?? ""}
                    onChange={e => set("tipoCustom", e.target.value)}
                    placeholder="Digite o tipo personalizado..."
                    className="mt-2 w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-[#0B3D91]/30 focus:border-[#0B3D91] transition text-sm text-gray-900"
                    required
                  />
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Número</label>
                <input
                  type="text"
                  value={form.numero}
                  onChange={e => set("numero", e.target.value)}
                  placeholder={form.categoria === "leis-normas" ? "Ex: 831" : "Opcional"}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-[#0B3D91]/30 focus:border-[#0B3D91] transition text-sm text-gray-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Ano <span className="text-red-600">*</span></label>
                <input
                  required
                  type="number"
                  value={form.ano}
                  min={1900}
                  max={2099}
                  onChange={e => set("ano", parseInt(e.target.value) || new Date().getFullYear())}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-[#0B3D91]/30 focus:border-[#0B3D91] transition text-sm text-gray-900"
                />
              </div>
            </div>

            {/* Órgão */}
            {tabelaDestino === "legislacoes" && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Órgão Emissor</label>
                <input
                  type="text"
                  value={form.orgao}
                  onChange={e => set("orgao", e.target.value)}
                  placeholder="Ex: Câmara Municipal de Padre Marcos"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-[#0B3D91]/30 focus:border-[#0B3D91] transition text-sm text-gray-900"
                />
              </div>
            )}

            {/* Slug (só para leis) */}
            {form.categoria === "leis-normas" && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                  Slug (URL)
                  {!slugEditado && (
                    <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-bold">Auto</span>
                  )}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.slug}
                    onChange={e => { set("slug", e.target.value); setSlugEditado(true); }}
                    placeholder="lei-831-2026"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-[#0B3D91]/30 focus:border-[#0B3D91] transition text-sm text-gray-900 font-mono"
                  />
                  {slugEditado && (
                    <button
                      type="button"
                      onClick={() => {
                        set("slug", gerarSlug(tipoExibicao, form.numero, form.ano));
                        setSlugEditado(false);
                      }}
                      className="p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition text-gray-700"
                      title="Regenerar slug"
                    >
                      <RefreshCw size={16} />
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-gray-600">Gerado automaticamente como: tipo-numero-ano</p>
              </div>
            )}

            {/* Descrição */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Descrição</label>
              <textarea
                rows={3}
                value={form.descricao}
                onChange={e => set("descricao", e.target.value)}
                placeholder="Resumo ou informações adicionais sobre o documento..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-[#0B3D91]/30 focus:border-[#0B3D91] transition text-sm text-gray-900 resize-none"
              />
            </div>

            {/* Data de Publicação */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Data de Publicação</label>
              <input
                type="date"
                value={form.data_publicacao}
                onChange={e => set("data_publicacao", e.target.value)}
                className="w-full sm:w-56 px-4 py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-[#0B3D91]/30 focus:border-[#0B3D91] transition text-sm text-gray-900"
              />
            </div>

            {/* Publicado */}
            {tabelaDestino === "legislacoes" && (
              <div className="border-t border-gray-100 pt-4">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={form.publicado}
                      onChange={e => set("publicado", e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-6 bg-gray-200 rounded-full peer-checked:bg-green-500 transition-colors duration-200" />
                    <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow peer-checked:translate-x-4 transition-transform duration-200" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 group-hover:text-gray-700 transition-colors">
                      {form.publicado ? "Publicado" : "Não Publicado"}
                    </p>
                    <p className="text-[11px] text-gray-600">
                      {form.publicado
                        ? "O documento aparece no portal público."
                        : "O documento fica visível apenas no admin."}
                    </p>
                  </div>
                </label>
              </div>
            )}
          </div>

          {/* ── Ações ── */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pb-6">
            <Link
              href={tabelaDestino === "publicacoes" ? "/admin/publicacoes" : "/admin/legislacoes"}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
            >
              <ArrowLeft size={16} />
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={saving || uploading || (temTipoCustomValue && !form.tipoCustom?.trim())}
              className="w-full sm:flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[#0B3D91] text-white rounded-xl text-sm font-black hover:bg-[#0a3280] transition shadow-md shadow-blue-900/20 disabled:opacity-50"
            >
              {saving || uploading ? (
                <><Loader2 size={18} className="animate-spin" /> {uploading ? "Enviando PDF..." : "Salvando..."}</>
              ) : (
                <><Save size={18} /> {mode === "nova" ? "Cadastrar Documento" : "Salvar Alterações"}</>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* ── Painel Direito: Visualizador de PDF ── */}
      {mode === "editar" && pdfPreview && (
        <div className="hidden lg:flex w-[600px] xl:w-[800px] h-[calc(100vh-6rem)] sticky top-6 rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 shadow-inner flex-col">
          <div className="bg-gray-100 border-b border-gray-200 px-4 py-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <FileText size={16} />
              Visualização do Documento
            </h3>
            <a href={pdfPreview} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline font-medium flex items-center gap-1">
              <ExternalLink size={12} />
              Abrir em nova guia
            </a>
          </div>
          <iframe
            src={pdfPreview}
            className="w-full h-full border-none flex-1"
            title="Visualizador de PDF"
          />
        </div>
      )}
    </div>
  );
}
