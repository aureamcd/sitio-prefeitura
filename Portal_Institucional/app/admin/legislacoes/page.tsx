"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/client";
import {
  Scale, Plus, Search, Pencil, Trash2, ExternalLink,
  ChevronLeft, ChevronRight, Loader2, AlertTriangle,
  CheckCircle2, XCircle, FileText, RefreshCw, X, FileUp, Upload
} from "lucide-react";

const TIPOS = ["Lei", "Decreto", "Portaria", "Resolução", "Instrução Normativa", "Outros"];
const PER_PAGE = 15;

type Leg = {
  id: number;
  titulo: string;
  tipo: string | null;
  numero: string | null;
  ano: number;
  orgao: string | null;
  data_publicacao: string | null;
  publicado: boolean | null;
  slug: string | null;
  arquivo_r2_url: string | null;
};

type Toast = { type: "success" | "error"; msg: string };

export default function AdminLegislacoesPage() {
  const [items, setItems] = useState<Leg[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroAno, setFiltroAno] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  // Bulk Upload States
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkTipo, setBulkTipo] = useState("Portaria");
  const [bulkAno, setBulkAno] = useState(new Date().getFullYear().toString());
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });

  const supabase = createBrowserClient();
  const router = useRouter();

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/legislacoes");
      if (!res.ok) {
        const json = await res.json();
        showToast("error", "Erro ao carregar dados: " + (json.error ?? res.statusText));
      } else {
        setItems(await res.json());
      }
    } catch (err: any) {
      showToast("error", "Erro de rede: " + err.message);
    }
    setLoading(false);
  }

  const anos = useMemo(
    () => [...new Set(items.map(i => i.ano.toString()))].sort((a, b) => b.localeCompare(a)),
    [items]
  );

  const TIPOS_MAP: Record<string, string[]> = {
    lei: [
      "lei",
      "lei-organica",
      "codigo-postura",
      "codigo-tributario",
      "plano-carreira",
      "regime-juridico",
    ],
    decreto: ["decreto"],
    portaria: ["portaria"],
    resolucao: ["resolucao", "resolução"],
    "instrucao-normativa": ["instrucao-normativa", "instrução normativa"],
    outros: [""],
  };

  const normalizeString = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-");

  const filtered = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return items.filter(i => {
      if (filtroTipo) {
        const key = normalizeString(filtroTipo);
        const permitidos = TIPOS_MAP[key] || [key];
        const docTipo = i.tipo ? normalizeString(i.tipo) : "";
        if (!permitidos.includes(docTipo)) return false;
      }
      
      if (filtroAno && i.ano.toString() !== filtroAno) return false;
      
      if (filtroStatus === "publicado" && !i.publicado) return false;
      if (filtroStatus === "nao-publicado" && i.publicado) return false;

      if (q) {
        const match =
          i.titulo.toLowerCase().includes(q) ||
          (i.numero?.toLowerCase() ?? "").includes(q) ||
          (i.orgao?.toLowerCase() ?? "").includes(q) ||
          (i.slug?.toLowerCase() ?? "").includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [items, busca, filtroTipo, filtroAno, filtroStatus]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  function showToast(type: Toast["type"], msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    const { error } = await supabase.from("legislacoes").delete().eq("id", deleteId);
    if (error) {
      showToast("error", "Erro ao excluir: " + error.message);
    } else {
      setItems(prev => prev.filter(i => i.id !== deleteId));
      showToast("success", "Legislação excluída com sucesso.");
    }
    setDeleteId(null);
    setDeleting(false);
  }

  async function handleBulkUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);
    setShowBulkModal(false);
    setUploadingFiles(true);
    setUploadProgress({ current: 0, total: files.length });

    let successCount = 0;
    
    for (let i = 0; i < files.length; i++) {
      setUploadProgress({ current: i + 1, total: files.length });
      const file = files[i];
      const formData = new FormData();
      formData.append("file", file);
      formData.append("tipo", bulkTipo);
      formData.append("ano", bulkAno);

      try {
        const res = await fetch("/api/admin/legislacoes/upload", {
          method: "POST",
          body: formData,
        });
        if (!res.ok) throw new Error("Falha no upload do arquivo " + file.name);
        const data = await res.json();

        // Salvar no banco
        const slugTmp = "doc-pendente-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
        
        const { error } = await supabase.from("legislacoes").insert([{
          titulo: "Documento pendente (" + file.name + ")",
          tipo: bulkTipo,
          ano: parseInt(bulkAno),
          publicado: false,
          arquivo_r2_url: data.url,
          arquivo_nome: data.fileName,
          arquivo_tamanho: data.fileSize || null,
          arquivo_extensao: data.fileExtension || null,
          slug: slugTmp
        }]);
        
        if (!error) successCount++;
      } catch (err: any) {
        console.error(err);
      }
    }

    setUploadingFiles(false);
    showToast("success", successCount + " de " + files.length + " arquivos enviados com sucesso!");
    fetchAll(); // Recarregar lista
  }

  function fmtData(iso: string | null) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("pt-BR", { timeZone: "UTC" });
  }

  const TIPO_COLOR: Record<string, string> = {
    "Lei": "bg-blue-100 text-blue-700",
    "Decreto": "bg-purple-100 text-purple-700",
    "Portaria": "bg-orange-100 text-orange-700",
    "Resolução": "bg-teal-100 text-teal-700",
    "Instrução Normativa": "bg-indigo-100 text-indigo-700",
    "Lei Complementar": "bg-cyan-100 text-cyan-700",
    "Errata": "bg-rose-100 text-rose-700",
  };

  return (
    <div className="space-y-6">
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

      {/* Modal de confirmação de exclusão */}
      {deleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-red-600">
              <AlertTriangle size={22} />
              <h2 className="text-lg font-bold">Confirmar exclusão</h2>
            </div>
            <p className="text-gray-600 text-sm">
              Esta ação <strong>não pode ser desfeita</strong>. O registro será removido permanentemente do banco de dados.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 px-4 py-2.5 bg-gray-200 text-gray-800 rounded-xl text-sm font-bold hover:bg-gray-300 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Uploading Overlay */}
      {uploadingFiles && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 flex flex-col items-center space-y-4 animate-in zoom-in-95 duration-200">
            <Loader2 size={36} className="text-[#0B3D91] animate-spin" />
            <div className="text-center">
              <h2 className="text-lg font-bold text-gray-900">Enviando arquivos...</h2>
              <p className="text-sm text-gray-700 mt-1">
                Processando {uploadProgress.current} de {uploadProgress.total}
              </p>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 mt-4 overflow-hidden">
              <div 
                className="bg-[#0B3D91] h-full transition-all duration-300"
                style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal Configuração Lote */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-[#0B3D91]">
              <FileUp size={22} />
              <h2 className="text-lg font-bold">Adicionar Lote</h2>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Tipo dos arquivos</label>
                <select
                  value={bulkTipo}
                  onChange={e => setBulkTipo(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-[#0B3D91]/30 focus:border-[#0B3D91] transition text-sm bg-white text-gray-900"
                >
                  {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Ano</label>
                <input
                  type="number"
                  value={bulkAno}
                  onChange={e => setBulkAno(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-[#0B3D91]/30 focus:border-[#0B3D91] transition text-sm text-gray-900"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowBulkModal(false)}
                className="flex-1 px-4 py-2.5 bg-gray-200 text-gray-800 rounded-xl text-sm font-bold hover:bg-gray-300 transition"
              >
                Cancelar
              </button>
              <label className="flex-1 px-4 py-2.5 bg-[#0B3D91] text-white rounded-xl text-sm font-bold hover:bg-[#0a3280] transition flex items-center justify-center gap-2 cursor-pointer">
                <Upload size={16} />
                Selecionar PDFs
                <input 
                  type="file" 
                  multiple 
                  accept=".pdf" 
                  className="hidden" 
                  onChange={handleBulkUpload}
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 rounded-xl">
              <Scale className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900">Leis e Normas</h1>
              <p className="text-sm text-gray-700">{items.length} registros no banco</p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={fetchAll}
            className="p-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition text-gray-700 hidden sm:block"
            title="Recarregar"
          >
            <RefreshCw size={16} />
          </button>
          
          <button
            onClick={() => setShowBulkModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-200 transition border border-gray-200"
          >
            <FileUp size={18} />
            Adicionar arquivos
          </button>

          <Link
            href="/admin/legislacoes/nova"
            className="flex items-center gap-2 px-5 py-2.5 bg-[#0B3D91] text-white rounded-xl text-sm font-bold hover:bg-[#0a3280] transition shadow-sm"
          >
            <Plus size={18} />
            Nova Legislação
          </Link>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Busca */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
            <input
              type="text"
              placeholder="Buscar por título, número, órgão ou slug..."
              value={busca}
              onChange={e => { setBusca(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#0B3D91]/20 focus:border-[#0B3D91] transition text-gray-900"
            />
          </div>

          {/* Tipo */}
          <select
            value={filtroTipo}
            onChange={e => { setFiltroTipo(e.target.value); setPage(1); }}
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#0B3D91]/20 focus:border-[#0B3D91] transition bg-white cursor-pointer text-gray-900"
          >
            <option value="">Todos os tipos</option>
            {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          {/* Status */}
          <select
            value={filtroStatus}
            onChange={e => { setFiltroStatus(e.target.value); setPage(1); }}
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#0B3D91]/20 focus:border-[#0B3D91] transition bg-white cursor-pointer text-gray-900"
          >
            <option value="">Todos os status</option>
            <option value="publicado">Publicado</option>
            <option value="nao-publicado">Não Publicado</option>
          </select>

          {/* Ano */}
          <select
            value={filtroAno}
            onChange={e => { setFiltroAno(e.target.value); setPage(1); }}
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#0B3D91]/20 focus:border-[#0B3D91] transition bg-white cursor-pointer text-gray-900"
          >
            <option value="">Todos os anos</option>
            {anos.map(a => <option key={a} value={a}>{a}</option>)}
          </select>

          {/* Limpar */}
          {(busca || filtroTipo || filtroAno || filtroStatus) && (
            <button
              onClick={() => { setBusca(""); setFiltroTipo(""); setFiltroAno(""); setFiltroStatus(""); setPage(1); }}
              className="flex items-center gap-1.5 px-3 py-2.5 border border-dashed border-gray-300 rounded-xl text-sm text-gray-700 hover:text-red-600 hover:border-red-300 transition"
            >
              <X size={14} /> Limpar
            </button>
          )}
        </div>
        <p className="text-xs text-gray-600">
          {filtered.length} resultado(s) · Página {page} de {totalPages || 1}
        </p>
      </div>

      {/* Tabela */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-24 gap-3 text-gray-600">
            <Loader2 size={24} className="animate-spin" />
            <span className="text-sm font-medium">Carregando...</span>
          </div>
        ) : paged.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-gray-600">
            <FileText size={40} strokeWidth={1.5} />
            <p className="text-sm font-medium">Nenhuma legislação encontrada</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-700 uppercase tracking-wider">Tipo / Nº</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-700 uppercase tracking-wider">Título</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-700 uppercase tracking-wider hidden md:table-cell">Órgão</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-700 uppercase tracking-wider hidden lg:table-cell">Publicação</th>
                  <th className="text-center px-4 py-3 text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="text-center px-4 py-3 text-xs font-bold text-gray-700 uppercase tracking-wider">Arquivo</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-gray-700 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paged.map(item => (
                  <tr
                      key={item.id}
                      onClick={() => router.push(`/admin/legislacoes/${item.id}/editar`)}
                      className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                    >
                    {/* Tipo + Número */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="space-y-1">
                        {item.tipo && (
                          <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide ${TIPO_COLOR[item.tipo] ?? "bg-gray-100 text-gray-600"}`}>
                            {item.tipo}
                          </span>
                        )}
                        <p className="text-xs text-gray-700 font-medium">
                          {item.numero ? `Nº ${item.numero}/${item.ano}` : `S/N/${item.ano}`}
                        </p>
                      </div>
                    </td>

                    {/* Título */}
                    <td className="px-4 py-3 max-w-xs">
                      <p className="font-semibold text-gray-900 line-clamp-2 leading-snug">{item.titulo}</p>
                    </td>

                    {/* Órgão */}
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-gray-600 text-xs">{item.orgao ?? "—"}</span>
                    </td>

                    {/* Data publicação */}
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-gray-600 text-xs">{fmtData(item.data_publicacao)}</span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                        item.publicado
                          ? "bg-green-100 text-green-700"
                          : "bg-amber-100 text-amber-700"
                      }`}>
                        {item.publicado ? (
                          <><CheckCircle2 size={10} /> Publicado</>
                        ) : (
                          <><AlertTriangle size={10} /> Não Publicado</>
                        )}
                      </span>
                    </td>

                    {/* Arquivo */}
                    <td className="px-4 py-3 text-center">
                      {item.arquivo_r2_url ? (
                        <a
                          href={item.arquivo_r2_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-800 transition"
                          title="Abrir PDF"
                        >
                          <ExternalLink size={12} />
                          PDF
                        </a>
                      ) : (
                        <span className="text-[10px] text-gray-600">Sem PDF</span>
                      )}
                    </td>

                    {/* Ações */}
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/admin/legislacoes/${item.id}/editar`}
                          className="p-2 text-gray-700 hover:text-[#0B3D91] hover:bg-blue-50 rounded-lg transition"
                          title="Editar"
                        >
                          <Pencil size={15} />
                        </Link>
                        <button
                          onClick={() => setDeleteId(item.id)}
                          className="p-2 text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Excluir"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5 pt-2 border-t border-gray-100">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-700 hover:bg-gray-100 disabled:opacity-30 transition"
            aria-label="Página anterior"
          >
            <ChevronLeft size={18} />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(p => p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1))
            .map((p, idx, arr) => (
              <div key={p} className="flex gap-1.5">
                {idx > 0 && p - arr[idx - 1] > 1 && (
                  <span className="w-8 h-8 flex items-center justify-center text-gray-600 text-sm">…</span>
                )}
                <button
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-semibold transition ${
                    page === p ? "bg-[#0B3D91] text-white shadow-sm" : "text-gray-600 hover:bg-gray-100"
                  }`}
                  aria-label={`Página ${p}`}
                  aria-current={page === p ? "page" : undefined}
                >
                  {p}
                </button>
              </div>
            ))}

          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-700 hover:bg-gray-100 disabled:opacity-30 transition"
            aria-label="Próxima página"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
