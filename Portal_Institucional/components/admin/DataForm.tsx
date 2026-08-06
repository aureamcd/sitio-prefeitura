"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createBrowserClient } from "@/lib/supabase/client";
import {
  Save, ArrowLeft, Loader2, CheckCircle2, XCircle,
  FileUp, X, Eye, ShieldAlert
} from "lucide-react";
import { getTableConfig } from "@/lib/admin/transparencia-tables";
import BatchDocumentManager from "./BatchDocumentManager";
import PdfRedactionEditor from "./PdfRedactionEditor";



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
      data.arquivo_r2_url = initialData?.arquivo_r2_url || initialData?.pdf_url || initialData?.url_arquivo || "";
      data.arquivo_nome = initialData?.arquivo_nome || "";
      return data;
    }
    return emptyForm;
  });

  const [file, setFile] = useState<File | null>(null);
  const [pendingBatchFiles, setPendingBatchFiles] = useState<{ file: File; name: string; type: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [showRedactor, setShowRedactor] = useState(false);

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

    setFile(f);
  }

  async function uploadPDF(): Promise<string | null> {
    if (!file) return form.arquivo_r2_url || null;
    setUploading(true);

    try {
      const resPresigned = await fetch("/api/admin/presigned-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type || "application/pdf",
          tabela: config.slug,
          ano: String(form.ano || new Date().getFullYear())
        })
      });

      if (!resPresigned.ok) {
        const text = await resPresigned.text();
        throw new Error(text);
      }
      
      const json = await resPresigned.json();

      const resUpload = await fetch(json.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/pdf" },
        body: file
      });

      if (!resUpload.ok) throw new Error("Erro no upload R2 direto");

      setForm((prev) => ({ ...prev, arquivo_r2_url: json.publicUrl, arquivo_nome: json.fileName }));
      setUploading(false);
      return json.publicUrl;
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
      
      // Previne erros de limite de string (varchar) no banco
      if (typeof val === "string") {
        if (field.key === "empresa") val = val.substring(0, 10);
        if (field.key === "carona") val = val.substring(0, 10);
        if (field.key === "registro_preco") val = val.substring(0, 5);
      }

      payload[field.key] = val;
    });

    // Incluir campos de PDF APENAS se houver valor (evita erro em tabelas sem essas colunas)
    if (supportsUpload && form.arquivo_r2_url) {
      payload.arquivo_r2_url = form.arquivo_r2_url;
      if (form.arquivo_nome) payload.arquivo_nome = form.arquivo_nome;
      if (config.slug === "emendas" || config.table === "cadastro_emendas") {
        payload.pdf_url = form.arquivo_r2_url;
      }
    }

    // ── Verificação de duplicata (apenas licitações) ──
    if (mode === "nova" && config.slug === "licitacoes") {
      const numero = payload.numero;
      const ano = payload.ano;
      if (numero && ano) {
        try {
          const { data: existente, error: dupError } = await supabase
            .schema(config.schema)
            .from(config.table)
            .select('id')
            .eq('numero', numero)
            .eq('ano', ano)
            .maybeSingle();

          if (dupError) {
            console.warn("Erro ao verificar duplicata:", dupError);
          } else if (existente) {
            setSaving(false);
            showToast("error", `Já existe uma licitação com o número "${numero}" e ano "${ano}". Edite o registro existente.`);
            return;
          }
        } catch (dupErr: any) {
          console.warn("Falha na verificação de duplicata:", dupErr);
          // Continua mesmo se falhar a verificação
        }
      }
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
      console.error("❌ ERRO AO SALVAR:", JSON.stringify(dbError, null, 2));
      // Mostra o erro completo pro admin
      const detalhe = dbError.code ? `[${dbError.code}] ` : '';
      showToast("error", `${detalhe}${dbError.message}`);
      return;
    }

    // Processar batch files no modo nova
    if (mode === "nova" && isV2Upload && pendingBatchFiles.length > 0 && newRecordId) {
      const docTable = config.table === "licitacoes_v2" ? "licitacoes_documentos" : "contratos_documentos";
      const fkColumn = config.table === "licitacoes_v2" ? "licitacao_id" : "contrato_id";
      let hasUploadError = false;
      let errorMessages: string[] = [];

      for (const item of pendingBatchFiles) {
        try {
          const resPresigned = await fetch("/api/admin/presigned-url", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fileName: item.file.name,
              fileType: item.file.type || "application/pdf",
              tabela: config.table,
              ano: String(form.ano || new Date().getFullYear())
            })
          });

          if (resPresigned.ok) {
            const json = await resPresigned.json();
            
            const resUpload = await fetch(json.uploadUrl, {
              method: "PUT",
              headers: { "Content-Type": item.file.type || "application/pdf" },
              body: item.file
            });

            if (!resUpload.ok) {
               throw new Error("Falha no upload direto para a nuvem");
            }

            const { error: dbErr } = await supabase.schema("transparencia").from(docTable).insert([{
              [fkColumn]: newRecordId,
              tipo_documento: item.type || "Anexo",
              nome_arquivo: item.name || item.file.name,
              url_arquivo: json.publicUrl,
              caminho_r2: json.caminho_r2,
              tamanho: item.file.size,
            }]);
            
            if (dbErr) {
              hasUploadError = true;
              errorMessages.push(`Banco (${item.name}): ${dbErr.message}`);
            }
          } else {
            hasUploadError = true;
            const errText = await resPresigned.text();
            errorMessages.push(`Servidor (${item.name}): ${errText}`);
          }
        } catch (err: any) {
          hasUploadError = true;
          errorMessages.push(`Rede (${item.name}): ${err.message}`);
        }
      }

      setSaving(false);
      if (hasUploadError) {
        alert("Registro salvo, mas houve erro ao enviar alguns arquivos:\n\n" + errorMessages.join("\n"));
        showToast("error", "Registro salvo com falhas nos anexos!");
      } else {
        showToast("success", "Registro e anexos salvos com sucesso!");
      }
      setTimeout(() => {
        router.push(`/admin/${config.slug}`);
      }, 2000);
      return;
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
      {showRedactor && (
        <PdfRedactionEditor
          fileUrl={file ? undefined : form.arquivo_r2_url}
          fileObj={file || undefined}
          onSave={(redactedFile) => {
            setFile(redactedFile);
            setShowRedactor(false);
            showToast("success", "Tarjas aplicadas com sucesso! Salve o formulário para efetivar.");
          }}
          onCancel={() => setShowRedactor(false)}
        />
      )}

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
                      const allFiles = Array.from(e.target.files);
                      const validFiles = allFiles.filter(f => f.name.toLowerCase().endsWith(".pdf"));
                      
                      if (validFiles.length < allFiles.length) {
                        alert(`Atenção: Apenas arquivos .PDF são permitidos.\nAlguns arquivos foram ignorados.`);
                      }

                      const newFiles = validFiles.map(f => ({ file: f, name: f.name.replace(/\.[^/.]+$/, ""), type: "Anexo" }));
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
                <div className="mt-4 bg-white border border-gray-200 rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50">
                          <th className="text-left px-4 py-3 text-xs font-bold text-gray-700 uppercase tracking-wider">Nome do Arquivo</th>
                          <th className="text-left px-4 py-3 text-xs font-bold text-gray-700 uppercase tracking-wider">Tipo</th>
                          <th className="text-right px-4 py-3 text-xs font-bold text-gray-700 uppercase tracking-wider">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {pendingBatchFiles.map((item, idx) => (
                          <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-4 py-3">
                              <input
                                type="text"
                                value={item.name}
                                onChange={e => {
                                  const newFiles = [...pendingBatchFiles];
                                  newFiles[idx].name = e.target.value;
                                  setPendingBatchFiles(newFiles);
                                }}
                                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Nome do Arquivo"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="text"
                                value={item.type}
                                onChange={e => {
                                  const newFiles = [...pendingBatchFiles];
                                  newFiles[idx].type = e.target.value;
                                  setPendingBatchFiles(newFiles);
                                }}
                                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Tipo (ex: Edital, Anexo)"
                              />
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                type="button"
                                onClick={() => setPendingBatchFiles(prev => prev.filter((_, i) => i !== idx))}
                                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition inline-flex items-center justify-center"
                                title="Remover arquivo"
                              >
                                <X size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
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
                      {(file || form.arquivo_r2_url) && (
                        <button
                          type="button"
                          onClick={() => setShowRedactor(true)}
                          className="p-2 text-black hover:bg-gray-200 rounded-lg transition"
                          title="Aplicar Tarja (Ocultar Dados Sensíveis)"
                        >
                          <ShieldAlert size={16} />
                        </button>
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

      {showRedactor && (
        <PdfRedactionEditor
          fileObj={file || undefined}
          fileUrl={!file && form.arquivo_r2_url ? form.arquivo_r2_url : undefined}
          onSave={(redactedFile) => {
            setFile(redactedFile);
            showToast("success", "Tarjas aplicadas com sucesso! O novo PDF foi anexado para salvamento.");
            setShowRedactor(false);
          }}
          onCancel={() => setShowRedactor(false)}
        />
      )}
    </div>
  );
}
