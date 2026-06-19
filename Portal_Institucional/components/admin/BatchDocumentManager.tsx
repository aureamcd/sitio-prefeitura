"use client";

import { useState, useEffect, useCallback } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import { Loader2, FileUp, X, CheckCircle2, Eye, ExternalLink, Trash2 } from "lucide-react";

type BatchDocumentManagerProps = {
  tabela: string; // "licitacoes_v2" or "contratos_v2"
  parentId: string; // The ID of the licitacao or contrato
  ano: number;
};

type Documento = {
  id: string;
  nome_arquivo: string;
  url_arquivo: string;
  tipo_documento: string;
  caminho_r2?: string;
};

const MAX_PDF_MB = 50;

export default function BatchDocumentManager({ tabela, parentId, ano }: BatchDocumentManagerProps) {
  const [docs, setDocs] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ nome_arquivo: "", tipo_documento: "" });
  const [savingEdit, setSavingEdit] = useState(false);

  const supabase = createBrowserClient();

  const docTable = tabela === "licitacoes_v2" ? "licitacoes_documentos" : "contratos_documentos";
  const fkColumn = tabela === "licitacoes_v2" ? "licitacao_id" : "contrato_id";

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .schema("transparencia")
      .from(docTable)
      .select("*")
      .eq(fkColumn, parentId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setDocs(data);
    }
    setLoading(false);
  }, [docTable, fkColumn, parentId, supabase]);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);

    const validFiles = files.filter(f => f.name.toLowerCase().endsWith(".pdf") && f.size <= MAX_PDF_MB * 1_000_000);
    if (validFiles.length < files.length) {
      alert(`Atenção: Apenas arquivos .PDF de até ${MAX_PDF_MB}MB são permitidos.\nAlguns arquivos foram ignorados.`);
    }

    if (validFiles.length === 0) return;

    let hasError = false;
    let errorMessage = "";

    setUploading(true);
    setUploadProgress({ current: 0, total: validFiles.length });

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      setUploadProgress({ current: i + 1, total: validFiles.length });

      const formData = new FormData();
      formData.append("file", file);
      formData.append("tabela", tabela);
      formData.append("ano", String(ano));

      try {
        const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Servidor: ${text}`);
        }
        const json = await res.json();

        // Save to DB
        const { error: dbErr } = await supabase.schema("transparencia").from(docTable).insert([{
          [fkColumn]: parentId,
          tipo_documento: "Anexo", // Padrão
          nome_arquivo: file.name,
          url_arquivo: json.url,
          caminho_r2: json.url.split('/').slice(3).join('/'),
          tamanho: file.size,
        }]);

        if (dbErr) throw new Error(`Banco: ${dbErr.message}`);

      } catch (err: any) {
        hasError = true;
        errorMessage += `${file.name}: ${err.message}\n`;
        console.error("Erro ao subir", file.name, err);
      }
    }

    setUploading(false);
    if (hasError) {
      alert("Houve erros no upload de alguns arquivos:\n\n" + errorMessage);
    }
    fetchDocs();
  }

  async function handleDelete(doc: Documento) {
    if (!confirm("Tem certeza que deseja apagar este anexo? Ele será excluído do banco e da nuvem.")) return;
    
    // 1. Tenta apagar do Supabase
    const { error } = await supabase
      .schema("transparencia")
      .from(docTable)
      .delete()
      .eq("id", doc.id);

    if (error) {
      alert("Erro ao excluir do banco: " + error.message);
      return;
    }

    // 2. Tenta apagar do R2 se houver caminho
    if (doc.caminho_r2) {
      try {
        await fetch("/api/admin/delete-file", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ caminho_r2: doc.caminho_r2 }),
        });
      } catch (e) {
        console.error("Erro ao excluir do R2", e);
      }
    }

    // 3. Atualiza UI
    setDocs(prev => prev.filter(d => d.id !== doc.id));
  }

  function startEdit(doc: Documento) {
    setEditingId(doc.id);
    setEditForm({ nome_arquivo: doc.nome_arquivo, tipo_documento: doc.tipo_documento });
  }

  async function saveEdit(id: string) {
    if (!editForm.nome_arquivo.trim() || !editForm.tipo_documento.trim()) {
      alert("Nome e tipo são obrigatórios.");
      return;
    }
    setSavingEdit(true);
    const { error } = await supabase
      .schema("transparencia")
      .from(docTable)
      .update({
        nome_arquivo: editForm.nome_arquivo,
        tipo_documento: editForm.tipo_documento,
      })
      .eq("id", id);
      
    setSavingEdit(false);
    if (error) {
      alert("Erro ao salvar: " + error.message);
      return;
    }
    setEditingId(null);
    setDocs(prev => prev.map(d => d.id === id ? { ...d, ...editForm } : d));
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
      <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center justify-between">
        Documentos em Lote
        <span className="bg-gray-100 text-gray-700 py-0.5 px-2 rounded-lg text-xs">{docs.length} anexos</span>
      </h2>

      {/* Upload Zone */}
      <label className={`relative flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-2xl p-8 cursor-pointer transition-all ${uploading ? "border-gray-200 bg-gray-50 opacity-50 pointer-events-none" : "border-blue-200 hover:border-[#0B3D91] hover:bg-blue-50/30"}`}>
        <input type="file" multiple accept=".pdf" className="hidden" onChange={handleFiles} disabled={uploading} />
        <div className="p-4 bg-gray-100 rounded-2xl transition-colors">
          {uploading ? <Loader2 size={28} className="text-gray-400 animate-spin" /> : <FileUp size={28} className="text-gray-600 transition-colors" />}
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-gray-700">
            {uploading ? `Enviando ${uploadProgress.current} de ${uploadProgress.total}...` : "Clique ou arraste múltiplos PDFs aqui"}
          </p>
          <p className="text-xs text-gray-600 mt-1">O upload é feito imediatamente após a seleção.</p>
        </div>
      </label>

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
                {docs.map(doc => (
                  <tr key={doc.id} className="hover:bg-gray-50/50 transition-colors">
                    {editingId === doc.id ? (
                      <td colSpan={3} className="px-4 py-3">
                        <div className="flex flex-col sm:flex-row gap-3 w-full">
                          <input
                            type="text"
                            value={editForm.nome_arquivo}
                            onChange={e => setEditForm({ ...editForm, nome_arquivo: e.target.value })}
                            className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Nome do Arquivo"
                          />
                          <input
                            type="text"
                            value={editForm.tipo_documento}
                            onChange={e => setEditForm({ ...editForm, tipo_documento: e.target.value })}
                            className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Tipo (ex: Edital, Anexo, Contrato)"
                          />
                          <div className="flex justify-end gap-2 shrink-0">
                            <button onClick={() => setEditingId(null)} className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300 transition">Cancelar</button>
                            <button onClick={() => saveEdit(doc.id)} disabled={savingEdit} className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition flex items-center gap-1">
                              {savingEdit ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} Salvar
                            </button>
                          </div>
                        </div>
                      </td>
                    ) : (
                      <>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-xl shrink-0">
                              <FileUp size={16} className="text-blue-700" />
                            </div>
                            <p className="text-sm font-bold text-gray-900 truncate max-w-xs" title={doc.nome_arquivo}>{doc.nome_arquivo}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs text-gray-600 font-bold uppercase">{doc.tipo_documento}</p>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button type="button" onClick={() => startEdit(doc)} className="p-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Editar">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                            </button>
                            <a href={doc.url_arquivo} target="_blank" rel="noopener noreferrer" className="p-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Ver Arquivo">
                              <ExternalLink size={16} />
                            </a>
                            <button type="button" onClick={() => handleDelete(doc)} className="p-2 text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Apagar">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
    </div>
  );
}
