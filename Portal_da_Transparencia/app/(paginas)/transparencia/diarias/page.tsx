'use client';

import { useState, useCallback, useEffect } from 'react';
import ContentPage from '@/components/layout/ContentPage';
import FilterPanel, { FilterValues } from '@/components/ui/FilterPanel';
import DataTable from '@/components/ui/DataTable';
import { createBrowserClient, useAvailableYears } from '@/lib/supabase/client';
import { EMPRESAS } from '@/lib/empresas';
import { useTodayDate } from '@/lib/hooks/useTodayDate';
import {
  DollarSign,
  AlertCircle,
  MapPin,
  FileText,
  Info,
} from 'lucide-react';

const MESES = [
  { value: '01', label: 'Janeiro' }, { value: '02', label: 'Fevereiro' },
  { value: '03', label: 'Março' }, { value: '04', label: 'Abril' },
  { value: '05', label: 'Maio' }, { value: '06', label: 'Junho' },
  { value: '07', label: 'Julho' }, { value: '08', label: 'Agosto' },
  { value: '09', label: 'Setembro' }, { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' }, { value: '12', label: 'Dezembro' },
];

function formatBRL(value: number): string {
  return (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDateISO(dateStr: string | null): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  } catch {
    return dateStr;
  }
}

// ---------------------------------------------------------------------------
// Aba 1: Pagamentos de Diárias
// ---------------------------------------------------------------------------
function PagamentosDiariasTab({
  filters,
  filterKey,
  hasActiveFilters,
}: {
  filters: FilterValues;
  filterKey: string;
  hasActiveFilters: boolean;
}) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createBrowserClient();

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);

      let query = supabase
        .schema('transparencia')
        .from('diarias')
        .select('*');

      if (filters.entidade) {
        query = query.eq('empresa', filters.entidade);
      }

      if (filters.ano) {
        query = query.eq('ano', parseInt(filters.ano));
      }

      if (filters.mes) {
        const prefix = `${filters.ano || '2026'}-${filters.mes}`;
        query = query.like('data', `${prefix}%`);
      }

      if (filters.busca) {
        query = query.or(
          `favorecido.ilike.%${filters.busca}%,cargo.ilike.%${filters.busca}%,descricao.ilike.%${filters.busca}%`
        );
      }

      const { data: result, error } = await query
        .order('data', { ascending: false });

      if (cancelled) return;

      if (!error && result) {
        setData(result);
      } else {
        console.error('Error fetching diarias:', error);
        setData([]);
      }
      setLoading(false);
    }

    const timer = setTimeout(fetchData, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [filters.ano, filters.mes, filters.busca, filters.entidade, supabase]);

  const totalConcessoes = data.length;
  const valorTotal = data.reduce(
    (acc, curr) => acc + (Number(curr.valor) || 0) - (Number(curr.valor_anulado) || 0),
    0
  );
  const totalDiarias = data.reduce(
    (acc, curr) => acc + (Number(curr.quantidade) || 1),
    0
  );

  const columns = [
    {
      header: 'Beneficiário',
      accessor: 'favorecido',
      render: (val: string, row: any) => (
        <div className="max-w-[200px]">
          <p className="text-sm font-semibold text-gray-900">{val || '-'}</p>
          <p className="text-xs font-medium text-gray-500 mt-0.5 line-clamp-2" title={row.cargo}>
            {row.cargo || 'Cargo não informado'}
          </p>
        </div>
      ),
    },
    {
      header: 'Nº de Diárias',
      accessor: 'quantidade',
      render: (val: string) => (
        <span className="text-sm font-semibold text-gray-800 tabular-nums text-center block">
          {val || '1'}
        </span>
      ),
    },
    {
      header: 'Valor Total',
      accessor: 'valor',
      render: (val: number, row: any) => {
        const liquido =
          (Number(val) || 0) - (Number(row.valor_anulado) || 0);
        return (
          <div className="text-right">
            <span className="text-sm font-semibold text-gray-900 tabular-nums">
              {formatBRL(liquido)}
            </span>
          </div>
        );
      },
    },
    {
      header: 'Período do Afastamento',
      accessor: 'data',
      render: (val: string) => (
        <span className="text-sm text-gray-600 whitespace-nowrap">
          {formatDateISO(val)}
        </span>
      ),
    },
    {
      header: 'Motivo do Afastamento / Destino',
      accessor: 'descricao',
      render: (val: string) => (
        <div className="max-w-xs">
          <p className="text-sm text-gray-700 leading-relaxed line-clamp-3" title={val}>
            {val || '-'}
          </p>
        </div>
      ),
    },
  ];

  return (
    <div id="panel-pagamentos" role="tabpanel" aria-labelledby="tab-pagamentos">
      {/* Totalizer */}
      <div className="mt-4 bg-white border border-gray-100 rounded-2xl px-6 py-4 flex flex-wrap gap-6 items-center shadow-sm mb-4">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">
            Concessões
          </p>
          {loading ? (
            <div className="h-7 w-16 bg-gray-200 animate-pulse rounded mt-1" />
          ) : (
            <p className="text-xl font-semibold text-gray-800 tabular-nums">
              {totalConcessoes}
            </p>
          )}
        </div>
        <div className="w-px h-8 bg-gray-200 hidden sm:block" />
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">
            Total de Diárias
          </p>
          {loading ? (
            <div className="h-7 w-20 bg-gray-200 animate-pulse rounded mt-1" />
          ) : (
            <p className="text-xl font-semibold text-gray-800 tabular-nums">
              {totalDiarias}
            </p>
          )}
        </div>
        <div className="w-px h-8 bg-gray-200 hidden sm:block" />
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">
            Valor Total Pago
          </p>
          {loading ? (
            <div className="h-7 w-32 bg-gray-200 animate-pulse rounded mt-1" />
          ) : (
            <p className="text-xl font-semibold text-gray-900 tabular-nums">
              {formatBRL(valorTotal)}
            </p>
          )}
        </div>
      </div>

      {/* Aviso de Atualidade */}
      <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-3">
        <Info size={16} className="text-amber-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">
            Atualidade dos Dados
          </p>
          <p className="text-xs text-amber-700/80 mt-0.5">
            Os dados são atualizados periodicamente com defasagem máxima de 30 dias,
            conforme exigência do PNTP 2026 (Critério 7.1).
          </p>
        </div>
      </div>

      <DataTable
        title="Relação de Pagamentos de Diárias"
        columns={columns}
        data={data}
        exportable={true}
        loading={loading}
        paginationResetKey={filterKey}
        hasActiveFilters={hasActiveFilters}
        emptyMessage="Não há registro de pagamento de diárias no período informado."
        emptyFilteredMessage="Nenhuma diária encontrada para os filtros selecionados."
      />

      {/* Nota Legal */}
      <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 px-6 py-4">
        <p className="text-sm font-semibold text-blue-800 mb-1">Nota Legal</p>
        <p className="text-sm text-blue-800/80 leading-relaxed">
          A concessão de diárias e passagens possui caráter indenizatório e destina-se
          a cobrir despesas com hospedagem, alimentação e locomoção urbana do servidor
          que, a serviço, afastar-se da sede em caráter eventual ou transitório, conforme
          legislação municipal pertinente e normativas do TCE-PI e PNTP 2026 (Critério 7.1).
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Aba 2: Padrão de Valores (Critério 7.2)
// ---------------------------------------------------------------------------
function PadraoValoresTab() {
  return (
    <div id="panel-padrao" role="tabpanel" aria-labelledby="tab-padrao">
      {/* Descrição */}
      <div className="mt-4 mb-6 rounded-xl border border-blue-100 bg-blue-50 px-6 py-4">
        <p className="text-sm text-blue-800/80 leading-relaxed">
          Tabela com os valores pagos a título de diárias para servidores municipais,
          conforme legislação municipal vigente. Os valores variam conforme o destino
          e a natureza do afastamento.
        </p>
      </div>

      {/* Tabela de Padrão de Valores */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">
            Padrão de Valores de Diárias
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Valores por tipo de viagem, em conformidade com a legislação municipal.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-left font-semibold text-gray-700">
                  Tipo de Viagem
                </th>
                <th className="px-6 py-3 text-center font-semibold text-gray-700">
                  Carga Horária
                </th>
                <th className="px-6 py-3 text-right font-semibold text-gray-700">
                  Valor por Diária
                </th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">
                  Base Legal
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-blue-500 shrink-0" />
                    <span className="font-medium text-gray-900">
                      Dentro do Estado (PI)
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-center text-gray-600">Até 8h</td>
                <td className="px-6 py-4 text-right tabular-nums font-semibold text-gray-900">
                  R$ 120,00
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  Lei Municipal nº 001/2023
                </td>
              </tr>
              <tr className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-amber-500 shrink-0" />
                    <span className="font-medium text-gray-900">
                      Dentro do Estado (PI)
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-center text-gray-600">Acima de 8h</td>
                <td className="px-6 py-4 text-right tabular-nums font-semibold text-gray-900">
                  R$ 200,00
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  Lei Municipal nº 001/2023
                </td>
              </tr>
              <tr className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-orange-500 shrink-0" />
                    <span className="font-medium text-gray-900">
                      Fora do Estado
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-center text-gray-600">Até 8h</td>
                <td className="px-6 py-4 text-right tabular-nums font-semibold text-gray-900">
                  R$ 250,00
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  Lei Municipal nº 001/2023
                </td>
              </tr>
              <tr className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-orange-500 shrink-0" />
                    <span className="font-medium text-gray-900">
                      Fora do Estado
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-center text-gray-600">Acima de 8h</td>
                <td className="px-6 py-4 text-right tabular-nums font-semibold text-gray-900">
                  R$ 400,00
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  Lei Municipal nº 001/2023
                </td>
              </tr>
              {/* Linha de viagem internacional com aviso */}
              <tr className="border-t border-gray-100 bg-gray-50/50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle size={14} className="text-purple-500 shrink-0" />
                    <span className="font-medium text-gray-900">
                      Viagem Internacional
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-center text-gray-600">—</td>
                <td className="px-6 py-4 text-right tabular-nums text-purple-700 font-semibold">
                  NÃO PREVISTO
                </td>
                <td className="px-6 py-4 text-sm text-purple-600 font-medium">
                  Sem previsão legal municipal
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Aviso de Viagem Internacional */}
      <div className="mb-6 rounded-xl border border-purple-200 bg-purple-50 px-6 py-5">
        <div className="flex items-start gap-3">
          <AlertCircle size={18} className="text-purple-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-purple-800 mb-1">
              Viagens Internacionais
            </h3>
            <p className="text-sm text-purple-700/80 leading-relaxed">
              Informamos que a legislação municipal vigente não prevê o pagamento de
              diárias para viagens internacionais. Conforme determinação do PNTP 2026
              (Critério 7.2), esta informação é expressamente comunicada para fins de
              transparência pública.
            </p>
          </div>
        </div>
      </div>

      {/* Nota Legal */}
      <div className="rounded-xl border border-blue-100 bg-blue-50 px-6 py-4">
        <p className="text-sm font-semibold text-blue-800 mb-1">
          Base Legal — Critério 7.2
        </p>
        <p className="text-sm text-blue-800/80 leading-relaxed">
          Os valores e regras para concessão de diárias no âmbito do Poder Executivo
          Municipal estão estabelecidos na Lei Municipal nº 001/2023 (ou legislação
          específica que dispõe sobre a concessão de diárias e passagens). Para
          consultar a íntegra da legislação, acesse a seção de{' '}
          <a
            href="https://padremarcos.pi.gov.br/leis-normas"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 font-medium underline hover:text-blue-800"
          >
            Leis e Normas Municipais
          </a>
          .
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
export default function DiariasPage() {
  const today = useTodayDate();
  const [activeTab, setActiveTab] = useState<'pagamentos' | 'padrao_valores'>(
    'pagamentos'
  );
  const [filters, setFilters] = useState<FilterValues>({
    ano: '2026',
    mes: '',
    busca: '',
    entidade: '',
  });
  const { anos: ANOS, loading: anosLoading } = useAvailableYears(
    'diarias',
    filters.entidade || undefined
  );

  const handleChange = useCallback(
    (field: 'ano' | 'mes' | 'busca' | 'entidade', value: string) => {
      setFilters((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleClear = useCallback(() => {
    setFilters({ ano: '', mes: '', busca: '', entidade: '' });
  }, []);

  const filterKey = `${filters.ano}-${filters.mes}-${filters.busca}-${filters.entidade}`;
  const hasActiveFilters = !!(
    filters.ano ||
    filters.mes ||
    filters.busca ||
    filters.entidade
  );

  return (
    <ContentPage
      title="Diárias e Passagens"
      description="Consulte os pagamentos de diárias concedidas aos servidores municipais, incluindo beneficiário, valor, período, motivo e local de destino, além da tabela de padrão de valores praticados pelo município."
      breadcrumb={[
        { label: 'Portal da Transparência', href: '/' },
        { label: 'Diárias e Passagens' },
      ]}
      lastUpdate={today}
    >
      {/* Filter Panel — visível apenas na Aba 1 (Pagamentos) */}
      {activeTab === 'pagamentos' && (
        <FilterPanel
          anos={ANOS}
          meses={MESES}
          values={filters}
          onChange={handleChange}
          onClear={handleClear}
          anosLoading={anosLoading}
          empresas={EMPRESAS}
        />
      )}

      {/* Abas lado a lado */}
      <div
        className="mt-6 flex flex-wrap gap-1 border-b border-gray-200"
        role="tablist"
        aria-label="Seções de diárias"
      >
        <button
          onClick={() => setActiveTab('pagamentos')}
          role="tab"
          aria-selected={activeTab === 'pagamentos'}
          aria-controls="panel-pagamentos"
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'pagamentos'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <DollarSign size={16} aria-hidden="true" />
          Pagamentos de Diárias
        </button>
        <button
          onClick={() => setActiveTab('padrao_valores')}
          role="tab"
          aria-selected={activeTab === 'padrao_valores'}
          aria-controls="panel-padrao"
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'padrao_valores'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <FileText size={16} aria-hidden="true" />
          Padrão de Valores
        </button>
      </div>

      {/* Conteúdo das Abas */}
      {activeTab === 'pagamentos' && (
        <PagamentosDiariasTab
          filters={filters}
          filterKey={filterKey}
          hasActiveFilters={hasActiveFilters}
        />
      )}

      {activeTab === 'padrao_valores' && <PadraoValoresTab />}
    </ContentPage>
  );
}
