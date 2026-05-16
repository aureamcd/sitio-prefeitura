/**
 * PAINEL ADMIN: Ouvidoria — Gestão de Manifestações
 * Mesma estrutura do e-SIC com filtro de tipo adicional.
 * @module app/admin/ouvidoria/page
 */
"use client";

import { useEffect, useState, useCallback } from "react";
import StatusBadge from "@/components/institucional/StatusBadge";
import DashboardStats from "@/components/institucional/DashboardStats";
import Toast, { ToastData } from "@/components/institucional/Toast";
import { OUVIDORIA_TIPO_LABELS } from "@/lib/types/ouvidoria";
import type { OuvidoriaManifestacao, OuvidoriaStatus } from "@/lib/types/ouvidoria";
import {
  Search, Filter, MessageCircle, ChevronLeft, ChevronRight,
  Loader2, Inbox, Download, Eye, X, Send, AlertCircle,
  Clock, MessageSquare, Tag, CheckCircle, Paperclip, UploadCloud
} from "lucide-react";

// Templates rápidos
const TEMPLATES: Record<string, string> = {
  "Recebimento": "Sua manifestação foi recebida com sucesso e encaminhada para a área responsável. O prazo legal para resposta é de até 30 dias.",
  "Em análise": "Informamos que sua manifestação encontra-se em análise pela equipe técnica competente. Em breve retornaremos com a resposta.",
  "Prorrogação": "Comunicamos a prorrogação do prazo de resposta por mais 30 dias, conforme art. 16 da Lei 13.460/2017, devido à necessidade de diligências adicionais.",
  "Encaminhamento": "Segue a resposta da área técnica em atendimento à sua manifestação.",
  "Indeferimento": "Informamos que a sua manifestação foi encerrada sem resolução do mérito pelos motivos expostos a seguir."
};

const STATUS_FILTERS = [
  { value: "todos", label: "Todos" },
  { value: "recebido", label: "📥 Pedido Recebido" },
  { value: "em_analise", label: "🔍 Em Análise" },
  { value: "respondido", label: "✅ Respondido" },
  { value: "indeferido", label: "❌ Pedido Indeferido" },
  { value: "prorrogado", label: "⏳ Prazo Prorrogado" },
];
const TIPO_FILTERS = [
  { value: "todos", label: "Todos os Tipos" },
  { value: "denuncia", label: "Denúncia" },
  { value: "reclamacao", label: "Reclamação" },
  { value: "solicitacao", label: "Solicitação" },
  { value: "sugestao", label: "Sugestão" },
  { value: "elogio", label: "Elogio" },
];

function fmtDate(iso: string) { return new Date(iso).toLocaleDateString("pt-BR"); }
function fmtFull(iso: string) { return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }); }

function getPrazoStatus(prazoIso: string, status: OuvidoriaStatus) {
  if (status === "respondido" || status === "indeferido") return { color: "text-gray-500", label: "Finalizado", bg: "bg-gray-100" };
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const prazo = new Date(prazoIso);
  prazo.setHours(0, 0, 0, 0);
  const diffTime = prazo.getTime() - hoje.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { color: "text-red-700", label: `Atrasado (${Math.abs(diffDays)}d)`, bg: "bg-red-100 border-red-200" };
  if (diffDays <= 3) return { color: "text-amber-700", label: `Vence em ${diffDays}d`, bg: "bg-amber-100 border-amber-200" };
  return { color: "text-green-700", label: `No prazo (${diffDays}d)`, bg: "bg-green-100 border-green-200" };
}

