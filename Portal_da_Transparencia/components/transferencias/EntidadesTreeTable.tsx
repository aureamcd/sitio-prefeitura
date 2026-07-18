'use client';

import { useState, useMemo, useCallback } from 'react';
import { ChevronRight, ChevronDown, Download, Search, AlertCircle, ArrowRightLeft, FileSpreadsheet, FileText } from 'lucide-react';
import { formatBRL } from '@/lib/receitas/types';
import Pagination from '@/components/ui/Pagination';
import { usePagination } from '@/lib/hooks/usePagination';

export interface TransferenciaEntidadeRow {
  id?: string;
  exercicio: number;
  mes: number;
  entidade_pagadora: string;
  entidade_recebedora: string;
  cnpj_pagadora: string;
  cnpj_recebedora: string;
  repasse: number;
  devolucao: number;
  previsto: number;
  data_lancamento?: string | null;
  [key: string]: any;
}

interface EntidadesTreeTableProps {
  data: TransferenciaEntidadeRow[];
  loading: boolean;
  error: string | null;
  filterKey?: string;
  ano?: string;
  consolidado: boolean;
  onConsolidadoChange: (val: boolean) => void;
}

interface GroupedEntidade {
  key: string;
  mes: number;
  entidade_pagadora: string;
  entidade_recebedora: string;
  cnpj_pagadora: string;
  cnpj_recebedora: string;
  repasse_total: number;
  devolucao_total: number;
  previsto_total: number;
  filhos: TransferenciaEntidadeRow[];
}

