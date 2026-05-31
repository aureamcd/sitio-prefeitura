'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { Loader2, ChevronRight, ChevronDown } from 'lucide-react';
import { formatBRL, realizacaoBg, MESES } from '@/lib/receitas/types';

interface Receita {
  id: string;
  ano: number;
  empresa: string;
  empresa_nome: string;
  codigo_contabil: string;
  codigo_limpo: string;
  descricao: string;
  nivel: number;
  nome_nivel: string;
  codigo_pai: string | null;
  has_children: boolean;
  is_analitica: boolean;
  fonte_stn?: string;
  fonte_recurso?: string;
  cod_aplicacao?: string;
  previsto_inicial: number;
  previsto_atualizado: number;
  arrecadado_periodo: number;
  arrecadado_total: number;
}

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(val || 0);
};

export default function ReceitasHistoricoTeste() {
  const [data, setData] = useState<Receita[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros simples fixos (apenas um ano da prefeitura como solicitado)
  const ano = 2025;
  const empresa = '1';

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const supabase = createBrowserClient();
        const { data: result, error } = await supabase
          .schema('transparencia')
          .from('receitas')
          .select('*')
          .eq('ano', Number(ano))
          .eq('empresa', empresa)
          .order('codigo_limpo', { ascending: true })
          .order('is_analitica', { ascending: true })
          .order('fonte_recurso', { ascending: true })
          .order('cod_aplicacao', { ascending: true });

        if (error) {
          console.error(error);
        } else {
          setData(result as Receita[]);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [ano, empresa]);

  const { roots, childrenMap } = useMemo(() => {
    const map = new Map<string, Receita[]>();
    const allPaiCodes = new Set<string>();

    data.forEach((item) => {
      let pai = item.codigo_pai || 'ROOT';
      
      // REGRA DE OURO PARA CORRIGIR REPETIÇÕES:
      // Se a conta é analítica, e existe uma sintética exatamente com o mesmo código,
      // então a analítica deve ficar DENTRO da sintética (ser filha dela), e não irmã.
      if (item.is_analitica) {
        const temSinteticaIgual = data.some(d => !d.is_analitica && d.codigo_contabil === item.codigo_contabil);
        if (temSinteticaIgual) {
          pai = item.codigo_contabil;
        }
      }

      if (!map.has(pai)) {
        map.set(pai, []);
      }
      map.get(pai)!.push(item);
      if (pai !== 'ROOT') {
        allPaiCodes.add(pai);
      }
    });

    const availableCodes = new Set(data.map(d => d.codigo_contabil));
    
    const rootsList: Receita[] = [];
    data.forEach(item => {
      // Se ajustamos o pai para ser o próprio código contábil, ele NÃO é root
      let currentPai = item.codigo_pai || 'ROOT';
      if (item.is_analitica && data.some(d => !d.is_analitica && d.codigo_contabil === item.codigo_contabil)) {
        currentPai = item.codigo_contabil;
      }

      if (currentPai === 'ROOT' || currentPai === '0000.00.0.0.00' || !availableCodes.has(currentPai)) {
        rootsList.push(item);
      }
    });

    return { roots: rootsList, childrenMap: map };
  }, [data]);

  const {
    totalPrevistoInicial,
    totalPrevistoAtualizado,
    totalArrecadadoPeriodo,
    totalArrecadadoTotal
  } = useMemo(() => {
    const niveisUm = data.filter((item) => item.nivel === 1);
    return niveisUm.reduce(
      (acc, root) => ({
        totalPrevistoInicial: acc.totalPrevistoInicial + (root.previsto_inicial || 0),
        totalPrevistoAtualizado: acc.totalPrevistoAtualizado + (root.previsto_atualizado || 0),
        totalArrecadadoPeriodo: acc.totalArrecadadoPeriodo + (root.arrecadado_periodo || 0),
        totalArrecadadoTotal: acc.totalArrecadadoTotal + (root.arrecadado_total || 0),
      }),
      {
        totalPrevistoInicial: 0,
        totalPrevistoAtualizado: 0,
        totalArrecadadoPeriodo: 0,
        totalArrecadadoTotal: 0,
      }
    );
  }, [data]);

  const totalPct = totalPrevistoAtualizado > 0 ? (totalArrecadadoPeriodo / totalPrevistoAtualizado) * 100 : 0;

  return (
    <div className="container mx-auto p-4 space-y-4">
      
      {/* ── Dashboard Topo (Igual ao da tela de Receitas) ── */}
      <div className="mt-4 mb-4 mx-auto bg-white border border-blue-100 rounded-2xl p-4 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-100 rounded-full blur-2xl opacity-50 pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-100 rounded-full blur-2xl opacity-50 pointer-events-none" />

        <span className="relative z-10 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/80 px-3 py-1 text-[10px] sm:text-xs font-semibold tracking-widest text-[#0B3D91] uppercase mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 inline-block animate-pulse" />
          Exercício {ano} (Entidade {empresa})
        </span>

        <div className="flex flex-wrap justify-center gap-4 sm:gap-8 w-full relative z-10">
          <div className="flex flex-col items-center p-2 rounded-xl hover:bg-gray-50 transition-colors">
            <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Prev. Inicial</p>
            {loading ? (
              <div className="h-6 w-24 bg-gray-100 animate-pulse rounded mt-1" />
            ) : (
              <p className="text-xl sm:text-2xl font-extrabold text-slate-700 tabular-nums">{formatBRL(totalPrevistoInicial)}</p>
            )}
          </div>

          <div className="hidden sm:block w-px bg-gradient-to-b from-transparent via-blue-200 to-transparent" />

          <div className="flex flex-col items-center p-2 rounded-xl hover:bg-gray-50 transition-colors">
            <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Prev. Atualizado</p>
            {loading ? (
              <div className="h-6 w-24 bg-gray-100 animate-pulse rounded mt-1" />
            ) : (
              <p className="text-xl sm:text-2xl font-extrabold text-slate-700 tabular-nums">{formatBRL(totalPrevistoAtualizado)}</p>
            )}
          </div>

          <div className="hidden sm:block w-px bg-gradient-to-b from-transparent via-blue-200 to-transparent" />

          <div className="flex flex-col items-center p-2 rounded-xl hover:bg-blue-50 transition-colors">
            <p className="text-[10px] sm:text-xs font-semibold text-blue-600/70 uppercase tracking-wider mb-1">Total Arrecadado</p>
            {loading ? (
              <div className="h-6 w-24 bg-blue-100 animate-pulse rounded mt-1" />
            ) : (
              <p className="text-xl sm:text-2xl font-extrabold text-blue-700 tabular-nums">{formatBRL(totalArrecadadoPeriodo)}</p>
            )}
          </div>

          <div className="hidden sm:block w-px bg-gradient-to-b from-transparent via-emerald-200 to-transparent" />

          <div className="flex flex-col items-center p-2 rounded-xl hover:bg-emerald-50 transition-colors">
            <p className="text-[10px] sm:text-xs font-semibold text-emerald-600/70 uppercase tracking-wider mb-1">% Realização</p>
            {loading ? (
              <div className="h-6 w-12 bg-emerald-100 animate-pulse rounded mt-1" />
            ) : (
              <p className="text-xl sm:text-2xl font-extrabold text-emerald-600 tabular-nums">{totalPct.toFixed(1)}%</p>
            )}
          </div>
        </div>
      </div>
      
      {/* ── Tabela com Visual Idêntico ao 2026 ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Table header toolbar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-800">
              Classificação Hierárquica da Receita
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Clique ou pressione Enter/Space para expandir as categorias.
              A arrecadação é apresentada até o nível de desdobramento, em conformidade com as regras de sigilo fiscal.
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto" role="region" aria-label="Tabela de classificação hierárquica da receita">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-200">
                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                  Código e Descrição da Receita
                </th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700 whitespace-nowrap">
                  Prev. Inicial
                </th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700 whitespace-nowrap">
                  Prev. Atualizado
                </th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700 whitespace-nowrap">
                  Arrecadado
                </th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700 whitespace-nowrap">
                  % Realização
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-4" aria-label="Carregando dados">
                      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <div className="animate-pulse flex justify-center">
                        <div className="h-4 bg-gray-200 rounded w-1/4" />
                      </div>
                    </div>
                  </td>
                </tr>
              ) : roots.length > 0 ? (
                roots.map((root) => (
                  <TreeNode
                    key={root.id}
                    item={root}
                    childrenMap={childrenMap}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-gray-400">
                      <p className="text-sm font-semibold">Nenhum dado disponível</p>
                      <p className="text-xs">Selecione um ano ou entre em contato com a Secretaria de Finanças</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const TreeNode = React.memo(
  ({
    item,
    childrenMap,
  }: {
    item: Receita;
    childrenMap: Map<string, Receita[]>;
  }) => {
    // Níveis 1, 2 e 3 começam abertos — o usuário já vê até o nível 4 e pode fechar/abrir
    const [isExpanded, setIsExpanded] = useState(item.nivel <= 3);

    // Analíticas são SEMPRE folhas — nunca têm filhas (evita loop de repetição)
    const children = item.is_analitica ? [] : (childrenMap.get(item.codigo_contabil) || []);
    const hasChildren = children.length > 0;

    const logicalDepth = Math.max(0, item.nivel - 1);
    const pct = item.previsto_atualizado !== 0 ? (item.arrecadado_periodo / item.previsto_atualizado) * 100 : 0;
    const levelLabel = item.nome_nivel || '';

    const toggle = useCallback(() => {
      if (hasChildren) setIsExpanded((prev) => !prev);
    }, [hasChildren]);

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (!hasChildren) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setIsExpanded((prev) => !prev);
        }
      },
      [hasChildren]
    );

    const rowClass = (() => {
      if (item.is_analitica) return 'text-gray-500 bg-gray-50/50 border-t border-gray-100/50 text-sm';
      if (logicalDepth === 0) return 'bg-gray-50 border-t border-gray-200 font-semibold text-gray-900';
      if (logicalDepth === 1) return 'font-medium text-gray-800 bg-white border-t border-gray-100';
      if (logicalDepth === 2) return 'text-gray-700 bg-white border-t border-gray-50';
      return 'text-gray-600 bg-white border-t border-gray-50 text-sm';
    })();

    return (
      <>
        <tr
          className={`${rowClass} transition-colors ${
            hasChildren
              ? 'cursor-pointer hover:bg-blue-50/40'
              : 'hover:bg-gray-50/60'
          }`}
          onClick={toggle}
          onKeyDown={handleKeyDown}
          tabIndex={hasChildren ? 0 : undefined}
          role={hasChildren ? 'button' : undefined}
          aria-expanded={hasChildren ? isExpanded : undefined}
          aria-label={
            hasChildren
              ? `${item.descricao} — ${levelLabel}. ${isExpanded ? 'Clique para recolher' : 'Clique para expandir'}`
              : undefined
          }
        >
          {/* Código e Descrição com indent */}
          <td className="px-4 py-3" style={{ paddingLeft: `${16 + logicalDepth * 20}px` }}>
            <div className="flex items-center gap-2">
              {hasChildren ? (
                <span
                  className="text-gray-400 flex-shrink-0 transition-transform duration-200"
                  aria-hidden="true"
                >
                  {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </span>
              ) : (
                <span className="w-[14px] flex-shrink-0" aria-hidden="true" />
              )}
              <span>
                <span className={`font-mono text-xs ${logicalDepth === 0 ? 'text-gray-700' : 'text-gray-500'}`}>
                  {item.codigo_contabil.split('-')[0]}
                </span>
                {' - '}
                {item.descricao}
                <span className="text-gray-400 font-normal ml-1">({levelLabel})</span>
              </span>
            </div>
          </td>

          {/* Previsto Inicial */}
          <td
            className={`px-4 py-3 text-right tabular-nums whitespace-nowrap ${
              logicalDepth === 0 ? 'text-gray-900' : 'text-gray-600'
            }`}
          >
            {formatBRL(item.previsto_inicial)}
          </td>

          {/* Previsto Atualizado */}
          <td
            className={`px-4 py-3 text-right tabular-nums whitespace-nowrap ${
              logicalDepth === 0 ? 'text-gray-900' : 'text-gray-700'
            }`}
          >
            {formatBRL(item.previsto_atualizado)}
          </td>

          {/* Arrecadado */}
          <td
            className={`px-4 py-3 text-right tabular-nums whitespace-nowrap ${
              logicalDepth === 0 ? 'text-gray-900' : 'text-gray-700'
            }`}
          >
            {formatBRL(item.arrecadado_periodo)}
          </td>

          {/* % Realização */}
          <td className="px-4 py-3 text-right whitespace-nowrap">
            <span
              className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium ${realizacaoBg(pct)}`}
            >
              {pct.toFixed(1)}%
            </span>
          </td>
        </tr>
        {isExpanded &&
          children.map((child) => (
            <TreeNode
              key={child.id}
              item={child}
              childrenMap={childrenMap}
            />
          ))}
      </>
    );
  }
);
