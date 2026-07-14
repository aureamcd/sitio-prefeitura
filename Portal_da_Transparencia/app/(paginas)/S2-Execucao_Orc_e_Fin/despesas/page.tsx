'use client';

import { useState, useMemo, useCallback, useEffect, Fragment } from 'react';
import ContentPage from '@/components/layout/ContentPage';
import FilterPanel, { FilterValues } from '@/components/ui/FilterPanel';
import { createBrowserClient, useAvailableYears } from '@/lib/supabase/client';
import {
  MESES,
  formatBRL,
  formatDateISO,
  PAGE_SIZE,
} from '@/lib/despesas/types';
import type { DespesaRow, DespesaExtraRow, RestosPagarRow } from '@/lib/despesas/types';
import { useTodayDate } from '@/lib/hooks/useTodayDate';
import { usePagination } from '@/lib/hooks/usePagination';
import {
  ChevronDown,
  ChevronRight,
  Wallet,
  RefreshCcw,
  Clock,
  MapPin,
  BookOpen,
  Tag,
  FolderTree,
  FileText,
  DollarSign,
  Building2,
  Download,
  Gavel,
  ShoppingCart,
  Award,
  Megaphone,
  AlertCircle,
  Info,
} from 'lucide-react';
import { EMPRESAS } from '@/lib/empresas';
import Pagination from '@/components/ui/Pagination';
import DataTable, { ColumnConfig } from '@/components/ui/DataTable';

// -------------------------------------------------------------------
// Badge helpers
// -------------------------------------------------------------------
function FaseBadge({ row }: { row: DespesaRow }) {
  const pago = Number(row.pago) || 0;
  const liquidado = Number(row.liquidado) || 0;
  const empenhado = Number(row.empenhado) || 0;

  if (pago > 0) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-semibold">Pago</span>;
  if (liquidado > 0) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-semibold">Liquidado</span>;
  if (empenhado > 0) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-semibold">Empenhado</span>;
  return <span className="text-[11px] text-gray-400">—</span>;
}

// -------------------------------------------------------------------
// Dashboard Summary
// -------------------------------------------------------------------
function EmpenhosDashboard({
  ano, mes, loading,
  totalEmpenhado, totalLiquidado, totalPago, count,
}: {
  ano: string; mes: string; loading: boolean;
  totalEmpenhado: number;
  totalLiquidado: number; totalPago: number; count: number;
}) {
  const pagoPct = totalEmpenhado > 0 ? (totalPago / totalEmpenhado) * 100 : 0;
  const mesLabel = MESES.find((m) => m.value === mes)?.label;

  return (
    <div className="mt-4 mb-4 mx-auto bg-white border border-rose-100 rounded-2xl p-5 shadow-sm relative overflow-hidden">
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-rose-100 rounded-full blur-2xl opacity-50 pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-orange-100 rounded-full blur-2xl opacity-50 pointer-events-none" />

      <div className="relative z-10">
        <div className="flex items-center justify-center mb-4">
          <span className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50/80 px-3 py-1 text-[10px] sm:text-xs font-semibold tracking-widest text-rose-800 uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block animate-pulse" />
            Exercício {ano || 'Geral'}{mes ? ` · ${mesLabel}` : ''}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: 'Total Empenhado', value: totalEmpenhado, color: 'slate' },
            { label: 'Total Liquidado', value: totalLiquidado, color: 'amber' },
            { label: 'Total Pago', value: totalPago, color: 'emerald' },
          ].map(({ label, value, color }) => (
            <div key={label} className={`flex flex-col items-center p-2.5 rounded-xl hover:bg-${color}-50 transition-colors`}>
              <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{label}</p>
              {loading ? <div className="h-7 w-24 bg-gray-100 animate-pulse rounded" /> : (
                <p className={`text-lg sm:text-xl font-extrabold text-${color}-700 tabular-nums`}>{formatBRL(value)}</p>
              )}
            </div>
          ))}
        </div>



        <div className="mt-3 pt-3 border-t border-gray-100 flex justify-center">
          <span className="text-xs text-gray-400">{count} registro{count !== 1 ? 's' : ''}</span>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------------
