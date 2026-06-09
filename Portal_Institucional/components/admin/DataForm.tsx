"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createBrowserClient } from "@/lib/supabase/client";
import {
  Save, ArrowLeft, Loader2, CheckCircle2, XCircle,
  FileUp, X, Eye,
} from "lucide-react";
import { getTableConfig } from "@/lib/admin/transparencia-tables";
import BatchDocumentManager from "./BatchDocumentManager";

const MAX_PDF_MB = 25;

type Toast = { type: "success" | "error"; msg: string };

type Props = {
  slug: string;
  mode: "nova" | "editar";
  initialData?: any;
};

/** Tables that support PDF file upload */
function hasFileUpload(slug: string): boolean {
  return ["contratos", "licitacoes", "obras", "diarias", "servidores", "emendas", "transferencias"].includes(slug);
}

export default function DataForm({ slug: slugProp, mode, initialData }: Props) {
  const _c = getTableConfig(slugProp);
  if (!_c) {
    return <div className="text-center py-12 text-red-600 font-bold">Configuração não encontrada para "{slugProp}"</div>;
  }
  const config = _c;

  const router = useRouter();
  const supabase = createBrowserClient();

  const supportsUpload = hasFileUpload(config.slug);
  const isV2Upload = config.table.endsWith("_v2");

  const emptyForm: Record<string, any> = {};
  config.formFields.forEach((field) => {
    emptyForm[field.key] = field.type === "number" ? 0 : "";
  });
  emptyForm.ano = new Date().getFullYear();

  const [form, setForm] = useState<Record<string, any>>(() => {
    if (initialData) {
      const data: Record<string, any> = {};
      config.formFields.forEach((field) => {
        data[field.key] = initialData[field.key] ?? (field.type === "number" ? 0 : "");
      });
      // Garantir campos do PDF também na edição
      data.arquivo_r2_url = initialData?.arquivo_r2_url || "";
      data.arquivo_nome = initialData?.arquivo_nome || "";
      return data;
    }
    return emptyForm;
  });

  const [file, setFile] = useState<File | null>(null);
  const [pendingBatchFiles, setPendingBatchFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  function showToast(type: Toast["type"], msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 5000);
  }

  function set(field: string, value: any) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  /* ── Upload PDF ── */
  async function handleFileSelect(f: File) {
    if (!f.name.toLowerCase().endsWith(".pdf")) {
      showToast("error", "Apenas arquivos PDF são aceitos.");
      return;
    }
    if (f.size > MAX_PDF_MB * 1_000_000) {
      showToast("error", `O arquivo excede ${MAX_PDF_MB} MB.`);
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
      formData.append("tabela", config.slug);
      formData.append("ano", String(form.ano || new Date().getFullYear()));

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();

      if (!res.ok || json.error) {
        throw new Error(json.error || "Erro desconhecido no upload");
      }

      setForm((prev) => ({ ...prev, arquivo_r2_url: json.url, arquivo_nome: json.fileName }));
      setUploading(false);
      return json.url;
    } catch (err: any) {
      showToast("error", "Erro no upload: " + err.message);
      setUploading(false);
      return null;
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    // Upload PDF first if there's a file pending
    if (supportsUpload && file) {
      const url = await uploadPDF();
      if (!url) { setSaving(false); return; }
    }

    // Build payload - clean empty strings for number fields
    const payload: Record<string, any> = {};
    config.formFields.forEach((field) => {
      let val = form[field.key];
      if (field.type === "number") {
        val = val === "" || val === null || val === undefined ? null : Number(val);
      } else if (val === "") {
        val = null;
      }
      payload[field.key] = val;
    });

    // Incluir campos de PDF APENAS se houver valor (evita erro em tabelas sem essas colunas)
    if (supportsUpload && form.arquivo_r2_url) {
      payload.arquivo_r2_url = form.arquivo_r2_url;
      if (form.arquivo_nome) payload.arquivo_nome = form.arquivo_nome;
    }

    let dbError: any = null;
    let newRecordId: string | null = null;

    if (mode === "nova") {
      const { data, error } = await supabase
        .schema(config.schema)
        .from(config.table)
        .insert([payload])
        .select()
        .single();
      dbError = error;
      if (data) newRecordId = data.id;
    } else {
      const { error } = await supabase
        .schema(config.schema)
        .from(config.table)
        .update(payload)
        .eq("id", initialData!.id);
      dbError = error;
    }

    if (dbError) {
      setSaving(false);
      console.error("ERRO:", dbError);
      showToast("error", `Erro ao salvar: ${dbError.message}`);
      return;
    }

    // Processar batch files no modo nova
    if (mode === "nova" && isV2Upload && pendingBatchFiles.length > 0 && newRecordId) {
      const docTable = config.table === "licitacoes_v2" ? "licitacoes_documentos" : "contratos_documentos";
      const fkColumn = config.table === "licitacoes_v2" ? "licitacao_id" : "contrato_id";
      
      for (const f of pendingBatchFiles) {
        const formData = new FormData();
        formData.append("file", f);
        formData.append("tabela", config.table);
        formData.append("ano", String(form.ano || new Date().getFullYear()));

        try {
          const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
          if (res.ok) {
            const json = await res.json();
            await supabase.schema("transparencia").from(docTable).insert([{
              [fkColumn]: newRecordId,
              tipo_documento: "Anexo",
              nome_arquivo: f.name,
              url_arquivo: json.url,
              caminho_r2: json.url.split('/').slice(3).join('/'),
              tamanho: f.size,
            }]);
          }
        } catch (err) {
          console.error("Erro ao subir", f.name, err);
        }
      }
    }

    setSaving(false);
    showToast("success", mode === "nova" ? "Registro cadastrado!" : "Registro atualizado!");
    setTimeout(() => {
      router.push(`/admin/${config.slug}`);
    }, 1200);
  }

  const pdfPreview = form.arquivo_r2_url as string | undefined;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className="fixed top-4 right-4 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-sm font-semibold animate-in slide-in-from-top-2 duration-200"
          style={{
            backgroundColor: toast.type === "success" ? "#16a34a" : "#dc2626",
            color: "#ffffff",
          }}
        >
          {toast.type === "success" ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href={`/admin/${config.slug}`}
          className="p-2 hover:bg-gray-100 rounded-xl transition text-gray-700"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl font-black text-gray-900">
            {mode === "nova" ? `Novo Registro` : `Editar Registro`}
          </h1>
          <p className="text-sm text-gray-700">
            {config.label} · {mode === "nova" ? "Novo cadastro" : `ID ${initialData?.id}`}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">


        {/* ── Seção: Dados do Registro ── */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5">
          <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest">
            Dados do Registro
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {config.formFields.map((field) => {
              // Skip hidden file fields
              if (field.key === "arquivo_r2_url" || field.key === "arquivo_nome") return null;

              if (field.fullWidth) {
                return (
                  <div key={field.key} className="sm:col-span-2 space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                      {field.label}
                      {field.required && <span className="text-red-600"> *</span>}
                    </label>
                    {field.type === "textarea" ? (
                      <textarea
                        rows={3}
                        value={form[field.key] ?? ""}
                        onChange={(e) => set(field.key, e.target.value)}
                        placeholder={field.placeholder || ""}
                        required={field.required}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-[#0B3D91]/30 focus:border-[#0B3D91] transition text-sm text-gray-900 resize-none"
                      />
                    ) : (
                      <input
                        type={field.type === "number" ? "number" : "text"}
                        value={form[field.key] ?? ""}
                        onChange={(e) => set(field.key, field.type === "number" ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value)}
                        placeholder={field.placeholder || ""}
                        required={field.required}
                        step={field.type === "number" ? "0.01" : undefined}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-[#0B3D91]/30 focus:border-[#0B3D91] transition text-sm text-gray-900"
                      />
                    )}
                  </div>
                );
              }

              if (field.type === "date") {
                return (
                  <div key={field.key} className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                      {field.label}
                      {field.required && <span className="text-red-600"> *</span>}
                    </label>
                    <input
                      type="date"
                      value={form[field.key] ?? ""}
                      onChange={(e) => set(field.key, e.target.value)}
                      required={field.required}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-[#0B3D91]/30 focus:border-[#0B3D91] transition text-sm text-gray-900"
                    />
                  </div>
                );
              }

              if (field.type === "select" && field.options) {
                return (
                  <div key={field.key} className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                      {field.label}
                      {field.required && <span className="text-red-600"> *</span>}
                    </label>
                    <select
                      value={form[field.key] ?? ""}
                      onChange={(e) => set(field.key, e.target.value)}
                      required={field.required}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-[#0B3D91]/30 focus:border-[#0B3D91] transition text-sm text-gray-900 bg-white"
                    >
                      <option value="">Selecione...</option>
                      {field.options.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                );
              }

              // Default: text / number input
              return (
                <div key={field.key} className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    {field.label}
                    {field.required && <span className="text-red-600"> *</span>}
                  </label>
                  <input
                    type={field.type === "number" ? "number" : "text"}
                    value={form[field.key] ?? ""}
                    onChange={(e) => set(field.key, field.type === "number" ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value)}
                    placeholder={field.placeholder || ""}
                    required={field.required}
                    step={field.type === "number" ? "0.01" : undefined}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-[#0B3D91]/30 focus:border-[#0B3D91] transition text-sm text-gray-900"
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Seção: Upload PDF (apenas para tabelas com suporte) ── */}
        {supportsUpload && (
          isV2Upload && mode === "editar" ? (
            <BatchDocumentManager
              tabela={config.table}
              parentId={initialData?.id}
              ano={form.ano || new Date().getFullYear()}
            />
          ) : isV2Upload && mode === "nova" ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
              <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center justify-between">
                Documentos em Lote
                {pendingBatchFiles.length > 0 && <span className="bg-blue-100 text-blue-800 py-0.5 px-2 rounded-lg text-xs">{pendingBatchFiles.length} selecionados</span>}
              </h2>
              
              <label className="relative flex flex-col items-center justify-center gap-3 border-2 border-dashed border-blue-200 hover:border-[#0B3D91] rounded-2xl p-8 cursor-pointer transition-all hover:bg-blue-50/30">
                <input
                  type="file"
                  multiple
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) {
                      const newFiles = Array.from(e.target.files).filter(f => f.name.toLowerCase().endsWith(".pdf") && f.size <= MAX_PDF_MB * 1_000_000);
                      setPendingBatchFiles(prev => [...prev, ...newFiles]);
                    }
                  }}
                />
                <div className="p-4 bg-gray-100 rounded-2xl transition-colors">
                  <FileUp size={28} className="text-gray-600 transition-colors" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-gray-700">Clique ou arraste múltiplos PDFs aqui</p>
                  <p className="text-xs text-gray-600 mt-1">Os arquivos serão enviados ao clicar em Salvar Registro.</p>
                </div>
              </label>

              {pendingBatchFiles.length > 0 && (
                <div className="space-y-2 mt-4">
                  {pendingBatchFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-xl">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="p-2 bg-blue-100 rounded-xl shrink-0">
                          <FileUp size={16} className="text-blue-700" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-gray-900 truncate" title={file.name}>{file.name}</p>
                          <p className="text-[10px] text-gray-500 font-bold uppercase">Pendente de envio</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPendingBatchFiles(prev => prev.filter((_, i) => i !== idx))}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Remover arquivo"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
              <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest">Arquivo PDF</h2>

              {!file && !pdfPreview ? (
                <label className="group relative flex flex-col items-center justify-center gap-3 border-2 border-dashed border-gray-200 hover:border-[#0B3D91] rounded-2xl p-10 cursor-pointer transition-all hover:bg-blue-50/30">
                  <input
                    type="file"
                    accept=".pdf"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
                  />
                  <div className="p-4 bg-gray-100 group-hover:bg-blue-100 rounded-2xl transition-colors">
                    <FileUp size={28} className="text-gray-600 group-hover:text-[#0B3D91] transition-colors" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-gray-700">Clique ou arraste o PDF aqui</p>
                    <p className="text-xs text-gray-600 mt-1">Máximo {MAX_PDF_MB} MB</p>
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
                        <a
                          href={pdfPreview}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                          title="Abrir PDF"
                        >
                          <Eye size={16} />
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => { setFile(null); set("arquivo_r2_url", ""); set("arquivo_nome", ""); }}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Remover arquivo"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        )}

        {/* Ações */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pb-6">
          <Link
            href={`/admin/${config.slug}`}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
          >
            <ArrowLeft size={16} />
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={saving || uploading}
            className="w-full sm:flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[#0B3D91] text-white rounded-xl text-sm font-black hover:bg-[#0a3280] transition shadow-md shadow-blue-900/20 disabled:opacity-50"
          >
            {saving || uploading ? (
              <><Loader2 size={18} className="animate-spin" /> {uploading ? "Enviando PDF..." : "Salvando..."}</>
            ) : (
              <><Save size={18} /> {mode === "nova" ? "Cadastrar" : "Salvar Alterações"}</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