export default function EntidadesTreeTable({
  data,
  loading,
  error,
  filterKey = '',
  ano = '',
  consolidado,
  onConsolidadoChange,
}: EntidadesTreeTableProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Agrupamento por (mes, entidade_pagadora, entidade_recebedora)
  const groupedList = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const map = new Map<string, GroupedEntidade>();

    for (const item of data) {
      const mes = Number(item.mes) || 1;
      const pag = item.entidade_pagadora || 'Não informado';
      const rec = item.entidade_recebedora || 'Não informado';
      const key = `${mes}:::${pag}:::${rec}`;

      if (!map.has(key)) {
        map.set(key, {
          key,
          mes,
          entidade_pagadora: pag,
          entidade_recebedora: rec,
          cnpj_pagadora: item.cnpj_pagadora || '—',
          cnpj_recebedora: item.cnpj_recebedora || '—',
          repasse_total: 0,
          devolucao_total: 0,
          previsto_total: Number(item.previsto) || 0,
          filhos: [],
        });
      }

      const g = map.get(key)!;
      g.repasse_total += Number(item.repasse) || 0;
      g.devolucao_total += Number(item.devolucao) || 0;
      g.filhos.push(item);
    }

    // Ordenar pelo Mês (descendente) e depois pelo nome da pagadora
    return Array.from(map.values()).sort((a, b) => {
      if (b.mes !== a.mes) return b.mes - a.mes;
      return a.entidade_pagadora.localeCompare(b.entidade_pagadora);
    });
  }, [data]);

  const { page, setPage, totalPages, slice: paginatedData } = usePagination(groupedList, 25, filterKey);

  const toggleGroup = useCallback((key: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const totalGeralConcedida = useMemo(() => {
    return groupedList.reduce((s, g) => s + g.repasse_total, 0);
  }, [groupedList]);

  const totalGeralRecebida = useMemo(() => {
    return groupedList.reduce((s, g) => s + g.devolucao_total, 0);
  }, [groupedList]);

  const totalGeralPrevisto = useMemo(() => {
    const uniquePairs = new Map<string, number>();
    for (const g of groupedList) {
      const pairKey = `${g.entidade_pagadora}:::${g.entidade_recebedora}`;
      if (!uniquePairs.has(pairKey)) {
        uniquePairs.set(pairKey, g.previsto_total);
      }
    }
    return Array.from(uniquePairs.values()).reduce((s, val) => s + val, 0);
  }, [groupedList]);

  // Export CSV
  const handleExportCSV = () => {
    if (data.length === 0) return;
    const headers = ['Exercicio', 'Mes', 'Data_Lancamento', 'Entidade_Pagadora', 'CNPJ_Pagadora', 'Entidade_Recebedora', 'CNPJ_Recebedora', 'Concedida_Repasse', 'Recebida_Devolucao', 'Previsto'];
    const rows = data.map(r => [
      r.exercicio,
      r.mes,
      r.data_lancamento || '',
      `"${r.entidade_pagadora || ''}"`,
      `"${r.cnpj_pagadora || ''}"`,
      `"${r.entidade_recebedora || ''}"`,
      `"${r.cnpj_recebedora || ''}"`,
      r.repasse || 0,
      r.devolucao || 0,
      r.previsto || 0,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `transferencias_entre_entidades_${ano || 'geral'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Top Header & Checkbox */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-50 via-white to-slate-50 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
            <ArrowRightLeft className="text-purple-600" size={20} />
            Transferências entre Entidades - Exercício {ano || 'Atual'}
          </h3>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            Clique na seta ou na linha para abrir abaixo os lançamentos detalhados de cada mês. ({groupedList.length} {groupedList.length === 1 ? 'grupo mensal' : 'grupos mensais'})
          </p>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleExportCSV}
            disabled={data.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors shadow-sm"
            title="Exportar dados para CSV/Excel"
          >
            <FileSpreadsheet size={14} className="text-emerald-600" />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Cards de Totais */}
      {!loading && !error && data.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 sm:p-6 bg-slate-50/80 border-b border-gray-200">
          <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm flex flex-col items-center sm:items-start">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Concedida (Repasse)</span>
            <span className="text-xl sm:text-2xl font-extrabold text-blue-700 mt-1 tabular-nums">
              {formatBRL(totalGeralConcedida)}
            </span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-purple-100 shadow-sm flex flex-col items-center sm:items-start">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Recebida (Devolução)</span>
            <span className="text-xl sm:text-2xl font-extrabold text-purple-700 mt-1 tabular-nums">
              {formatBRL(totalGeralRecebida)}
            </span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center sm:items-start">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Previsto</span>
            <span className="text-xl sm:text-2xl font-extrabold text-gray-800 mt-1 tabular-nums">
              {formatBRL(totalGeralPrevisto)}
            </span>
          </div>
        </div>
      )}

      {/* Tabela Principal */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100 text-gray-700 text-xs uppercase tracking-wider border-b border-gray-200">
              <th className="py-3 px-3 w-10 text-center">+/-</th>
              <th className="py-3 px-3 text-center">Mês</th>
              <th className="py-3 px-4">Entidade Pagadora</th>
              <th className="py-3 px-4">Entidade Recebedora</th>
              <th className="py-3 px-4">CNPJ Ent. Pagadora</th>
              <th className="py-3 px-4">CNPJ Ent. Recebedora</th>
              <th className="py-3 px-4 text-right">Concedida (Repasse)</th>
              <th className="py-3 px-4 text-right">Recebida (Devolução)</th>
              <th className="py-3 px-4 text-right">Previsto</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-sm">
            {loading && (
              <tr>
                <td colSpan={9} className="py-12 text-center text-gray-500">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="w-8 h-8 rounded-full border-2 border-purple-600 border-t-transparent animate-spin" />
                    <span className="font-medium text-sm">Carregando transferências entre entidades...</span>
                  </div>
                </td>
              </tr>
            )}

            {!loading && error && (
              <tr>
                <td colSpan={9} className="py-12 text-center">
                  <div className="flex flex-col items-center gap-2 max-w-md mx-auto text-red-600">
                    <AlertCircle size={28} />
                    <p className="font-medium">{error}</p>
                  </div>
                </td>
              </tr>
            )}

            {!loading && !error && paginatedData.length === 0 && (
              <tr>
                <td colSpan={9} className="py-12 text-center text-gray-500">
                  Nenhuma transferência entre entidades encontrada para os filtros selecionados.
                </td>
              </tr>
            )}

            {!loading && !error && paginatedData.map((group) => {
              const isExpanded = expandedGroups.has(group.key);

              return (
                <FragmentGroup
                  key={group.key}
                  group={group}
                  isExpanded={isExpanded}
                  onToggle={() => toggleGroup(group.key)}
                />
              );
            })}
          </tbody>

        </table>
      </div>

      {/* Pagination */}
      {!loading && !error && totalPages > 1 && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}

interface FragmentGroupProps {
  group: GroupedEntidade;
  isExpanded: boolean;
  onToggle: () => void;
}

function FragmentGroup({ group, isExpanded, onToggle }: FragmentGroupProps) {
  const mesFormatado = group.mes ? group.mes.toString().padStart(2, '0') : '—';

  return (
    <>
      {/* Linha Pai (Resumo do Mês e Entidades) */}
      <tr
        onClick={onToggle}
        className={`cursor-pointer transition-colors font-medium ${
          isExpanded
            ? 'bg-purple-50/80 border-l-4 border-l-purple-600'
            : 'hover:bg-purple-50/40 bg-white'
        }`}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle();
          }
        }}
      >
        <td className="py-3 px-3 text-center text-gray-400">
          {isExpanded ? <ChevronDown size={18} className="text-purple-600 inline" /> : <ChevronRight size={18} className="inline" />}
        </td>
        <td className="py-3 px-3 text-center font-bold text-gray-900 bg-gray-50/50">
          {group.mes}
        </td>
        <td className="py-3 px-4 font-semibold text-gray-900">
          {group.entidade_pagadora}
        </td>
        <td className="py-3 px-4 font-semibold text-gray-900">
          {group.entidade_recebedora}
        </td>
        <td className="py-3 px-4 font-mono text-xs text-gray-600">
          {group.cnpj_pagadora}
        </td>
        <td className="py-3 px-4 font-mono text-xs text-gray-600">
          {group.cnpj_recebedora}
        </td>
        <td className="py-3 px-4 text-right tabular-nums font-bold text-blue-600">
          {formatBRL(group.repasse_total)}
        </td>
        <td className="py-3 px-4 text-right tabular-nums font-semibold text-purple-600">
          {formatBRL(group.devolucao_total)}
        </td>
        <td className="py-3 px-4 text-right tabular-nums text-gray-600 font-normal">
          {formatBRL(group.previsto_total)}
        </td>
      </tr>

      {/* Linha Filho (Tabela de Detalhes Inline - Expandida Abaixo) */}
      {isExpanded && (
        <tr className="bg-slate-50/90 border-b border-gray-200">
          <td colSpan={9} className="p-4 sm:p-6 pl-6 sm:pl-12">
            <div className="bg-white border-2 border-purple-200 rounded-xl shadow-inner p-4 sm:p-5">
              <div className="mb-3 border-b border-gray-200 pb-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h4 className="text-xs sm:text-sm font-bold text-purple-900">
                  Transferência do Mês: <span className="bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded font-mono">{mesFormatado}</span> da Entidade Pagadora: <span className="underline">{group.entidade_pagadora}</span> e Entidade Recebedora: <span className="underline">{group.entidade_recebedora}</span>
                </h4>
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  {group.filhos.length} {group.filhos.length === 1 ? 'lançamento no mês' : 'lançamentos no mês'}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm border border-gray-200 rounded-lg">
                  <thead>
                    <tr className="bg-purple-900 text-white text-[11px] uppercase tracking-wider font-semibold">
                      <th className="py-2.5 px-3">Data</th>
                      <th className="py-2.5 px-3">Histórico</th>
                      <th className="py-2.5 px-3">Entidade Pagadora</th>
                      <th className="py-2.5 px-3">Entidade Recebedora</th>
                      <th className="py-2.5 px-3">CNPJ Ent. Pagadora</th>
                      <th className="py-2.5 px-3">CNPJ Ent. Recebedora</th>
                      <th className="py-2.5 px-3 text-right">Concedida</th>
                      <th className="py-2.5 px-3 text-right">Recebida</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {group.filhos.map((filho, idx) => {
                      const dataFormatada = filho.data_lancamento
                        ? filho.data_lancamento.split('-').reverse().join('/')
                        : `Mês ${mesFormatado}`;

                      return (
                        <tr key={filho.id || idx} className="hover:bg-purple-50/30">
                          <td className="py-2.5 px-3 font-mono text-gray-700 whitespace-nowrap">
                            {dataFormatada}
                          </td>
                          <td className="py-2.5 px-3 font-medium text-gray-800">
                            Transferencia entre entidades.
                          </td>
                          <td className="py-2.5 px-3 text-gray-600">
                            {filho.entidade_pagadora}
                          </td>
                          <td className="py-2.5 px-3 text-gray-600">
                            {filho.entidade_recebedora}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-gray-500 whitespace-nowrap">
                            {filho.cnpj_pagadora}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-gray-500 whitespace-nowrap">
                            {filho.cnpj_recebedora}
                          </td>
                          <td className="py-2.5 px-3 text-right tabular-nums font-bold text-blue-600 whitespace-nowrap">
                            {formatBRL(filho.repasse || 0)}
                          </td>
                          <td className="py-2.5 px-3 text-right tabular-nums font-semibold text-purple-600 whitespace-nowrap">
                            {formatBRL(filho.devolucao || 0)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-purple-50 font-bold text-gray-900 border-t border-purple-200 text-xs">
                      <td colSpan={6} className="py-2.5 px-3 text-right uppercase text-purple-900">
                        Total do Mês {mesFormatado}:
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums text-blue-700">
                        {formatBRL(group.repasse_total)}
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums text-purple-700">
                        {formatBRL(group.devolucao_total)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
