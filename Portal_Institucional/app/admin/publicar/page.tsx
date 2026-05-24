"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  FilePlus,
  Send,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileUp,
  X
} from "lucide-react";
import Link from "next/link";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AdminPublicarPage() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [file, setFile] = useState<File | null>(null);

  // Função para limpar caracteres especiais do nome do arquivo
  function sanitizeFileName(name: string) {
    return name
      .toLowerCase()
      .replace(/[^\w.-]/g, "_")
      .replace(/_{2,}/g, "_");
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!file) {
      setStatus({ type: "error", message: "Por favor, selecione um arquivo PDF." });
      return;
    }

    setLoading(true);
    setStatus(null);

    const formData = new FormData(e.currentTarget);

    try {
      // 1. Fazer Upload para o Storage (Bucket: documentos)
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}_${sanitizeFileName(file.name.replace(`.${fileExt}`, ""))}.${fileExt}`;
      const filePath = `${formData.get("categoria")}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("documentos")
        .upload(filePath, file);

      if (uploadError) throw new Error(`Erro no upload: ${uploadError.message}`);

      // 2. Pegar a URL pública do arquivo
      const { data: { publicUrl } } = supabase.storage
        .from("documentos")
        .getPublicUrl(filePath);

      // 3. Salvar no Banco de Dados (documentos_oficiais)
      const docData = {
        titulo: formData.get("titulo"),
        tipo: formData.get("tipo"),
        categoria: formData.get("categoria"),
        ano: Number(formData.get("ano")),
        arquivo: publicUrl,
        descricao: formData.get("descricao"),
        data: formData.get("data"),
      };

      const { error: dbError } = await supabase.from("documentos").insert([docData]);

      if (dbError) throw dbError;

      setStatus({ type: "success", message: "Documento e arquivo publicados com sucesso!" });
      setFile(null);
      (e.target as HTMLFormElement).reset();
    } catch (err: any) {
      console.error(err);
      setStatus({
        type: "error",
        message: err.message || "Erro ao processar publicação."
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header Admin */}
      <header className="bg-[#173572] text-white py-6 shadow-lg">
        <div className="max-w-4xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="p-2 hover:bg-white/10 rounded-lg transition">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-xl font-bold tracking-tight">Painel de Publicação</h1>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-bold uppercase tracking-widest">
            Acesso Administrativo
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto p-6 md:p-10">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-8 border-b border-gray-50 flex items-center gap-4">
            <div className="bg-blue-50 text-blue-600 p-3 rounded-2xl">
              <FilePlus size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900 leading-tight">Publicar Novo Documento</h2>
              <p className="text-gray-500 text-sm font-medium">Upload direto para o Bucket do Supabase</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {/* Título */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Título do Documento</label>
              <input
                required
                name="titulo"
                type="text"
                placeholder="Ex: Lei Municipal nº 123/2026 - Orçamento Anual"
                className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-gray-900"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Tipo */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tipo</label>
                <select
                  required
                  name="tipo"
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-gray-700 cursor-pointer"
                >
                  <option value="">Selecione o tipo...</option>
                  <optgroup label="Leis e Normas">
                    <option value="lei">Lei</option>
                    <option value="decreto">Decreto</option>
                    <option value="portaria">Portaria</option>
                    <option value="resolucao">Resolução</option>
                    <option value="instrucao">Instrução Normativa</option>
                  </optgroup>
                  <optgroup label="Publicações">
                    <option value="edital">Edital</option>
                    <option value="aviso">Aviso / Comunicado</option>
                    <option value="ata">Ata de Reunião</option>
                  </optgroup>
                </select>
              </div>

              {/* Categoria */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Onde aparecer? (Categoria)</label>
                <select
                  required
                  name="categoria"
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-gray-700 cursor-pointer"
                >
                  <option value="leis_normas">Leis e Normas</option>
                  <option value="publicacoes">Publicações Oficiais (Editais, Atas, etc)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Ano */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Ano</label>
                <input
                  required
                  name="ano"
                  type="number"
                  defaultValue={new Date().getFullYear()}
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-gray-900"
                />
              </div>

              {/* Data de Publicação */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Data de Publicação</label>
                <input
                  required
                  name="data"
                  type="date"
                  defaultValue={new Date().toISOString().split("T")[0]}
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-gray-900"
                />
              </div>
            </div>

            {/* UPLOAD DE ARQUIVO */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Arquivo do Documento (PDF)</label>
              {!file ? (
                <div className="relative group">
                  <input
                    required
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="border-2 border-dashed border-gray-200 group-hover:border-blue-400 group-hover:bg-blue-50 rounded-2xl p-10 transition-all flex flex-col items-center justify-center gap-3">
                    <div className="bg-gray-100 text-gray-400 group-hover:bg-blue-100 group-hover:text-blue-600 p-4 rounded-2xl transition-colors">
                      <FileUp size={32} />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-gray-700">Clique ou arraste o arquivo PDF aqui</p>
                      <p className="text-xs text-gray-400 mt-1">Tamanho máximo: 50MB</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between p-5 bg-blue-50 border border-blue-100 rounded-2xl animate-in zoom-in-95 duration-200">
                  <div className="flex items-center gap-4">
                    <div className="bg-blue-600 text-white p-2.5 rounded-xl">
                      <FileUp size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-blue-900 truncate max-w-[250px] md:max-w-md">
                        {file.name}
                      </p>
                      <p className="text-[10px] text-blue-500 font-bold uppercase tracking-widest">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB • Pronto para upload
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="p-2 hover:bg-blue-100 rounded-lg text-blue-400 hover:text-blue-600 transition"
                  >
                    <X size={20} />
                  </button>
                </div>
              )}
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Descrição / Ementa (Breve resumo)</label>
              <textarea
                name="descricao"
                rows={3}
                placeholder="Descreva brevemente o conteúdo do documento..."
                className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-gray-900 resize-none"
              ></textarea>
            </div>

            {/* Status Feedback */}
            {status && (
              <div className={`p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${status.type === "success" ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"
                }`}>
                {status.type === "success" ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                <p className="text-sm font-bold">{status.message}</p>
              </div>
            )}

            {/* Botão Submit */}
            <button
              disabled={loading}
              type="submit"
              className="w-full py-5 bg-[#173572] text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-[#122a5a] transition-all shadow-xl shadow-blue-900/10 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  Subir e Publicar Documento
                </>
              )}
            </button>
          </form>
        </div>
      </main>

      <footer className="py-10 text-center">
        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
          Prefeitura de Padre Marcos • Sistema de Gestão de Conteúdo
        </p>
      </footer>
    </div>
  );
}