// Extra Dashboard
// -------------------------------------------------------------------
function ExtraDashboard({ data, loading, ano, mes }: {
  data: DespesaExtraRow[]; loading: boolean; ano: string; mes: string;
}) {
  const totalPago = useMemo(() => data.reduce((s, r) => s + (Number(r.pago) || 0), 0), [data]);
  const mesLabel = MESES.find((m) => m.value === mes)?.label;
  return (
    <div className="mt-4 mb-4 mx-auto bg-white border border-purple-100 rounded-2xl p-5 shadow-sm relative overflow-hidden">
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-100 rounded-full blur-2xl opacity-50 pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-100 rounded-full blur-2xl opacity-50 pointer-events-none" />
      <div className="relative z-10">
        <div className="flex items-center justify-center mb-4">
          <span className="inline-flex items-center gap-2 rounded-full border border-purple-200 bg-purple-50/80 px-3 py-1 text-[10px] sm:text-xs font-semibold tracking-widest text-purple-800 uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 inline-block animate-pulse" />Exercício {ano || 'Geral'}{mes ? ` · ${mesLabel}` : ''}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col items-center p-3 rounded-xl hover:bg-gray-50 transition-colors">
            <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Registros</p>
            {loading ? <div className="h-7 w-16 bg-gray-100 animate-pulse rounded" /> : (
              <p className="text-xl font-extrabold text-slate-700 tabular-nums">{data.length}</p>
            )}
          </div>
          <div className="flex flex-col items-center p-3 rounded-xl hover:bg-emerald-50 transition-colors">
            <p className="text-[10px] sm:text-xs font-semibold text-emerald-600/70 uppercase tracking-wider mb-1">Total Pago</p>
            {loading ? <div className="h-7 w-32 bg-emerald-100 animate-pulse rounded" /> : (
              <p className="text-xl font-extrabold text-emerald-600 tabular-nums">{formatBRL(totalPago)}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------------
// Restos Dashboard
// -------------------------------------------------------------------
function RestosDashboard({ data, loading, ano, mes }: {
  data: RestosPagarRow[]; loading: boolean; ano: string; mes: string;
}) {
  const totalEmpenhado = useMemo(() => data.reduce((s, r) => s + (Number(r.empenhado) || 0), 0), [data]);
  const totalPago = useMemo(() => data.reduce((s, r) => s + (Number(r.pago) || 0), 0), [data]);
  const pagoPct = totalEmpenhado > 0 ? (totalPago / totalEmpenhado) * 100 : 0;
  const mesLabel = MESES.find((m) => m.value === mes)?.label;
  return (
    <div className="mt-4 mb-4 mx-auto bg-white border border-amber-100 rounded-2xl p-5 shadow-sm relative overflow-hidden">
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-100 rounded-full blur-2xl opacity-50 pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-orange-100 rounded-full blur-2xl opacity-50 pointer-events-none" />
      <div className="relative z-10">
        <div className="flex items-center justify-center mb-4">
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50/80 px-3 py-1 text-[10px] sm:text-xs font-semibold tracking-widest text-amber-800 uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block animate-pulse" />Exercício {ano || 'Geral'}{mes ? ` · ${mesLabel}` : ''}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex flex-col items-center p-3 rounded-xl hover:bg-gray-50">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Empenhado</p>
            {loading ? <div className="h-7 w-28 bg-gray-100 animate-pulse rounded" /> : (
              <p className="text-xl font-extrabold text-slate-700 tabular-nums">{formatBRL(totalEmpenhado)}</p>
            )}
          </div>
          <div className="flex flex-col items-center p-3 rounded-xl hover:bg-amber-50">
            <p className="text-[10px] font-semibold text-amber-600/70 uppercase tracking-wider mb-1">Total Pago</p>
            {loading ? <div className="h-7 w-28 bg-amber-100 animate-pulse rounded" /> : (
              <p className="text-xl font-extrabold text-amber-600 tabular-nums">{formatBRL(totalPago)}</p>
            )}
          </div>
          <div className="flex flex-col items-center p-3 rounded-xl hover:bg-emerald-50">
            <p className="text-[10px] font-semibold text-emerald-600/70 uppercase tracking-wider mb-1">% Pago</p>
            {loading ? <div className="h-7 w-16 bg-emerald-100 animate-pulse rounded" /> : (
              <p className="text-xl font-extrabold text-emerald-600 tabular-nums">{pagoPct.toFixed(1)}%</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------------
// Custom expandable table for empenhos
// -------------------------------------------------------------------
function generateCSV(rows: DespesaRow[]) {
  const headers = ['Nº Empenho','Data','Credor','CPF/CNPJ','Entidade','Órgão','Função','Subfunção','Natureza','Fonte','Objeto','Empenhado','Liquidado','Pago'];
  const csvRows = rows.map(r => [
    r.numero_empenho || r.pkemp || '',
    formatDateISO(r.data_empenho),
    r.credor_nome || '',
    r.credor_documento || '',
    r.empresa_nome || '',
    r.orgao_nome || r.orgao_codigo || '',
    r.funcao_nome || '',
    r.subfuncao_nome || '',
    r.natureza_codigo || '',
    r.fonte_nome || '',
    r.objeto || r.projeto_atividade_nome || '',
    String(Number(r.empenhado) || 0),
    String(Number(r.liquidado) || 0),
    String(Number(r.pago) || 0),
  ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(';'));
  const csv = `\uFEFF${headers.join(';')}\n${csvRows.join('\n')}`;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'empenhos.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

function EmpenhosTable({
  data, loading, error, paginationResetKey, hasActiveFilters,
}: {
  data: DespesaRow[]; loading: boolean; error: string | null;
  paginationResetKey: string; hasActiveFilters: boolean;
}) {
  const { slice, page, setPage, totalPages, total, startIndex, endIndex } = usePagination(data, PAGE_SIZE, paginationResetKey);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggleExpand = useCallback((id: string) => {
    setExpanded(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  }, []);

  if (error) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
        <p className="text-sm font-semibold text-red-600">Erro: {error}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 flex justify-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center text-sm text-gray-500">
        {hasActiveFilters ? 'Nenhum empenho encontrado para os filtros selecionados.' : 'Nenhum empenho registrado.'}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header com título + botão CSV */}
      <div className="px-4 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-gray-800">Empenhos</h2>
          <p className="text-xs text-gray-500">{data.length} registro{data.length !== 1 ? 's' : ''}</p>
        </div>
        {data.length > 0 && (
          <button
            onClick={() => generateCSV(data)}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            aria-label="Exportar dados completos em CSV"
          >
            <Download className="w-4 h-4" aria-hidden="true" />
            CSV
          </button>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-200">
              <th className="w-10 px-2 py-3" />
              <th className="px-3 py-3 text-left font-semibold text-gray-700">Nº Empenho</th>
              <th className="px-3 py-3 text-left font-semibold text-gray-700">Data</th>
              <th className="px-3 py-3 text-left font-semibold text-gray-700">Credor</th>
              <th className="px-3 py-3 text-right font-semibold text-gray-700">Empenhado</th>
              <th className="px-3 py-3 text-right font-semibold text-gray-700">Liquidado</th>
              <th className="px-3 py-3 text-right font-semibold text-gray-700">Pago</th>
            </tr>
          </thead>
          <tbody>
            {slice.map((row) => {
              const isOpen = expanded.has(row.id);
              return (
                <Fragment key={row.id}>
                  <tr
                    onClick={() => toggleExpand(row.id)}
                    className="border-t border-gray-100 hover:bg-blue-50/30 transition-colors cursor-pointer"
                  >
                    <td className="px-2 py-3 text-gray-400">
                      {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </td>
                    <td className="px-3 py-3 font-mono text-xs text-gray-800 font-medium">
                      {row.numero_empenho || row.pkemp || '—'}
                    </td>
                    <td className="px-3 py-3 text-gray-600 whitespace-nowrap">
                      {formatDateISO(row.data_empenho)}
                    </td>
                    <td className="px-3 py-3 max-w-[220px]">
                      <span className="block truncate font-medium text-gray-800" title={row.credor_nome || ''}>
                        {row.credor_nome || '—'}
                      </span>
                      {row.credor_documento && (
                        <span className="text-[10px] text-gray-400 block truncate">{row.credor_documento}</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-gray-800">
                      {formatBRL(Number(row.empenhado) || 0)}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-amber-600">
                      {formatBRL(Number(row.liquidado) || 0)}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-emerald-600 font-semibold">
                      {formatBRL(Number(row.pago) || 0)}
                    </td>
                  </tr>

                  {/* Expandable detail row */}
                  {isOpen && (
                    <tr className="bg-gray-50/70">
                      <td colSpan={8} className="px-6 py-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                          <DetailItem icon={<MapPin size={14} />} label="Órgão" value={row.orgao_nome || '-'} />
                          <DetailItem icon={<FolderTree size={14} />} label="Função" value={row.funcao_nome || '-'} />
                          <DetailItem icon={<Tag size={14} />} label="Subfunção" value={row.subfuncao_nome || '-'} />
                          <DetailItem icon={<BookOpen size={14} />} label="Natureza" value={row.natureza_nome || '-'} />
                          <DetailItem icon={<DollarSign size={14} />} label="Fonte de Recursos" value={row.fonte_codigo_nome || row.fonte_stn_nome || '-'} />
                          <DetailItem icon={<FileText size={14} />} label="Objeto" value={row.objeto || '-'} />
                          <DetailItem icon={<Gavel size={14} />} label="Licitação" value={row.licitacao_numero ? `${row.licitacao_modalidade || ''} ${row.licitacao_numero}`.trim() : '-'} />
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-4 py-4 border-t border-gray-100">
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          startIndex={startIndex}
          endIndex={endIndex}
          total={total}
        />
      </div>
    </div>
  );
}



// Detail item component for expandable rows
function DetailItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-gray-400 mt-0.5 shrink-0">{icon}</span>
      <div>
        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
        <p className="text-sm text-gray-700 leading-relaxed">{value}</p>
      </div>
    </div>
  );
}

// -------------------------------------------------------------------
// Main Page
// -------------------------------------------------------------------
export default function DespesasPage() {
  const today = useTodayDate();
  const [activeTab, setActiveTab] = useState<'empenhos' | 'extra_orcamentarias' | 'restos_a_pagar' | 'aquisicoes_bens' | 'patrocinio' | 'publicidade'>('empenhos');
  const [filters, setFilters] = useState<FilterValues & { natureza?: string; credor?: string; numero_empenho?: string }>({ ano: '2026', mes: '', busca: '', entidade: '', natureza: '', credor: '', numero_empenho: '' });
  const { anos: ANOS, loading: anosLoading } = useAvailableYears('despesas', filters.entidade || undefined);

  // Empenhos
  const [data, setData] = useState<DespesaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Extra-orçamentárias
  const [extraData, setExtraData] = useState<DespesaExtraRow[]>([]);
  const [extraLoading, setExtraLoading] = useState(false);
  const [extraError, setExtraError] = useState<string | null>(null);

  // Restos a pagar
  const [restosData, setRestosData] = useState<RestosPagarRow[]>([]);
  const [restosLoading, setRestosLoading] = useState(false);
  const [restosError, setRestosError] = useState<string | null>(null);

  const supabase = createBrowserClient();
  const filterKey = `${filters.ano}-${filters.mes}-${filters.busca}-${filters.entidade}`;
  const hasActiveFilters = !!(filters.ano || filters.mes || filters.busca || filters.entidade);

  // ── Buscar empenhos ──
  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        let query = supabase.schema('transparencia').from('despesas').select('*');
        if (filters.entidade) query = query.eq('empresa', filters.entidade);
        if (filters.ano) query = query.eq('ano', filters.ano);
        if (filters.mes) {
          query = query.ilike('data_empenho', `${filters.ano || '2026'}-${filters.mes}%`);
        }
        if (filters.busca) {
          query = query.or(
            `credor_nome.ilike.%${filters.busca}%` +
            `,numero_empenho.ilike.%${filters.busca}%` +
            `,pkemp.ilike.%${filters.busca}%` +
            `,orgao_nome.ilike.%${filters.busca}%` +
            `,objeto.ilike.%${filters.busca}%` +
            `,processo.ilike.%${filters.busca}%`
          );
        }
        if (filters.natureza) {
          query = query.or(`natureza_codigo.ilike.%${filters.natureza}%,natureza_nome.ilike.%${filters.natureza}%`);
        }
        if (filters.credor) {
          query = query.or(`credor_nome.ilike.%${filters.credor}%,credor_documento.ilike.%${filters.credor}%`);
        }
        if (filters.numero_empenho) {
          query = query.ilike('numero_empenho', `%${filters.numero_empenho}%`);
        }
        const { data: result, error: queryError } = await query
          .order('data_empenho', { ascending: false });
        if (cancelled) return;
        if (queryError) { setError(queryError.message); setData([]); }
        else if (result) { setData(result as DespesaRow[]); }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Erro ao carregar despesas');
          setData([]);
        }
      } finally { if (!cancelled) setLoading(false); }
    }
    const timer = setTimeout(fetchData, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [filters.ano, filters.mes, filters.busca, filters.entidade, filters.natureza, filters.credor, filters.numero_empenho, supabase]);

  // ── Buscar extra-orçamentárias ──
  useEffect(() => {
    if (activeTab !== 'extra_orcamentarias') return;
    let cancelled = false;
    async function fetchExtra() {
      setExtraLoading(true);
      setExtraError(null);
      try {
        let query = supabase.schema('transparencia').from('despesas_extra_orcamentarias').select('*');
        if (filters.entidade) query = query.eq('empresa', filters.entidade);
        if (filters.ano) query = query.eq('ano', filters.ano);
        if (filters.busca) {
          query = query.or(
            `descricao.ilike.%${filters.busca}%,nomenclatura.ilike.%${filters.busca}%` +
            `,historico.ilike.%${filters.busca}%,cnpj_inscricao.ilike.%${filters.busca}%`
          );
        }
        const { data: result, error: qErr } = await query.order('data', { ascending: false });
        if (cancelled) return;
        if (qErr) { setExtraError(qErr.message); setExtraData([]); }
        else if (result) { setExtraData(result as DespesaExtraRow[]); }
      } catch (err) {
        if (!cancelled) {
          setExtraError(err instanceof Error ? err.message : 'Erro ao carregar extra-orçamentárias');
          setExtraData([]);
        }
      } finally { if (!cancelled) setExtraLoading(false); }
    }
    const timer = setTimeout(fetchExtra, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [activeTab, filters.ano, filters.busca, filters.entidade, supabase]);

  // ── Buscar restos a pagar ──
  useEffect(() => {
    if (activeTab !== 'restos_a_pagar') return;
    let cancelled = false;
    async function fetchRestos() {
      setRestosLoading(true);
      setRestosError(null);
      try {
        let query = supabase.schema('transparencia').from('restos_pagar').select('*');
        if (filters.entidade) query = query.eq('empresa', filters.entidade);
        if (filters.ano) query = query.eq('ano', filters.ano);
        if (filters.busca) {
          query = query.or(`descricao.ilike.%${filters.busca}%,codigo.ilike.%${filters.busca}%`);
        }
        const { data: result, error: qErr } = await query.order('codigo', { ascending: true });
        if (cancelled) return;
        if (qErr) { setRestosError(qErr.message); setRestosData([]); }
        else if (result) { setRestosData(result as RestosPagarRow[]); }
      } catch (err) {
        if (!cancelled) {
          setRestosError(err instanceof Error ? err.message : 'Erro ao carregar restos a pagar');
          setRestosData([]);
        }
      } finally { if (!cancelled) setRestosLoading(false); }
    }
    const timer = setTimeout(fetchRestos, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [activeTab, filters.ano, filters.busca, filters.entidade, supabase]);

  // ── Totals ──
  const totalDotacaoAtualizada = useMemo(() => data.reduce((s, r) => s + (Number(r.dotacao_atualizada) || 0), 0), [data]);
  const totalEmpenhado = useMemo(() => data.reduce((s, r) => s + (Number(r.empenhado) || 0), 0), [data]);
  const totalLiquidado = useMemo(() => data.reduce((s, r) => s + (Number(r.liquidado) || 0), 0), [data]);
  const totalPago = useMemo(() => data.reduce((s, r) => s + (Number(r.pago) || 0), 0), [data]);

  // ── Handlers ──
  const handleChange = useCallback((field: any, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  }, []);
  const handleClear = useCallback(() => {
    setFilters({ ano: '', mes: '', busca: '', entidade: '', natureza: '', credor: '', numero_empenho: '' });
  }, []);

  // Extra table columns
  function TipoBadge({ row }: { row: DespesaExtraRow }) {
    const nome = (row.nomenclatura || '').toLowerCase();
    if (nome.includes('consignação') || nome.includes('consignacao')) {
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[11px] font-semibold">Consignação</span>;
    }
    if (nome.includes('caução') || nome.includes('caucao') || nome.includes('depósito') || nome.includes('deposito')) {
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-semibold">Caução/Depósito</span>;
    }
    if (nome.includes('restituição') || nome.includes('restituicao') || nome.includes('devolução') || nome.includes('devolucao')) {
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-semibold">Restituição</span>;
    }
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[11px] font-semibold">Outra</span>;
  }

  const extraColumns: ColumnConfig[] = [
    { header: 'Tipo', accessor: 'nomenclatura', render: (_v: string, row: DespesaExtraRow) => <TipoBadge row={row} /> },
    { header: 'Nomenclatura', accessor: 'nomenclatura', render: (val: string) => <span className="block max-w-[200px] truncate" title={val || ''}>{val || '-'}</span> },
    { header: 'Descrição', accessor: 'descricao', render: (val: string) => <span className="block max-w-[260px] line-clamp-2" title={val || ''}>{val || '-'}</span> },
    { header: 'Nº Guia', accessor: 'numero_guia', render: (val: string) => <span className="font-mono text-xs">{val || '-'}</span> },
    { header: 'Data', accessor: 'data', render: (val: string) => <span className="text-gray-600">{formatDateISO(val)}</span> },
    { header: 'Valor Pago (R$)', accessor: 'pago', render: (val: number) => (
      <span className={`block text-right tabular-nums font-semibold ${Number(val) > 0 ? 'text-emerald-600' : 'text-gray-400'}`}>{formatBRL(Number(val))}</span>
    )},
  ];

  function StatusBadge({ row }: { row: RestosPagarRow }) {
    const pago = Number(row.pago) || 0;
    const liquidado = Number(row.liquidado) || 0;
    if (pago > 0) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-semibold">Pago</span>;
    if (liquidado > 0) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-semibold">Processado</span>;
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-semibold">Não Processado</span>;
  }

  const restosColumns: ColumnConfig[] = [
    { header: 'Código', accessor: 'codigo', render: (val: string) => <span className="font-mono text-xs">{val || '-'}</span> },
    { header: 'Descrição', accessor: 'descricao', render: (val: string) => <span className="block max-w-[350px] line-clamp-2" title={val || ''}>{val || '-'}</span> },
    { header: 'Empenhado (R$)', accessor: 'empenhado', render: (val: number) => <span className="block text-right tabular-nums">{formatBRL(Number(val))}</span> },
    { header: 'Liquidado (R$)', accessor: 'liquidado', render: (val: number) => <span className="block text-right tabular-nums text-amber-600">{formatBRL(Number(val))}</span> },
    { header: 'Pago (R$)', accessor: 'pago', render: (val: number) => (
      <span className={`block text-right tabular-nums font-semibold ${Number(val) > 0 ? 'text-emerald-600' : 'text-gray-400'}`}>{formatBRL(Number(val))}</span>
    )},
  ];

  return (
    <ContentPage
      showSearch={false}
      title="Despesas"
      description="Demonstrativo da execução orçamentária das despesas do município — empenhos, liquidações, pagamentos, despesas extra-orçamentárias e restos a pagar."
      breadcrumb={[
        { label: 'Portal da Transparência', href: '/' },
        { label: 'Execução Orçamentária e Financeira', href: '/S2-Execucao_Orc_e_Fin' },
        { label: 'Despesas' },
      ]}
      lastUpdate={today}
      responsible="Secretaria Municipal de Finanças e Planejamento"
    >
      {/* Filter Panel — apenas filtros base */}
      <FilterPanel
        anos={ANOS}
        meses={MESES}
        values={filters}
        onChange={handleChange as any}
        onClear={handleClear}
        anosLoading={anosLoading}
        empresas={EMPRESAS}
      >
        {activeTab === 'empenhos' && (
          <>
            <div className="flex flex-col gap-1 sm:w-48">
              <label className="text-xs font-medium text-gray-600">Classificação Orçamentária</label>
              <input
                type="text"
                value={filters.natureza || ''}
                onChange={(e) => handleChange('natureza', e.target.value)}
                placeholder="Ex: 3.3.90"
                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-all"
              />
            </div>
            <div className="flex flex-col gap-1 sm:w-48">
              <label className="text-xs font-medium text-gray-600">Credor</label>
              <input
                type="text"
                value={filters.credor || ''}
                onChange={(e) => handleChange('credor', e.target.value)}
                placeholder="Nome ou CPF/CNPJ"
                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-all"
              />
            </div>
            <div className="flex flex-col gap-1 sm:w-32">
              <label className="text-xs font-medium text-gray-600">Nº Empenho</label>
              <input
                type="text"
                value={filters.numero_empenho || ''}
                onChange={(e) => handleChange('numero_empenho', e.target.value)}
                placeholder="Ex: 123"
                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-all"
              />
            </div>
          </>
        )}
      </FilterPanel>

      {/* Tabs */}
      <div className="mt-6 flex flex-wrap gap-1 border-b border-gray-200" role="tablist" aria-label="Seções de despesas">
        <button onClick={() => setActiveTab('empenhos')} role="tab" aria-selected={activeTab === 'empenhos'}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'empenhos' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}>
          <Wallet size={16} />Empenhos
        </button>
        <button onClick={() => setActiveTab('extra_orcamentarias')} role="tab" aria-selected={activeTab === 'extra_orcamentarias'}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'extra_orcamentarias' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}>
          <RefreshCcw size={16} />Extra-orçamentárias
        </button>
        <button onClick={() => setActiveTab('restos_a_pagar')} role="tab" aria-selected={activeTab === 'restos_a_pagar'}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'restos_a_pagar' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}>
          <Clock size={16} />Restos a Pagar
        </button>
        <button onClick={() => setActiveTab('aquisicoes_bens')} role="tab" aria-selected={activeTab === 'aquisicoes_bens'}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'aquisicoes_bens' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}>
          <ShoppingCart size={16} />Aquisições de Bens
        </button>
        <button onClick={() => setActiveTab('patrocinio')} role="tab" aria-selected={activeTab === 'patrocinio'}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'patrocinio' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}>
          <Award size={16} />Patrocínio
        </button>
        <button onClick={() => setActiveTab('publicidade')} role="tab" aria-selected={activeTab === 'publicidade'}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'publicidade' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}>
          <Megaphone size={16} />Publicidade
        </button>
      </div>

      {/* Tab: Empenhos */}
      {activeTab === 'empenhos' && (
        <div id="panel-empenhos" role="tabpanel">
          <EmpenhosDashboard
            ano={filters.ano} mes={filters.mes} loading={loading}
            totalEmpenhado={totalEmpenhado}
            totalLiquidado={totalLiquidado}
            totalPago={totalPago}
            count={data.length}
          />
          <EmpenhosTable
            data={data} loading={loading} error={error}
            paginationResetKey={filterKey}
            hasActiveFilters={hasActiveFilters}
          />
        </div>
      )}

      {/* Tab: Extra-orçamentárias */}
      {activeTab === 'extra_orcamentarias' && (
        <div id="panel-extra" role="tabpanel">
          <ExtraDashboard data={extraData} loading={extraLoading} ano={filters.ano} mes={filters.mes} />
          <DataTable
            columns={extraColumns}
            data={extraData}
            title="Despesas Extra-orçamentárias"
            caption="Operações extra-orçamentárias — valores que transitam pelo caixa sem integrar o orçamento anual."
            exportable
            loading={extraLoading}
            error={extraError}
            paginationResetKey={filterKey}
            hasActiveFilters={hasActiveFilters}
            emptyMessage="Nenhuma despesa extra-orçamentária registrada."
            emptyFilteredMessage="Nenhuma encontrada para os filtros selecionados."
            pageSize={PAGE_SIZE}
          />
        </div>
      )}

      {/* Tab: Restos a Pagar */}
      {activeTab === 'restos_a_pagar' && (
        <div id="panel-restos" role="tabpanel">
          <RestosDashboard data={restosData} loading={restosLoading} ano={filters.ano} mes={filters.mes} />
          <DataTable
            columns={restosColumns}
            data={restosData}
            title="Restos a Pagar"
            caption="Despesas empenhadas e não pagas até 31 de dezembro do exercício anterior."
            exportable
            loading={restosLoading}
            error={restosError}
            paginationResetKey={filterKey}
            hasActiveFilters={hasActiveFilters}
            emptyMessage="Nenhum resto a pagar registrado."
            emptyFilteredMessage="Nenhum encontrado para os filtros selecionados."
            pageSize={PAGE_SIZE}
          />
        </div>
      )}

      {/* Tab: Aquisições de Bens */}
      {activeTab === 'aquisicoes_bens' && (
        <div id="panel-aquisicoes" role="tabpanel" className="mt-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-gray-100">
                <ShoppingCart size={32} className="text-gray-400" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Aquisições de Bens</h3>
            <p className="text-sm text-gray-500 max-w-lg mx-auto leading-relaxed">
              Não há registros de aquisições de bens com detalhamento por item (preço unitário e quantidade) disponíveis no momento para os exercícios de <strong>2023, 2024, 2025 e 2026</strong>.
              Esta seção será atualizada assim que os dados forem estruturados conforme o critério 4.4 do PNTP 2026.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 border border-amber-200 text-xs font-medium text-amber-700">
              <AlertCircle size={14} />
              Critério 4.4 — Em adequação
            </div>
            <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2">
              <Info size={14} className="text-blue-600 shrink-0" />
              <p className="text-xs text-blue-700 font-medium">Declaração atualizada em {today}.</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Patrocínio */}
      {activeTab === 'patrocinio' && (
        <div id="panel-patrocinio" role="tabpanel" className="mt-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-gray-100">
                <Award size={32} className="text-gray-400" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Despesas de Patrocínio</h3>
            <p className="text-sm text-gray-500 max-w-lg mx-auto leading-relaxed">
              Não foram realizadas despesas com patrocínio nos exercícios de <strong>2023, 2024, 2025 e 2026</strong>.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-200 text-xs font-medium text-blue-700">
              <AlertCircle size={14} />
              Critério 4.5 — Inexistência de despesas
            </div>
            <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2">
              <Info size={14} className="text-blue-600 shrink-0" />
              <p className="text-xs text-blue-700 font-medium">Declaração atualizada em {today}.</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Publicidade */}
      {activeTab === 'publicidade' && (
        <div id="panel-publicidade" role="tabpanel" className="mt-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-gray-100">
                <Megaphone size={32} className="text-gray-400" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Contratos de Publicidade</h3>
            <p className="text-sm text-gray-500 max-w-lg mx-auto leading-relaxed">
              Não foram realizadas despesas com contratos de publicidade nos exercícios de <strong>2023, 2024, 2025 e 2026</strong>.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-200 text-xs font-medium text-blue-700">
              <AlertCircle size={14} />
              Critério 4.6 — Inexistência de despesas
            </div>
            <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2">
              <Info size={14} className="text-blue-600 shrink-0" />
              <p className="text-xs text-blue-700 font-medium">Declaração atualizada em {today}.</p>
            </div>
          </div>
        </div>
      )}

      {/* Nota Legal */}
      <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 px-6 py-4">
        <p className="text-sm font-semibold text-blue-800 mb-1">Fundamentação Legal</p>
        <p className="text-sm text-blue-800/80 leading-relaxed">
          As despesas são publicadas em conformidade com a Lei de Responsabilidade Fiscal (LC nº 101/2000),
          a Lei de Transparência (LC nº 131/2009) e o PNTP 2026. Os dados incluem dotação orçamentária,
          classificação funcional, programa, fonte de recursos, natureza da despesa e os estágios da execução.
        </p>
      </div>
    </ContentPage>
  );
}
