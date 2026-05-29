'use client';

import { useState, useMemo, useCallback } from 'react';
import ContentPage from '@/components/layout/ContentPage';
import FilterPanel, { FilterValues } from '@/components/ui/FilterPanel';
import DataTable from '@/components/ui/DataTable';
import { useTodayDate } from '@/lib/hooks/useTodayDate';
import { useAvailableYears } from '@/lib/supabase/client';
import {
  FileText,
  FileWarning,
  AlertTriangle,
  Info,
  Scale,
  FileSearch,
  Download,
  ExternalLink,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Static data (será substituído por dados do banco futuramente)
// ---------------------------------------------------------------------------
const MOCK_DATA = [
  // ── Peças de Planejamento (Aba 1) ──
  {
    id: 1,
    ano: '2026',
    tipo: 'PPA - Plano Plurianual',
    categoria: 'planejamento',
    periodo: '2026-2029',
    descricao: 'Plano Plurianual do Município para o quadriênio 2026-2029, estabelecendo diretrizes, objetivos e metas da administração municipal.',
    publicacao: '31/12/2025',
    mes: '12',
    temArquivo: true,
  },
  {
    id: 2,
    ano: '2026',
    tipo: 'LDO - Lei de Diretrizes Orçamentárias',
    categoria: 'planejamento',
    periodo: 'Anual',
    descricao: 'Lei de Diretrizes Orçamentárias para o exercício de 2026, dispondo sobre as metas e prioridades da administração municipal.',
    publicacao: '30/06/2025',
    mes: '06',
    temArquivo: true,
  },
  {
    id: 3,
    ano: '2026',
    tipo: 'LOA - Lei Orçamentária Anual',
    categoria: 'planejamento',
    periodo: 'Anual',
    descricao: 'Estima as receitas e fixa as despesas da Administração Municipal para o exercício financeiro de 2026.',
    publicacao: '31/12/2025',
    mes: '12',
    temArquivo: true,
  },
  {
    id: 4,
    ano: '2026',
    tipo: 'Plano Estratégico Institucional',
    categoria: 'planejamento',
    periodo: '2026-2029',
    descricao: 'Documento com a visão de longo prazo, metas estratégicas e indicadores de desempenho da Prefeitura Municipal.',
    publicacao: '15/01/2026',
    mes: '01',
    temArquivo: true,
  },

  // ── Relatórios da LRF (Aba 2) ──
  {
    id: 5,
    ano: '2026',
    tipo: 'RGF - Relatório de Gestão Fiscal',
    categoria: 'lrf',
    periodo: '1º Quadrimestre',
    descricao: 'Demonstrativo das Despesas com Pessoal, Dívida Consolidada Líquida, Garantias de Valores e Operações de Crédito.',
    publicacao: '30/05/2026',
    mes: '05',
    temArquivo: true,
  },
  {
    id: 6,
    ano: '2026',
    tipo: 'RGF - Relatório de Gestão Fiscal',
    categoria: 'lrf',
    periodo: '2º Quadrimestre',
    descricao: 'Demonstrativo das Despesas com Pessoal, Dívida Consolidada Líquida, Garantias de Valores e Operações de Crédito.',
    publicacao: '30/09/2026',
    mes: '09',
    temArquivo: true,
  },
  {
    id: 7,
    ano: '2026',
    tipo: 'RREO - Relatório Resumido da Execução Orçamentária',
    categoria: 'lrf',
    periodo: '1º Bimestre',
    descricao: 'Balanço Orçamentário e demonstrativos de Receitas e Despesas Primárias e Nominais.',
    publicacao: '30/03/2026',
    mes: '03',
    temArquivo: true,
  },
  {
    id: 8,
    ano: '2026',
    tipo: 'RREO - Relatório Resumido da Execução Orçamentária',
    categoria: 'lrf',
    periodo: '2º Bimestre',
    descricao: 'Balanço Orçamentário e demonstrativos de Receitas e Despesas Primárias e Nominais.',
    publicacao: '30/05/2026',
    mes: '05',
    temArquivo: true,
  },
  {
    id: 9,
    ano: '2026',
    tipo: 'RREO - Relatório Resumido da Execução Orçamentária',
    categoria: 'lrf',
    periodo: '3º Bimestre',
    descricao: 'Balanço Orçamentário e demonstrativos de Receitas e Despesas Primárias e Nominais.',
    publicacao: '30/07/2026',
    mes: '07',
    temArquivo: true,
  },
  {
    id: 10,
    ano: '2026',
    tipo: 'RREO - Relatório Resumido da Execução Orçamentária',
    categoria: 'lrf',
    periodo: '4º Bimestre',
    descricao: 'Balanço Orçamentário e demonstrativos de Receitas e Despesas Primárias e Nominais.',
    publicacao: '30/09/2026',
    mes: '09',
    temArquivo: true,
  },
  {
    id: 11,
    ano: '2026',
    tipo: 'RREO - Relatório Resumido da Execução Orçamentária',
    categoria: 'lrf',
    periodo: '5º Bimestre',
    descricao: 'Balanço Orçamentário e demonstrativos de Receitas e Despesas Primárias e Nominais.',
    publicacao: '30/11/2026',
    mes: '11',
    temArquivo: true,
  },
  {
    id: 12,
    ano: '2026',
    tipo: 'RREO - Relatório Resumido da Execução Orçamentária',
    categoria: 'lrf',
    periodo: '6º Bimestre',
    descricao: 'Balanço Orçamentário e demonstrativos de Receitas e Despesas Primárias e Nominais.',
    publicacao: '30/01/2027',
    mes: '01',
    temArquivo: true,
  },

  // ── Prestação de Contas (Aba 3) ──
  {
    id: 13,
    ano: '2025',
    tipo: 'Balanço Geral / Prestação de Contas',
    categoria: 'prestacao',
    periodo: 'Anual',
    descricao: 'Demonstrações Contábeis Consolidadas do exercício financeiro de 2025: Balanço Orçamentário, Financeiro, Patrimonial e Demonstração das Variações Patrimoniais.',
    publicacao: '15/04/2026',
    mes: '04',
    temArquivo: true,
  },
  {
    id: 14,
    ano: '2025',
    tipo: 'Relatório de Gestão / Atividades',
    categoria: 'prestacao',
    periodo: 'Anual',
    descricao: 'Relatório consolidado elaborado pelo Prefeito demonstrando os resultados alcançados no exercício de 2025, metas cumpridas e ações executadas.',
    publicacao: '15/04/2026',
    mes: '04',
    temArquivo: true,
  },

  // ── Julgamento das Contas (Aba 4) ──
  {
    id: 15,
    ano: '2023',
    tipo: 'Parecer do Tribunal de Contas (TCE-PI)',
    categoria: 'julgamento',
    periodo: 'Exercício 2023',
    descricao: 'Parecer Prévio do Tribunal de Contas do Estado do Piauí sobre as contas anuais da Prefeitura Municipal referentes ao exercício de 2023.',
    publicacao: '15/06/2025',
    mes: '06',
    temArquivo: true,
  },
  {
    id: 16,
    ano: '2023',
    tipo: 'Julgamento pela Câmara Municipal',
    categoria: 'julgamento',
    periodo: 'Exercício 2023',
    descricao: 'Decreto Legislativo ou Ata da Câmara Municipal de Padre Marcos referente ao julgamento das contas do Prefeito relativas ao exercício de 2023.',
    publicacao: '30/08/2025',
    mes: '08',
    temArquivo: true,
  },
  {
    id: 17,
    ano: '2022',
    tipo: 'Parecer do Tribunal de Contas (TCE-PI)',
    categoria: 'julgamento',
    periodo: 'Exercício 2022',
    descricao: 'Parecer Prévio do Tribunal de Contas do Estado do Piauí sobre as contas anuais da Prefeitura Municipal referentes ao exercício de 2022.',
    publicacao: '10/04/2024',
    mes: '04',
    temArquivo: true,
  },
  {
    id: 18,
    ano: '2022',
    tipo: 'Julgamento pela Câmara Municipal',
    categoria: 'julgamento',
    periodo: 'Exercício 2022',
    descricao: 'Decreto Legislativo ou Ata da Câmara Municipal de Padre Marcos referente ao julgamento das contas do Prefeito relativas ao exercício de 2022.',
    publicacao: '20/06/2024',
    mes: '06',
    temArquivo: true,
  },
];

const MESES = [
  { value: '01', label: 'Janeiro' }, { value: '02', label: 'Fevereiro' },
  { value: '03', label: 'Março' },   { value: '04', label: 'Abril' },
  { value: '05', label: 'Maio' },    { value: '06', label: 'Junho' },
  { value: '07', label: 'Julho' },   { value: '08', label: 'Agosto' },
  { value: '09', label: 'Setembro' },{ value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },{ value: '12', label: 'Dezembro' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function normalize(str: string): string {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function getTipoBadge(tipo: string): { label: string; className: string } {
  if (tipo.startsWith('PPA')) return { label: 'PPA', className: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
  if (tipo.startsWith('LDO')) return { label: 'LDO', className: 'bg-violet-50 text-violet-700 border-violet-200' };
  if (tipo.startsWith('LOA')) return { label: 'LOA', className: 'bg-purple-50 text-purple-700 border-purple-200' };
  if (tipo.startsWith('Plano Estratégico')) return { label: 'Plano Estratégico', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  if (tipo.startsWith('RGF')) return { label: 'RGF', className: 'bg-amber-50 text-amber-700 border-amber-200' };
  if (tipo.startsWith('RREO')) return { label: 'RREO', className: 'bg-blue-50 text-blue-700 border-blue-200' };
  if (tipo.startsWith('Balanço')) return { label: 'Balanço Geral', className: 'bg-rose-50 text-rose-700 border-rose-200' };
  if (tipo.startsWith('Relatório de Gestão')) return { label: 'Rel. Gestão', className: 'bg-teal-50 text-teal-700 border-teal-200' };
  if (tipo.startsWith('Parecer')) return { label: 'Parecer TCE', className: 'bg-sky-50 text-sky-700 border-sky-200' };
  if (tipo.startsWith('Julgamento')) return { label: 'Julgamento Câmara', className: 'bg-orange-50 text-orange-700 border-orange-200' };
  return { label: tipo.slice(0, 20), className: 'bg-gray-50 text-gray-700 border-gray-200' };
}

// ---------------------------------------------------------------------------
// Column builder
// ---------------------------------------------------------------------------
function buildColumns() {
  return [
    {
      header: 'Ano / Período',
      accessor: 'periodo',
      render: (val: string, row: any) => (
        <div>
          <p className="text-sm font-semibold text-gray-900">{row.ano}</p>
          <p className="text-xs font-medium text-gray-500 mt-0.5">{val}</p>
        </div>
      ),
    },
    {
      header: 'Tipo de Documento',
      accessor: 'tipo',
      render: (val: string) => {
        const badge = getTipoBadge(val);
        return (
          <span className={`inline-flex px-2 py-1 rounded border text-xs font-semibold tracking-wide ${badge.className}`}>
            {badge.label}
          </span>
        );
      },
    },
    {
      header: 'Descrição',
      accessor: 'descricao',
      render: (val: string) => (
        <div className="max-w-md">
          <p className="text-sm text-gray-700 leading-relaxed line-clamp-2" title={val}>
            {val}
          </p>
        </div>
      ),
    },
    {
      header: 'Data de Publicação',
      accessor: 'publicacao',
      render: (val: string) => (
        <span className="text-sm text-gray-600 whitespace-nowrap">{val}</span>
      ),
    },
    {
      header: 'Documento',
      accessor: 'acoes',
      render: (_: any, row: any) => (
        <div className="flex items-center gap-2">
          {row.temArquivo ? (
            <a
              href="#"
              className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
              onClick={(e) => {
                e.preventDefault();
                // TODO: integrar com link real do arquivo no R2/Supabase
              }}
            >
              <FileSearch size={14} />
              Baixar PDF
            </a>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-gray-400 text-sm cursor-not-allowed">
              <Download size={14} />
              Indisponível
            </span>
          )}
        </div>
      ),
    },
  ];
}

// ---------------------------------------------------------------------------
// Alerta de 2025: PDF Pesquisável
// ---------------------------------------------------------------------------
function AlertaPdfPesquisavel() {
  return (
    <div className="mb-4 rounded-xl border-2 border-red-200 bg-red-50/80 px-6 py-4">
      <div className="flex items-start gap-3">
        <AlertTriangle size={20} className="text-red-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-red-800 mb-1">
            🚨 Atenção! Erro de 2025 — PDFs Pesquisáveis Obrigatórios
          </p>
          <p className="text-sm text-red-700/80 leading-relaxed">
            Na avaliação do PNTP 2025, a Prefeitura foi <strong className="text-red-800">reprovada</strong> porque
            publicou PDFs escaneados como imagem (não pesquisáveis). A regra é <strong className="text-red-800">rígida</strong>:
            todos os arquivos de Balanço Geral e Relatório de Gestão devem ser <strong className="text-red-800">PDFs
            pesquisáveis</strong> — aqueles em que é possível selecionar e copiar o texto com o mouse.
            PDFs escaneados como imagem serão automaticamente zerados na avaliação de 2026.
          </p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Aba 1: Peças de Planejamento Orçamentário
// ---------------------------------------------------------------------------
function PlanejamentoTab({
  filters,
  filterKey,
  hasActiveFilters,
}: {
  filters: FilterValues;
  filterKey: string;
  hasActiveFilters: boolean;
}) {
  const filteredData = useMemo(() => {
    return MOCK_DATA.filter((item) => {
      if (item.categoria !== 'planejamento') return false;
      if (filters.ano && item.ano !== filters.ano) return false;
      if (filters.mes && item.mes !== filters.mes) return false;
      if (filters.busca) {
        const term = normalize(filters.busca);
        return (
          normalize(item.tipo).includes(term) ||
          normalize(item.descricao).includes(term)
        );
      }
      return true;
    });
  }, [filters]);

  const columns = useMemo(() => buildColumns(), []);

  return (
    <div id="panel-planejamento" role="tabpanel" aria-labelledby="tab-planejamento">
      {/* Aviso crítico - seção específica */}
      <div className="mt-4 mb-4 rounded-xl border-2 border-amber-200 bg-amber-50/80 px-6 py-4">
        <div className="flex items-start gap-3">
          <FileWarning size={20} className="text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-800 mb-1">
              ⚠️ Seção Específica para Peças de Planejamento — Critérios 11.7 a 11.10
            </p>
            <p className="text-sm text-amber-700/80 leading-relaxed">
              As Leis Orçamentárias (PPA, LDO e LOA) e o Plano Estratégico Institucional
              <strong className="text-amber-800"> devem estar nesta seção específica</strong> do portal.
              Se estes documentos estiverem dispersos apenas na aba geral de "Legislação",
              o critério poderá ser reprovado na avaliação do PNTP 2026, conforme ocorreu com
              outros municípios em 2025.
            </p>
          </div>
        </div>
      </div>

      <DataTable
        title="Peças de Planejamento Orçamentário"
        columns={columns}
        data={filteredData}
        exportable={true}
        paginationResetKey={filterKey}
        hasActiveFilters={hasActiveFilters}
        caption="PPA, LDO, LOA e Plano Estratégico Institucional"
      />

      <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 px-6 py-4">
        <p className="text-sm font-semibold text-blue-800 mb-1">
          Base Legal — Critérios 11.7, 11.8, 11.9 e 11.10
        </p>
        <p className="text-sm text-blue-800/80 leading-relaxed">
          A publicação do PPA, LDO, LOA e Plano Estratégico Institucional atende ao disposto
          na Constituição Federal (Arts. 165 a 169), na Lei de Responsabilidade Fiscal
          (LC nº 101/2000) e na Lei de Transparência (LC nº 131/2009). Os documentos devem
          estar disponíveis em formato PDF pesquisável, com seus respectivos anexos legais.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Aba 2: Relatórios da LRF
// ---------------------------------------------------------------------------
function LrfTab({
  filters,
  filterKey,
  hasActiveFilters,
}: {
  filters: FilterValues;
  filterKey: string;
  hasActiveFilters: boolean;
}) {
  const filteredData = useMemo(() => {
    return MOCK_DATA.filter((item) => {
      if (item.categoria !== 'lrf') return false;
      if (filters.ano && item.ano !== filters.ano) return false;
      if (filters.mes && item.mes !== filters.mes) return false;
      if (filters.busca) {
        const term = normalize(filters.busca);
        return (
          normalize(item.tipo).includes(term) ||
          normalize(item.descricao).includes(term)
        );
      }
      return true;
    });
  }, [filters]);

  const columns = useMemo(() => buildColumns(), []);

  // Estatísticas
  const rgfCount = filteredData.filter((r) => r.tipo.startsWith('RGF')).length;
  const rreoCount = filteredData.filter((r) => r.tipo.startsWith('RREO')).length;

  return (
    <div id="panel-lrf" role="tabpanel" aria-labelledby="tab-lrf">
      {/* Alerta sobre RGF */}
      <div className="mt-4 mb-4 rounded-xl border-2 border-red-200 bg-red-50/80 px-6 py-4">
        <div className="flex items-start gap-3">
          <AlertTriangle size={20} className="text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-red-800 mb-1">
              🚨 Erro de 2025 — Seção Específica do RGF
            </p>
            <p className="text-sm text-red-700/80 leading-relaxed">
              Na avaliação do PNTP 2025, a Prefeitura foi <strong className="text-red-800">reprovada</strong> no
              item do RGF. O Relatório de Gestão Fiscal <strong className="text-red-800">deve ter uma seção
              específica</strong> no portal (podendo estar em "publicações" ou "demonstrativos fiscais"),
              mas <strong className="text-red-800">não pode</strong> ficar escondido no meio de outras informações
              contábeis genéricas. Esta aba atende a esse requisito.
            </p>
          </div>
        </div>
      </div>

      {/* Totalizer */}
      <div className="bg-white border border-gray-100 rounded-2xl px-6 py-4 flex flex-wrap gap-6 items-center shadow-sm mb-4">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">
            Total de Relatórios
          </p>
          <p className="text-xl font-semibold text-gray-800 tabular-nums">{filteredData.length}</p>
        </div>
        <div className="w-px h-8 bg-gray-200 hidden sm:block" />
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">RGF</p>
          <p className="text-xl font-semibold text-amber-600 tabular-nums">{rgfCount}</p>
        </div>
        <div className="w-px h-8 bg-gray-200 hidden sm:block" />
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">RREO</p>
          <p className="text-xl font-semibold text-blue-600 tabular-nums">{rreoCount}</p>
        </div>
      </div>

      <DataTable
        title="Relatórios da Lei de Responsabilidade Fiscal"
        columns={columns}
        data={filteredData}
        exportable={true}
        paginationResetKey={filterKey}
        hasActiveFilters={hasActiveFilters}
        caption="RGF (Relatório de Gestão Fiscal) e RREO (Relatório Resumido da Execução Orçamentária)"
      />

      <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 px-6 py-4">
        <p className="text-sm font-semibold text-blue-800 mb-1">
          Base Legal — Critérios 11.5 e 11.6
        </p>
        <p className="text-sm text-blue-800/80 leading-relaxed">
          A publicação do RGF e RREO atende às exigências da Lei de Responsabilidade Fiscal
          (LC nº 101/2000, Arts. 52 a 55), com periodicidade quadrimestral (RGF) e bimestral
          (RREO), garantindo o controle social sobre a gestão fiscal e a execução orçamentária
          do Município. Os relatórios devem conter todos os demonstrativos exigidos pela STN.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Aba 3: Prestação de Contas Anual e Gestão
// ---------------------------------------------------------------------------
function PrestacaoContasTab({
  filters,
  filterKey,
  hasActiveFilters,
}: {
  filters: FilterValues;
  filterKey: string;
  hasActiveFilters: boolean;
}) {
  const filteredData = useMemo(() => {
    return MOCK_DATA.filter((item) => {
      if (item.categoria !== 'prestacao') return false;
      if (filters.ano && item.ano !== filters.ano) return false;
      if (filters.mes && item.mes !== filters.mes) return false;
      if (filters.busca) {
        const term = normalize(filters.busca);
        return (
          normalize(item.tipo).includes(term) ||
          normalize(item.descricao).includes(term)
        );
      }
      return true;
    });
  }, [filters]);

  const columns = useMemo(() => buildColumns(), []);

  return (
    <div id="panel-prestacao" role="tabpanel" aria-labelledby="tab-prestacao">
      {/* Alerta crítico - PDF Pesquisável */}
      <div className="mt-4 mb-4">
        <AlertaPdfPesquisavel />
      </div>

      {/* Descrição */}
      <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50 px-6 py-4">
        <div className="flex items-start gap-3">
          <Info size={18} className="text-blue-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-800 mb-1">
              Prestação de Contas Anual e Relatório de Gestão — Critérios 11.1 e 11.2
            </p>
            <p className="text-sm text-blue-800/80 leading-relaxed">
              Esta seção contém o Balanço Geral do exercício anterior (com Balanço Orçamentário,
              Financeiro, Patrimonial e Demonstração das Variações Patrimoniais) e o Relatório
              de Gestão/Atividades elaborado pelo Prefeito, demonstrando os resultados alcançados.
            </p>
          </div>
        </div>
      </div>

      <DataTable
        title="Prestação de Contas e Gestão"
        columns={columns}
        data={filteredData}
        exportable={true}
        paginationResetKey={filterKey}
        hasActiveFilters={hasActiveFilters}
      />

      <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 px-6 py-4">
        <p className="text-sm font-semibold text-blue-800 mb-1">
          Base Legal — Critérios 11.1 e 11.2
        </p>
        <p className="text-sm text-blue-800/80 leading-relaxed">
          A prestação de contas anual atende ao Art. 84 da Lei nº 4.320/1964, ao Art. 48 da
          LC nº 101/2000 (LRF) e à Instrução Normativa do TCE-PI. O Relatório de Gestão deve
          demonstrar os resultados alcançados com a execução orçamentária, financeira e
          patrimonial. <strong className="text-blue-800">Todos os PDFs devem ser pesquisáveis (OCR)</strong>,
          nunca imagens escaneadas, sob pena de reprovação no PNTP.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Aba 4: Julgamento das Contas
// ---------------------------------------------------------------------------
function JulgamentoContasTab({
  filters,
  filterKey,
  hasActiveFilters,
}: {
  filters: FilterValues;
  filterKey: string;
  hasActiveFilters: boolean;
}) {
  const filteredData = useMemo(() => {
    return MOCK_DATA.filter((item) => {
      if (item.categoria !== 'julgamento') return false;
      if (filters.ano && item.ano !== filters.ano) return false;
      if (filters.mes && item.mes !== filters.mes) return false;
      if (filters.busca) {
        const term = normalize(filters.busca);
        return (
          normalize(item.tipo).includes(term) ||
          normalize(item.descricao).includes(term)
        );
      }
      return true;
    });
  }, [filters]);

  const columns = useMemo(
    () => [
      {
        header: 'Ano / Exercício',
        accessor: 'periodo',
        render: (val: string, row: any) => (
          <div>
            <p className="text-sm font-semibold text-gray-900">{row.ano}</p>
            <p className="text-xs font-medium text-gray-500 mt-0.5">{val}</p>
          </div>
        ),
      },
      {
        header: 'Tipo',
        accessor: 'tipo',
        render: (val: string) => {
          const badge = getTipoBadge(val);
          return (
            <span className={`inline-flex px-2 py-1 rounded border text-xs font-semibold tracking-wide ${badge.className}`}>
              {badge.label}
            </span>
          );
        },
      },
      {
        header: 'Descrição',
        accessor: 'descricao',
        render: (val: string) => (
          <div className="max-w-md">
            <p className="text-sm text-gray-700 leading-relaxed line-clamp-2" title={val}>
              {val}
            </p>
          </div>
        ),
      },
      {
        header: 'Data',
        accessor: 'publicacao',
        render: (val: string) => (
          <span className="text-sm text-gray-600 whitespace-nowrap">{val}</span>
        ),
      },
      {
        header: 'Documento',
        accessor: 'acoes',
        render: (_: any, row: any) => (
          <div className="flex items-center gap-2">
            {row.tipo.startsWith('Parecer') && (
              <a
                href="#"
                className="inline-flex items-center gap-1.5 text-sky-600 hover:text-sky-800 text-sm font-medium transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  // TODO: link para consulta no site do TCE-PI
                }}
              >
                <ExternalLink size={14} />
                Consultar TCE
              </a>
            )}
            {row.tipo.startsWith('Julgamento') && (
              <a
                href="#"
                className="inline-flex items-center gap-1.5 text-orange-600 hover:text-orange-800 text-sm font-medium transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  // TODO: link para o decreto legislativo
                }}
              >
                <FileSearch size={14} />
                Baixar PDF
              </a>
            )}
          </div>
        ),
      },
    ],
    []
  );

  // Agrupa por ano
  const porAno = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const item of filteredData) {
      if (!map.has(item.ano)) map.set(item.ano, []);
      map.get(item.ano)!.push(item);
    }
    return Array.from(map.entries()).sort(([a], [b]) => Number(b) - Number(a));
  }, [filteredData]);

  return (
    <div id="panel-julgamento" role="tabpanel" aria-labelledby="tab-julgamento">
      {/* Descrição */}
      <div className="mt-4 mb-4 rounded-xl border border-blue-100 bg-blue-50 px-6 py-4">
        <div className="flex items-start gap-3">
          <Scale size={18} className="text-blue-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-800 mb-1">
              Julgamento das Contas — Critérios 11.3 e 11.4
            </p>
            <p className="text-sm text-blue-800/80 leading-relaxed">
              Esta seção reúne o Parecer Prévio do Tribunal de Contas do Estado do Piauí (TCE-PI)
              sobre as contas anuais do Prefeito (íntegra da decisão) e o ato de julgamento pela
              Câmara Municipal (Decreto Legislativo ou Ata), demonstrando o exercício do controle
              externo sobre a gestão municipal.
            </p>
          </div>
        </div>
      </div>

      {/* Timeline visual */}
      {!hasActiveFilters && filteredData.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">
            Linha do Tempo — Julgamentos por Exercício
          </h3>
          <div className="space-y-4">
            {porAno.map(([ano, items]) => {
              const temTCE = items.some((i) => i.tipo.startsWith('Parecer'));
              const temCamara = items.some((i) => i.tipo.startsWith('Julgamento'));
              return (
                <div key={ano} className="flex items-start gap-4 bg-white border border-gray-100 rounded-xl px-5 py-4 shadow-sm">
                  <div className="flex-shrink-0 w-16 text-center">
                    <p className="text-lg font-black text-gray-800">{ano}</p>
                  </div>
                  <div className="flex-1 flex flex-wrap gap-3">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold ${
                      temTCE
                        ? 'bg-green-50 border-green-200 text-green-700'
                        : 'bg-gray-50 border-gray-200 text-gray-500'
                    }`}>
                      {temTCE ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                      Parecer TCE-PI
                    </div>
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold ${
                      temCamara
                        ? 'bg-green-50 border-green-200 text-green-700'
                        : 'bg-gray-50 border-gray-200 text-gray-500'
                    }`}>
                      {temCamara ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                      Julgamento Câmara
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <DataTable
        title="Julgamento das Contas Municipais"
        columns={columns}
        data={filteredData}
        exportable={true}
        paginationResetKey={filterKey}
        hasActiveFilters={hasActiveFilters}
      />

      <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 px-6 py-4">
        <p className="text-sm font-semibold text-blue-800 mb-1">
          Base Legal — Critérios 11.3 e 11.4
        </p>
        <p className="text-sm text-blue-800/80 leading-relaxed">
          O Parecer Prévio do TCE-PI sobre as contas anuais do Prefeito e o julgamento pela
          Câmara Municipal são exigidos pelo Art. 31, §1º e §2º da Constituição Federal e
          pelo Art. 49 da Lei de Responsabilidade Fiscal (LC nº 101/2000). A publicação da
          íntegra dos documentos (e não apenas resumos) atende às determinações do PNTP 2026.
          É aceito link direto para consulta no site do TCE-PI em substituição ao PDF.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
export default function RelatoriosPage() {
  const { anos: ANOS } = useAvailableYears('relatorios');
  const today = useTodayDate();
  const [activeTab, setActiveTab] = useState<'planejamento' | 'lrf' | 'prestacao' | 'julgamento'>('planejamento');
  const [filters, setFilters] = useState<FilterValues>({ ano: '', mes: '', busca: '', entidade: '' });

  const handleChange = useCallback((field: 'ano' | 'mes' | 'busca' | 'entidade', value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleClear = useCallback(() => {
    setFilters({ ano: '', mes: '', busca: '', entidade: '' });
  }, []);

  const filterKey = `${filters.ano}-${filters.mes}-${filters.busca}`;
  const hasActiveFilters = !!(filters.ano || filters.mes || filters.busca);

  return (
    <ContentPage
      title="Planejamento e Prestação de Contas"
      description="Consulte as peças de planejamento orçamentário (PPA, LDO, LOA), relatórios da LRF (RGF, RREO), prestação de contas anual e julgamento das contas municipais pelo TCE-PI e Câmara."
      breadcrumb={[
        { label: 'Portal da Transparência', href: '/' },
        { label: 'Planejamento e Prestação de Contas' },
      ]}
      lastUpdate={today}
    >
      <FilterPanel
        anos={ANOS}
        meses={MESES}
        values={filters}
        onChange={handleChange}
        onClear={handleClear}
      />

      {/* Abas lado a lado */}
      <div
        className="mt-6 flex flex-wrap gap-1 border-b border-gray-200"
        role="tablist"
        aria-label="Seções de planejamento e contas"
      >
        <button
          onClick={() => setActiveTab('planejamento')}
          role="tab"
          aria-selected={activeTab === 'planejamento'}
          aria-controls="panel-planejamento"
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
            activeTab === 'planejamento'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <FileText size={16} aria-hidden="true" />
          Peças de Planejamento
        </button>
        <button
          onClick={() => setActiveTab('lrf')}
          role="tab"
          aria-selected={activeTab === 'lrf'}
          aria-controls="panel-lrf"
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
            activeTab === 'lrf'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <FileWarning size={16} aria-hidden="true" />
          Relatórios LRF
        </button>
        <button
          onClick={() => setActiveTab('prestacao')}
          role="tab"
          aria-selected={activeTab === 'prestacao'}
          aria-controls="panel-prestacao"
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
            activeTab === 'prestacao'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <AlertTriangle size={16} aria-hidden="true" />
          Prestação de Contas
        </button>
        <button
          onClick={() => setActiveTab('julgamento')}
          role="tab"
          aria-selected={activeTab === 'julgamento'}
          aria-controls="panel-julgamento"
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
            activeTab === 'julgamento'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <Scale size={16} aria-hidden="true" />
          Julgamento das Contas
        </button>
      </div>

      {/* Conteúdo das Abas */}
      {activeTab === 'planejamento' && (
        <PlanejamentoTab
          filters={filters}
          filterKey={filterKey}
          hasActiveFilters={hasActiveFilters}
        />
      )}

      {activeTab === 'lrf' && (
        <LrfTab
          filters={filters}
          filterKey={filterKey}
          hasActiveFilters={hasActiveFilters}
        />
      )}

      {activeTab === 'prestacao' && (
        <PrestacaoContasTab
          filters={filters}
          filterKey={filterKey}
          hasActiveFilters={hasActiveFilters}
        />
      )}

      {activeTab === 'julgamento' && (
        <JulgamentoContasTab
          filters={filters}
          filterKey={filterKey}
          hasActiveFilters={hasActiveFilters}
        />
      )}
    </ContentPage>
  );
}
