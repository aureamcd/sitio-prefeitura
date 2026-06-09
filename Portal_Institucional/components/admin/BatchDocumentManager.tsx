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
};

const MAX_PDF_MB = 50;

export default function BatchDocumentManager({ tabela, parentId, ano }: BatchDocumentManagerProps) {
  const [docs, setDocs] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
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
      alert(`Atenção: Apenas arquivos PDF menores que ${MAX_PDF_MB}MB são suportados. Alguns arquivos foram ignorados.`);
    }

    if (validFiles.length === 0) return;

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
        if (!res.ok) throw new Error("Falha no upload");
        const json = await res.json();

        // Save to DB
        await supabase.schema("transparencia").from(docTable).insert([{
          [fkColumn]: parentId,
          tipo_documento: "Anexo", // Padrão
          nome_arquivo: file.name,
          url_arquivo: json.url,
          caminho_r2: json.url.split('/').slice(3).join('/'),
          tamanho: file.size,
        }]);

      } catch (err) {
        console.error("Erro ao subir", file.name, err);
      }
    }

    setUploading(false);
    fetchDocs();
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja apagar este anexo?")) return;
    
    // Deleta do DB (não do R2 para simplificar/segurança)
    await supabase.schema("transparencia").from(docTable).delete().eq("id", id);
    setDocs(prev => prev.filter(d => d.id !== id));
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

      {/* Docs List */}
      {loading ? (
        <div className="flex justify-center p-4"><Loader2 className="animate-spin text-gray-400" /></div>
      ) : docs.length > 0 && (
        <div className="space-y-2 mt-4">
          {docs.map(doc => (
            <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-xl">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="p-2 bg-blue-100 rounded-xl shrink-0">
                  <FileUp size={16} className="text-blue-700" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate" title={doc.nome_arquivo}>{doc.nome_arquivo}</p>
                  <p className="text-[10px] text-gray-500 font-bold uppercase">{doc.tipo_documento}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <a href={doc.url_arquivo} target="_blank" rel="noopener noreferrer" className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition" title="Ver Arquivo">
                  <ExternalLink size={16} />
                </a>
                <button type="button" onClick={() => handleDelete(doc.id)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Apagar">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
