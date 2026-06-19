"use client";

import { useState, useRef } from "react";
import {
  FileUp, X, Loader2, CheckCircle2, AlertTriangle,
  Upload, FileSpreadsheet,
} from "lucide-react";

type Resultado = {
  total: number;
  inseridas: number;
  atualizadas: number;
  comErros: number;
  erros: string[];
};

export default function ImportarPlanilha() {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit() {
    if (!file) return;

    setUploading(true);
    setError(null);
    setResultado(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/admin/licitacoes/importar", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Erro desconhecido");
      }

      setResultado(json);
    } catch (err: any) {
      setError(err.message);
    }

    setUploading(false);
  }

  function reset() {
    setFile(null);
    setResultado(null);
    setError(null);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleClose() {
    setOpen(false);
    setTimeout(reset, 300);
  }

  return (
    <>
      {/* Botão para abrir o modal */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition shadow-sm"
      >
        <Upload size={18} />
        Importar Planilha TCE
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-100 rounded-xl">
                  <FileSpreadsheet size={22} className="text-emerald-700" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-gray-900">Importar Planilha TCE</h2>
                  <p className="text-xs text-gray-600">
                    Faça upload da planilha exportada do TCE-PI (.xlsx ou .csv)
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-100 rounded-xl transition text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Resultado - aparece após importação */}
              {resultado && (
                <div className={`rounded-2xl p-5 ${resultado.comErros > 0 ? "bg-amber-50 border border-amber-200" : "bg-emerald-50 border border-emerald-200"}`}>
                  <div className="flex items-center gap-3 mb-3">
                    {resultado.comErros > 0 ? (
                      <AlertTriangle size={22} className="text-amber-600" />
                    ) : (
                      <CheckCircle2 size={22} className="text-emerald-600" />
                    )}
                    <p className="text-sm font-bold text-gray-900">
                      {resultado.comErros > 0 ? "Importação concluída com ressalvas" : "Importação concluída com sucesso!"}
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white rounded-xl p-3 text-center border border-gray-100">
                      <p className="text-2xl font-black text-emerald-700">{resultado.total}</p>
                      <p className="text-[10px] text-gray-600 font-bold uppercase tracking-wider">Total Lidas</p>
                    </div>
                    <div className="bg-white rounded-xl p-3 text-center border border-gray-100">
                      <p className="text-2xl font-black text-blue-700">{resultado.inseridas}</p>
                      <p className="text-[10px] text-gray-600 font-bold uppercase tracking-wider">Novas Inseridas</p>
                    </div>
                    <div className="bg-white rounded-xl p-3 text-center border border-gray-100">
                      <p className="text-2xl font-black text-amber-700">{resultado.atualizadas}</p>
                      <p className="text-[10px] text-gray-600 font-bold uppercase tracking-wider">Ignoradas (Já existem)</p>
                    </div>
                  </div>
                  {resultado.erros.length > 0 && (
                    <div className="mt-3 bg-red-50 border border-red-200 rounded-xl p-3 max-h-32 overflow-y-auto">
                      {resultado.erros.map((e, i) => (
                        <p key={i} className="text-xs text-red-700 font-mono">• {e}</p>
                      ))}
                    </div>
                  )}
                  <div className="flex justify-end mt-4">
                    <button
                      onClick={() => { window.location.reload(); }}
                      className="px-5 py-2.5 bg-[#0B3D91] text-white rounded-xl text-sm font-bold hover:bg-[#0a3280] transition"
                    >
                      Concluído
                    </button>
                  </div>
                </div>
              )}

              {/* Upload Area - mostra apenas se não tiver resultado */}
              {!resultado && (
                <>
                  {/* File Dropzone */}
                  {!file ? (
                    <label className="relative flex flex-col items-center justify-center gap-4 border-2 border-dashed border-gray-200 hover:border-emerald-400 rounded-2xl p-10 cursor-pointer transition-all hover:bg-emerald-50/30">
                      <input
                        ref={inputRef}
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) {
                            const ext = f.name.split(".").pop()?.toLowerCase();
                            if (!["xlsx", "xls", "csv"].includes(ext || "")) {
                              alert("Formato inválido. Aceitamos apenas .xlsx, .xls ou .csv");
                              return;
                            }
                            setFile(f);
                            setError(null);
                          }
                        }}
                      />
                      <div className="p-5 bg-gray-100 rounded-2xl transition-colors">
                        <FileUp size={32} className="text-gray-400" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-gray-700">
                          Clique ou arraste a planilha do TCE aqui
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Formatos aceitos: <strong>.xlsx</strong>, <strong>.xls</strong> ou <strong>.csv</strong>
                        </p>
                      </div>
                    </label>
                  ) : (
                    <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-emerald-600 rounded-xl">
                            <FileSpreadsheet size={20} className="text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900 truncate max-w-xs">{file.name}</p>
                            <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">
                              {(file.size / 1024 / 1024).toFixed(2)} MB · Pronto para importar
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={reset}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Mensagem de erro */}
                  {error && (
                    <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                      <AlertTriangle size={18} className="text-red-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-red-800">Erro na importação</p>
                        <p className="text-xs text-red-700 mt-1">{error}</p>
                      </div>
                    </div>
                  )}

                  {/* Instruções */}
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2">
                    <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">Como funciona</p>
                    <ol className="text-xs text-gray-600 space-y-1.5 list-decimal list-inside">
                      <li>Exporte a planilha de licitações do <strong>TCE-PI</strong> (formato .xlsx)</li>
                      <li>Faça o upload do arquivo ao lado</li>
                      <li>O sistema identifica automaticamente as colunas e insere no banco</li>
                      <li>Licitações já existentes são <strong>ignoradas</strong> (não duplicadas e não sobrescritas)</li>
                    </ol>
                  </div>

                  {/* Botão de importar */}
                  {file && (
                    <button
                      onClick={handleSubmit}
                      disabled={uploading}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-600 text-white rounded-xl text-sm font-black hover:bg-emerald-700 transition shadow-md shadow-emerald-900/20 disabled:opacity-50"
                    >
                      {uploading ? (
                        <><Loader2 size={18} className="animate-spin" /> Importando...</>
                      ) : (
                        <><Upload size={18} /> Importar Planilha</>
                      )}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