export default function AdminOuvidoriaPage() {
  const [items, setItems] = useState<OuvidoriaManifestacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("todos");
  const [tipoFilter, setTipoFilter] = useState("todos");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [sel, setSel] = useState<OuvidoriaManifestacao | null>(null);
  const [modal, setModal] = useState(false);
  const [toast, setToast] = useState<ToastData | null>(null);
  const [saving, setSaving] = useState(false);
  const [mStatus, setMStatus] = useState<OuvidoriaStatus>("em_analise");
  const [mResp, setMResp] = useState("");
  const [mJust, setMJust] = useState("");
  const [mMotivo, setMMotivo] = useState("");
  const [mData, setMData] = useState("");
  const [mFile, setMFile] = useState<File | null>(null);

  useEffect(() => { const t = setTimeout(() => setDebounced(search), 400); return () => clearTimeout(t); }, [search]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ page: String(page), limit: "15" });
      if (statusFilter !== "todos") p.set("status", statusFilter);
      if (tipoFilter !== "todos") p.set("tipo", tipoFilter);
      if (debounced) p.set("search", debounced);
      const res = await fetch(`/api/ouvidoria?${p}`);
      const r = await res.json();
      setItems(r.data || []); setTotal(r.total || 0); setTotalPages(r.totalPages || 1);
    } catch { setToast({ type: "error", message: "Erro ao carregar." }); }
    finally { setLoading(false); }
  }, [page, statusFilter, tipoFilter, debounced]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { setPage(1); }, [statusFilter, tipoFilter, debounced]);

  function openModal(item: OuvidoriaManifestacao) {
    setSel(item); setMStatus(item.status); setMResp(item.resposta || "");
    setMJust(item.justificativa_indeferimento || ""); setMMotivo(item.motivo_prorrogacao || "");
    setMData(item.data_prorrogacao ? new Date(item.data_prorrogacao).toISOString().split("T")[0] : "");
    setMFile(null);
    setModal(true);
  }

  async function handleSave() {
    if (!sel) return; setSaving(true);
    try {
      if (mStatus === "respondido" && !mResp.trim() && !mFile) {
        setToast({ type: "error", message: "Informe uma resposta ou anexe um arquivo." });
        setSaving(false);
        return;
      }
      if (mStatus === "indeferido" && !mJust.trim()) {
        setToast({ type: "error", message: "Informe a justificativa do indeferimento." });
        setSaving(false);
        return;
      }

      const body = new FormData();
      body.set("id", sel.id);
      body.set("status", mStatus);
      body.set("resposta", mResp);
      body.set("justificativa_indeferimento", mJust);
      body.set("motivo_prorrogacao", mMotivo);
      body.set("data_prorrogacao", mData);
      if (mFile) body.set("resposta_anexo", mFile);

      const res = await fetch("/api/ouvidoria", { method: "PATCH", body });
      if (!res.ok) throw new Error((await res.json()).error);
      setToast({ type: "success", message: "Atualizado!" }); setModal(false); fetchData();
    } catch (e: unknown) { setToast({ type: "error", message: e instanceof Error ? e.message : "Erro." }); }
    finally { setSaving(false); }
  }

  async function handleExport() {
    try {
      const p = new URLSearchParams({ limit: "9999" });
      if (statusFilter !== "todos") p.set("status", statusFilter);
      if (tipoFilter !== "todos") p.set("tipo", tipoFilter);
      if (debounced) p.set("search", debounced);
      const { data }: { data: OuvidoriaManifestacao[] } = await (await fetch(`/api/ouvidoria?${p}`)).json();
      if (!data?.length) { setToast({ type: "info", message: "Sem dados." }); return; }
      const h = ["Protocolo", "Tipo", "Nome", "E-mail", "Status", "Data", "Prazo", "Respondido"];
      const rows = data.map(m => [m.protocolo, OUVIDORIA_TIPO_LABELS[m.tipo] || m.tipo, m.anonimo ? "Anônimo" : m.nome, m.anonimo ? "" : m.email, m.status, fmtDate(m.created_at), fmtDate(m.prazo_resposta), m.respondido_em ? fmtDate(m.respondido_em) : "-"]);
      const csv = [h.join(";"), ...rows.map(r => r.join(";"))].join("\n");
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `ouvidoria-${new Date().toISOString().split("T")[0]}.csv`; a.click(); URL.revokeObjectURL(url);
      setToast({ type: "success", message: "Exportado!" });
    } catch { setToast({ type: "error", message: "Erro." }); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center"><MessageCircle className="w-5 h-5 text-purple-600" /></div>
          <div><h1 className="text-xl font-bold text-gray-900">Ouvidoria</h1><p className="text-sm text-gray-500">{total} manifestação(ões)</p></div>
        </div>
        <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium transition"><Download size={16} /> CSV</button>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-5"><DashboardStats apiUrl="/api/ouvidoria/stats" title="Métricas" canal="ouvidoria" /></div>

      <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md w-full">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#0B3D91]/20" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Filter size={16} className="text-gray-400" />
            {STATUS_FILTERS.map(f => (
              <button key={f.value} onClick={() => setStatusFilter(f.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${statusFilter === f.value ? "bg-[#0B3D91] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
              >{f.label}</button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Tag size={16} className="text-gray-400" />
          {TIPO_FILTERS.map(f => (
            <button key={f.value} onClick={() => setTipoFilter(f.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${tipoFilter === f.value ? "bg-[#0B3D91] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
            >{f.label}</button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="animate-spin text-[#0B3D91]" size={32} /></div>
        ) : items.length === 0 ? (
          <div className="text-center py-16"><div className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4"><Inbox size={28} className="text-gray-400" /></div><h4 className="text-gray-600 font-semibold">Nenhuma manifestação</h4></div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-5 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Protocolo</th>
                  <th className="text-left px-5 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Tipo</th>
                  <th className="text-left px-5 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Manifestante</th>
                  <th className="text-left px-5 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="text-left px-5 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Data</th>
                  <th className="text-left px-5 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Prazo</th>
                  <th className="text-right px-5 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Ações</th>
                </tr></thead>
                <tbody>{items.map(m => {
                  const prazoObj = getPrazoStatus(m.prazo_resposta, m.status);
                  return (
                    <tr key={m.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                      <td className="px-5 py-4"><span className="font-bold text-[#0B3D91] tracking-wider text-xs">{m.protocolo}</span></td>
                      <td className="px-5 py-4"><span className="text-xs font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded-md">{OUVIDORIA_TIPO_LABELS[m.tipo] || m.tipo}</span></td>
                      <td className="px-5 py-4"><p className="font-medium text-gray-900">{m.anonimo ? "Anônimo" : m.nome}</p>{!m.anonimo && <p className="text-xs text-gray-400">{m.email}</p>}</td>
                      <td className="px-5 py-4"><StatusBadge status={m.status} canal="ouvidoria" size="sm" /></td>
                      <td className="px-5 py-4 text-gray-500 text-xs">{fmtDate(m.created_at)}</td>
                      <td className="px-5 py-4">
                        <div className={`inline-flex px-2 py-1 rounded-md border text-xs font-bold ${prazoObj.bg} ${prazoObj.color}`}>
                          {prazoObj.label}
                        </div>
                        <div className="text-[10px] text-gray-400 mt-0.5 ml-1">{fmtDate(m.prazo_resposta)}</div>
                      </td>
                      <td className="px-5 py-4 text-right"><button onClick={() => openModal(m)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0B3D91] text-white rounded-lg text-xs font-bold hover:bg-[#082a64]"><Eye size={14} /> Ver</button></td>
                    </tr>
                  )
                })}</tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-4 border-t border-gray-200 bg-gray-50">
                <p className="text-xs text-gray-400">Pág {page}/{totalPages}</p>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg border hover:bg-white disabled:opacity-30"><ChevronLeft size={16} /></button>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-lg border hover:bg-white disabled:opacity-30"><ChevronRight size={16} /></button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {modal && sel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-5 flex items-center justify-between rounded-t-2xl z-10">
              <div><span className="text-xs font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded">{OUVIDORIA_TIPO_LABELS[sel.tipo]}</span><p className="text-xl font-black text-[#0B3D91] tracking-wider mt-1">{sel.protocolo}</p></div>
              <button onClick={() => setModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} className="text-gray-500" /></button>
            </div>
            <div className="p-5 space-y-5">
              <div className="bg-gray-100/80 rounded-xl p-4 border border-gray-200"><p className="text-xs font-black text-[#0B3D91] uppercase tracking-widest mb-3">Manifestante</p><div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-900 font-semibold"><p><strong className="text-gray-500 font-normal">Nome:</strong><br />{sel.anonimo ? "Anônimo" : sel.nome}</p>{!sel.anonimo && <p><strong className="text-gray-500 font-normal">E-mail:</strong><br />{sel.email}</p>}{sel.cpf && <p><strong className="text-gray-500 font-normal">CPF:</strong><br />{sel.cpf}</p>}{sel.telefone && <p><strong className="text-gray-500 font-normal">Tel:</strong><br />{sel.telefone}</p>}</div></div>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4"><div className="flex items-center gap-2 mb-3"><MessageCircle size={16} className="text-blue-700" /><p className="text-xs font-black text-blue-800 uppercase tracking-widest">Manifestação</p></div><p className="text-sm text-blue-900 whitespace-pre-wrap leading-relaxed">{sel.descricao}</p></div>
              <div className="flex flex-wrap gap-2">
                {sel.anexo_url && (
                  <a href={sel.anexo_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-2 rounded-lg hover:bg-blue-100">
                    <Paperclip size={14} /> Ver anexo do cidadão
                  </a>
                )}
                {sel.resposta_anexo_url && (
                  <a href={sel.resposta_anexo_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-xs font-bold text-green-700 bg-green-50 border border-green-200 px-3 py-2 rounded-lg hover:bg-green-100">
                    <Paperclip size={14} /> Ver anexo da resposta atual
                  </a>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm"><div className="bg-gray-50 rounded-lg p-4"><p className="font-bold text-gray-500 uppercase tracking-widest text-xs mb-1">CRIADO EM</p><p className="font-medium text-gray-800">{fmtFull(sel.created_at)}</p></div><div className="bg-gray-50 rounded-lg p-4"><p className="font-bold text-gray-500 uppercase tracking-widest text-xs mb-1">PRAZO</p><p className="font-medium text-gray-800">{fmtDate(sel.prazo_resposta)}</p></div></div>
              <hr />
              <p className="text-sm font-bold text-gray-700 flex items-center gap-2"><MessageSquare size={16} className="text-[#0B3D91]" /> Ação</p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button type="button" onClick={() => setMStatus("respondido")} className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-green-50 text-green-700 border border-green-200 text-xs font-bold hover:bg-green-100 transition">
                  <CheckCircle size={14} /> Responder
                </button>
                <button type="button" onClick={() => setMStatus("indeferido")} className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-red-50 text-red-700 border border-red-200 text-xs font-bold hover:bg-red-100 transition">
                  <AlertCircle size={14} /> Indeferir
                </button>
                <button type="button" onClick={() => setMStatus("prorrogado")} className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold hover:bg-purple-100 transition">
                  <Clock size={14} /> Prorrogar
                </button>
              </div>

              <div className="mb-4"><label className="block text-xs font-black text-gray-600 uppercase tracking-widest mb-2">Alterar Status</label><select value={mStatus} onChange={e => setMStatus(e.target.value as OuvidoriaStatus)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#0B3D91]/20 font-medium text-gray-800"><option value="recebido">📥 Pedido Recebido</option><option value="em_analise">🔍 Em Análise</option><option value="respondido">✅ Respondido</option><option value="indeferido">❌ Pedido Indeferido</option><option value="prorrogado">⏳ Prazo Prorrogado</option></select></div>
              {mStatus === "respondido" && (
                <div className="space-y-4 my-4 bg-green-50/50 border border-green-100 p-4 rounded-xl">
                  <div className="flex items-center justify-between gap-3">
                    <label className="block text-xs font-black text-green-900 uppercase tracking-widest">Resposta ao cidadão</label>
                    <button type="button" onClick={() => setMResp(TEMPLATES["Encaminhamento"])} className="text-xs font-bold text-green-700 hover:underline">Usar modelo</button>
                  </div>
                  <textarea value={mResp} onChange={e => setMResp(e.target.value)} rows={5} placeholder="Digite a resposta oficial da Prefeitura..." className="w-full px-4 py-3 bg-white border border-green-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-500/20 text-gray-900 resize-none" />
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-green-300 bg-white px-4 py-3 text-sm text-green-800 hover:bg-green-50">
                    <UploadCloud size={18} />
                    <span className="font-medium">{mFile ? mFile.name : "Anexar arquivo da resposta (opcional)"}</span>
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx" className="sr-only" onChange={e => setMFile(e.target.files?.[0] || null)} />
                  </label>
                </div>
              )}
              {mStatus === "indeferido" && (
                <div className="space-y-3 my-4 bg-red-50/50 border border-red-100 p-4 rounded-xl">
                  <div className="flex items-center justify-between gap-3">
                    <label className="block text-xs font-black text-red-900 uppercase tracking-widest">Justificativa do Indeferimento</label>
                    <button type="button" onClick={() => setMJust(TEMPLATES["Indeferimento"])} className="text-xs font-bold text-red-700 hover:underline">Usar modelo</button>
                  </div>
                  <textarea value={mJust} onChange={e => setMJust(e.target.value)} rows={4} placeholder="Explique o motivo legal/administrativo do indeferimento..." className="w-full px-4 py-3 bg-white border border-red-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-500/20 text-gray-900 resize-none" />
                </div>
              )}
              {mStatus === "prorrogado" && (
                <div className="space-y-4 my-4 bg-purple-50/50 border border-purple-100 p-4 rounded-xl">
                  <div>
                    <label className="block text-xs font-black text-purple-900 uppercase tracking-widest mb-2">Prorrogado para qual data?</label>
                    <input type="date" value={mData} onChange={e => setMData(e.target.value)} className="w-full px-4 py-2.5 bg-white border border-purple-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500/20 text-gray-900 font-medium" />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-purple-900 uppercase tracking-widest mb-2">Motivo da Prorrogação</label>
                    <textarea value={mMotivo} onChange={e => setMMotivo(e.target.value)} rows={3} placeholder="Descreva a justificativa para a prorrogação do prazo..." className="w-full px-4 py-3 bg-white border border-purple-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500/20 text-gray-900 resize-none" />
                  </div>
                </div>
              )}
              <button onClick={handleSave} disabled={saving} className="w-full py-3.5 bg-[#0B3D91] text-white rounded-xl font-bold text-sm uppercase tracking-wider hover:bg-[#082a64] flex items-center justify-center gap-2 disabled:opacity-50 mt-4">{saving ? <Loader2 className="animate-spin" size={18} /> : <><Send size={16} /> Salvar Status</>}</button>
            </div>
          </div>
        </div>
      )}
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}
