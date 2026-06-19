"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createBrowserClient } from "@/lib/supabase/client";
import {
  Plus, Search, Pencil, Trash2, ExternalLink,
  ChevronLeft, ChevronRight, Loader2, AlertTriangle,
  CheckCircle2, XCircle, RefreshCw, X,
} from "lucide-react";
import { getTableConfig, fmtMoney, fmtDate } from "@/lib/admin/transparencia-tables";

const PER_PAGE = 15;

type Toast = { type: "success" | "error"; msg: string };

type Props = {
  slug: string;
};

export default function DataList({ slug }: Props) {
  const _c = getTableConfig(slug);
  if (!_c) {
    return <div className="text-center py-12 text-red-600 font-bold">Configuração não encontrada para "{slug}"</div>;
  }
  const config = _c;

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtros, setFiltros] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  const supabase = createBrowserClient();
  const router = useRouter();
  const Icon = config.icon;

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    try {
      let query = supabase
        .schema(config.schema)
        .from(config.table)
        .select("*")
        .limit(5000);

      const orders = Array.isArray(config.orderBy) ? config.orderBy : [config.orderBy];
      for (const o of orders) {
        query = query.order(o.column, { ascending: o.ascending });
      }

      const { data, error } = await query;

      if (error) {
        showToast("error", "Erro ao carregar dados: " + error.message);
      } else {
        setItems(data || []);
      }
    } catch (err: any) {
      console.error("❌ ERRO AO CARREGAR DADOS:", config.table, err);
      showToast("error", "Erro de rede: " + err.message);
    }
    setLoading(false);
  }

  const filtered = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return items.filter((i) => {
      // Apply filters
      for (const [key, value] of Object.entries(filtros)) {
        if (value && String(i[key] ?? "") !== value) return false;
      }

      // Apply search
      if (q) {
        const searchableFields = ["titulo", "descricao", "objeto", "nome", "favorecido", "fornecedor", "fornecedor_nome", "codigo_contabil", "codigo", "entidade_pagadora", "entidade_recebedora", "nomenclatura", "localizacao", "empresa_responsavel", "receita_transferencia", "contrato_numero", "licitacao"];
        const match = searchableFields.some((field) => {
          const val = i[field];
          return val && String(val).toLowerCase().includes(q);
        });
        if (!match) return false;
      }
      return true;
    });
  }, [items, busca, filtros]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  function showToast(type: Toast["type"], msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    const { error } = await supabase
      .schema(config.schema)
      .from(config.table)
      .delete()
      .eq("id", deleteId);

    if (error) {
      showToast("error", "Erro ao excluir: " + error.message);
    } else {
      setItems((prev) => prev.filter((i) => i.id !== deleteId));
      showToast("success", `${config.label} excluído(a) com sucesso.`);
    }
    setDeleteId(null);
    setDeleting(false);
  }

  function renderCellValue(item: any, col: (typeof config.columns)[0]) {
    const val = item[col.key];

    if (col.monetary) return fmtMoney(val);
    if (col.type === "date") return fmtDate(val);
    if (col.render) return col.render(val, item);

    if (val === null || val === undefined) return "—";
    return String(val);
  }

  const anos = useMemo(() => {
    const years = new Set<number>();
    items.forEach((i) => {
      const y = i.ano ? Number(i.ano) : null;
      if (y && !isNaN(y)) years.add(y);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [items]);

  return (
    <div className="space-y-6">
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

      {/* Modal de confirmação de exclusão */}
      {deleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-red-600">
              <AlertTriangle size={22} />
              <h2 className="text-lg font-bold">Confirmar exclusão</h2>
            </div>
            <p className="text-gray-600 text-sm">
              Esta ação <strong>não pode ser desfeita</strong>. O registro será removido permanentemente.
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className={`p-2 ${config.bgColor} rounded-xl`}>
              <Icon className={`w-6 h-6 ${config.color}`} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900">{config.label}</h1>
              <p className="text-sm text-gray-700">{items.length} registros no banco · {config.description}</p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={fetchAll}
            className="p-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition text-gray-700"
            title="Recarregar"
          >
            <RefreshCw size={16} />
          </button>

          <Link
            href={`/admin/${config.slug}/nova`}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#0B3D91] text-white rounded-xl text-sm font-bold hover:bg-[#0a3280] transition shadow-sm"
          >
            <Plus size={18} />
            Novo {config.label.slice(0, -1)}
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
              placeholder="Buscar..."
              value={busca}
              onChange={(e) => { setBusca(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#0B3D91]/20 focus:border-[#0B3D91] transition text-gray-900"
            />
          </div>

          {/* Ano */}
          {anos.length > 0 && (
            <select
              value={filtros["ano"] || ""}
              onChange={(e) => { setFiltros((prev) => ({ ...prev, ano: e.target.value })); setPage(1); }}
              className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#0B3D91]/20 focus:border-[#0B3D91] transition bg-white cursor-pointer text-gray-900"
            >
              <option value="">Todos os anos</option>
              {anos.map((a) => (
                <option key={a} value={String(a)}>{a}</option>
              ))}
            </select>
          )}

          {/* Filtros adicionais da config */}
          {config.filters?.filter((f) => f.key !== "ano").map((filter) => {
            const options = filter.getOptions(items);
            if (options.length === 0) return null;
            return (
              <select
                key={filter.key}
                value={filtros[filter.key] || ""}
                onChange={(e) => { setFiltros((prev) => ({ ...prev, [filter.key]: e.target.value })); setPage(1); }}
                className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#0B3D91]/20 focus:border-[#0B3D91] transition bg-white cursor-pointer text-gray-900"
              >
                <option value="">{`Todos (${filter.label})`}</option>
                {options.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            );
          })}

          {/* Limpar filtros */}
          {(busca || Object.values(filtros).some(Boolean)) && (
            <button
              onClick={() => { setBusca(""); setFiltros({}); setPage(1); }}
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
            <Icon size={40} strokeWidth={1.5} className="text-gray-300" />
            <p className="text-sm font-medium">Nenhum registro encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {config.columns.map((col) => (
                    <th
                      key={col.key}
                      className={`text-left px-4 py-3 text-xs font-bold text-gray-700 uppercase tracking-wider ${col.hideMobile ? "hidden md:table-cell" : ""} ${col.width || ""}`}
                    >
                      {col.label}
                    </th>
                  ))}
                  <th className="text-right px-4 py-3 text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paged.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => router.push(`/admin/${config.slug}/${item.id}/editar`)}
                    className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                  >
                    {config.columns.map((col) => (
                      <td
                        key={col.key}
                        className={`px-4 py-3 ${col.hideMobile ? "hidden md:table-cell" : ""} ${col.monetary ? "font-medium tabular-nums" : ""}`}
                      >
                        <span className={col.monetary ? "text-gray-900" : "text-gray-600 text-xs"}>
                          {renderCellValue(item, col)}
                        </span>
                      </td>
                    ))}
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/admin/${config.slug}/${item.id}/editar`}
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
                        {item.arquivo_r2_url && (
                          <a
                            href={item.arquivo_r2_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Abrir PDF"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink size={15} />
                          </a>
                        )}
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
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-700 hover:bg-gray-100 disabled:opacity-30 transition"
            aria-label="Página anterior"
          >
            <ChevronLeft size={18} />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1))
            .map((p, idx, arr) => (
              <div key={p} className="flex gap-1.5">
                {idx > 0 && p - arr[idx - 1] > 1 && (
                  <span className="w-8 h-8 flex items-center justify-center text-gray-600 text-sm">…</span>
                )}
                <button
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-semibold transition ${
                    page === p
                      ? "bg-[#0B3D91] text-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                  aria-label={`Página ${p}`}
                  aria-current={page === p ? "page" : undefined}
                >
                  {p}
                </button>
              </div>
            ))}

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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
