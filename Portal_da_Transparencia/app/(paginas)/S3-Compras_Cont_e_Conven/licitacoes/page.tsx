'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import ContentPage from '@/components/layout/ContentPage';
import FilterPanel, { FilterValues } from '@/components/ui/FilterPanel';
import DataTable from '@/components/ui/DataTable';
import { createBrowserClient, useAvailableYears } from '@/lib/supabase/client';
import { EMPRESAS } from '@/lib/empresas';
import {
  FileSearch,
  Info,
  Gavel,
  FileX,
  FileCheck,
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  FileText,
  Download,
  ShieldAlert,
} from 'lucide-react';
import DocumentListModal from '@/components/ui/DocumentListModal';

const MESES = [
  { value: '01', label: 'Janeiro' }, { value: '02', label: 'Fevereiro' },
  { value: '03', label: 'Março' },   { value: '04', label: 'Abril' },
  { value: '05', label: 'Maio' },    { value: '06', label: 'Junho' },
  { value: '07', label: 'Julho' },   { value: '08', label: 'Agosto' },
  { value: '09', label: 'Setembro' },{ value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },{ value: '12', label: 'Dezembro' },
];

const MODALIDADES = [
  { value: 'Pregão', label: 'Pregão' },
  { value: 'Concorrência', label: 'Concorrência' },
  { value: 'Tomada de Preços', label: 'Tomada de Preços' },
  { value: 'Convite', label: 'Convite' },
  { value: 'Concurso', label: 'Concurso' },
  { value: 'Leilão', label: 'Leilão' },
  { value: 'Chamada Pública', label: 'Chamada Pública' },
  { value: 'Dispensa', label: 'Dispensa' },
  { value: 'Inexigibilidade', label: 'Inexigibilidade' },
  { value: 'Adesão', label: 'Adesão' },
  { value: 'Credenciamento', label: 'Credenciamento' },
];

const SITUACOES = [
  { value: 'Finalizada', label: 'Finalizada' },
  { value: 'Homologada', label: 'Homologada' },
  { value: 'Aberta', label: 'Aberta' },
  { value: 'Em Andamento', label: 'Em Andamento' },
  { value: 'Encerrada', label: 'Encerrada' },
  { value: 'Divulgada', label: 'Divulgada' },
  { value: 'Não Finalizada', label: 'Não Finalizada' },
  { value: 'Cancelada', label: 'Cancelada' },
  { value: 'Fracassada', label: 'Fracassada' },
  { value: 'Deserta', label: 'Deserta' },
  { value: 'Suspensa', label: 'Suspensa' },
  { value: 'Revogada', label: 'Revogada' },
  { value: 'Anulada', label: 'Anulada' },
];

type TabType = 'licitacoes' | 'dispensa_inexigibilidade' | 'atas_srp' | 'sancionados';

function formatBRL(value: number): string {
  return (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDateISO(dateStr: string | null): string {
  if (!dateStr) return '-';
  try {
    // If already in DD/MM/YYYY format, return as-is
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return dateStr;
    // ISO format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss)
    const clean = dateStr.split('T')[0];
    const [year, month, day] = clean.split('-').map(Number);
    if (!year || !month || !day) return dateStr;
    return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
  } catch {
    return dateStr;
  }
}

const SITUACAO_BADGE: Record<string, { label: string; className: string }> = {
  finalizada: { label: 'Finalizada', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  aberta: { label: 'Aberta', className: 'bg-blue-100 text-blue-800 border-blue-200' },
  homologada: { label: 'Homologada', className: 'bg-green-100 text-green-800 border-green-200' },
  fracassada: { label: 'Fracassada', className: 'bg-red-100 text-red-800 border-red-200' },
  deserta: { label: 'Deserta', className: 'bg-red-100 text-red-800 border-red-200' },
  'em andamento': { label: 'Em Andamento', className: 'bg-amber-100 text-amber-800 border-amber-200' },
  encerrada: { label: 'Encerrada', className: 'bg-slate-100 text-slate-800 border-slate-200' },
  divulgada: { label: 'Divulgada', className: 'bg-sky-100 text-sky-800 border-sky-200' },
  'não finalizada': { label: 'Não Finalizada', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  cancelada: { label: 'Cancelada', className: 'bg-red-100 text-red-800 border-red-200' },
  suspensa: { label: 'Suspensa', className: 'bg-orange-100 text-orange-800 border-orange-200' },
  revogada: { label: 'Revogada', className: 'bg-rose-100 text-rose-800 border-rose-200' },
  anulada: { label: 'Anulada', className: 'bg-rose-100 text-rose-800 border-rose-200' },
};

function getSituacaoBadge(val: string) {
  if (!val) return { label: 'Desconhecido', className: 'bg-gray-100 text-gray-700 border-gray-200' };
  const lower = val.toLowerCase().trim();
  for (const key in SITUACAO_BADGE) {
    if (lower.includes(key)) return SITUACAO_BADGE[key];
  }
  return { label: val, className: 'bg-gray-100 text-gray-700 border-gray-200' };
}

// ─── Hook de busca ───
function useLicitacoesData(filters: FilterValues & { modalidade?: string; situacao?: string }, activeTab: TabType) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createBrowserClient();

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      setLoading(true);

      let query = supabase
        .schema('transparencia')
        .from('licitacoes_v2')
        .select('*, documentos:licitacoes_documentos(*)');

      // Filtro por aba
      if (activeTab === 'dispensa_inexigibilidade') {
        query = query.or(
          'modalidade.in.("Dispensa","Inexigibilidade"),situacao.ilike.*Dispensa*'
        );
      } else if (activeTab === 'atas_srp') {
        query = query.eq('carona', 'sim');
      }
      // Aba 'licitacoes' mostra TODOS os processos (sem excluir nada)

      // Filtros comuns
      if (filters.entidade) {
        query = query.eq('empresa', filters.entidade);
      }

      if (filters.ano) {
        query = query.eq('ano', parseInt(filters.ano, 10));
      }

      if (filters.mes) {
        const prefix = `${filters.ano || '2026'}-${filters.mes}`;
        query = query.ilike('data_abertura', `${prefix}%`);
      }

      if (filters.modalidade) {
        query = query.ilike('modalidade', `%${filters.modalidade}%`);
      }

      if (filters.situacao) {
        query = query.ilike('situacao', `%${filters.situacao}%`);
      }

      if (filters.busca) {
        const b = filters.busca.trim();
        query = query.or(
          `objeto.ilike.%${b}%,numero.ilike.%${b}%,modalidade.ilike.%${b}%,processo.ilike.%${b}%,empresa.ilike.%${b}%,empresa_nome.ilike.%${b}%`
        );
      }

      const { data: result, error } = await query
        .limit(5000)
        .order('ano', { ascending: false })
        .order('numero', { ascending: false });

      if (cancelled) return;

      let finalData = !error && result ? result : [];

      // Se há busca (ex: CNPJ ou Nome do Credor) e pode ter processos vinculados via contratos ou despesas
      if (filters.busca && filters.busca.trim().length >= 3) {
        const b = filters.busca.trim();
        try {
          // 1. Buscar contratos vinculados ao fornecedor/CNPJ
          const { data: contrs } = await supabase
            .schema('transparencia')
            .from('contratos_v2')
            .select('numero, objeto')
            .or(`contratado.ilike.%${b}%,cpf_cnpj.ilike.%${b}%`)
            .limit(100);

          // 2. Buscar despesas vinculadas ao credor/CNPJ
          const { data: desps } = await supabase
            .schema('transparencia')
            .from('despesas')
            .select('licitacao_numero, objeto')
            .or(`credor_nome.ilike.%${b}%,credor_documento.ilike.%${b}%`)
            .limit(100);

          const numsLic: string[] = [];
          const regexLic = /(?:preg[ãa]o|dispensa|inexigibilidade|concorr[êe]ncia|tomada|edital)[^\d]*(\d{1,4}[\/\.\-_]\d{4}|\d{1,4}\/\d{2})/i;

          (contrs || []).forEach(c => {
            if (c.numero) numsLic.push(c.numero.split('/')[0] + '/' + (c.numero.split('/')[1] || ''));
            const m = (c.objeto || '').match(regexLic);
            if (m && m[1]) numsLic.push(m[1]);
          });

          (desps || []).forEach(d => {
            if (d.licitacao_numero) numsLic.push(d.licitacao_numero);
            const m = (d.objeto || '').match(regexLic);
            if (m && m[1]) numsLic.push(m[1]);
          });

          const uniqNums = Array.from(new Set(numsLic.filter(Boolean)));
          if (uniqNums.length > 0) {
            const { data: extraLics } = await supabase
              .schema('transparencia')
              .from('licitacoes_v2')
              .select('*, documentos:licitacoes_documentos(*)')
              .in('numero', uniqNums);

            if (extraLics && extraLics.length > 0) {
              const existingIds = new Set(finalData.map(item => item.id));
              extraLics.forEach(lic => {
                if (!existingIds.has(lic.id)) {
                  finalData.push(lic);
                  existingIds.add(lic.id);
                }
              });
            }
          }
        } catch (e) {
          console.error('Erro na busca cruzada de licitações por CNPJ:', e);
        }
      }

      setData(finalData);
      setLoading(false);
    }

    const timer = setTimeout(fetchData, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [filters.ano, filters.mes, filters.busca, filters.entidade, filters.modalidade, filters.situacao, activeTab, supabase]);

  return { data, loading };
}

export default function LicitacoesPage() {
  const [activeTab, setActiveTab] = useState<TabType>('licitacoes');
  const [pcaData, setPcaData] = useState<any[]>([]);
  const [sancionadosData, setSancionadosData] = useState<any[]>([]);
  const [loadingPca, setLoadingPca] = useState(true);
  const [loadingSanc, setLoadingSanc] = useState(true);

  // Carregar PCA
  useEffect(() => {
    let cancelled = false;
    async function fetchPCA() {
      setLoadingPca(true);
      const { data } = await supabase
        .schema('transparencia')
        .from('plano_contratacoes_anual')
        .select('*')
        .order('ano', { ascending: false });
      if (!cancelled) { setPcaData(data || []); setLoadingPca(false); }
    }
    fetchPCA();
    return () => { cancelled = true; };
  }, []);

  // Carregar Sancionados
  useEffect(() => {
    let cancelled = false;
    async function fetchSanc() {
      setLoadingSanc(true);
      const { data } = await supabase
        .schema('transparencia')
        .from('sancionados')
        .select('*')
        .order('ano', { ascending: false });
      if (!cancelled) { setSancionadosData(data || []); setLoadingSanc(false); }
    }
    fetchSanc();
    return () => { cancelled = true; };
  }, []);

  // Agrupar sancionados por ano
  const sancionadosPorAno = useMemo(() => {
    const map: Record<number, any[]> = {};
    sancionadosData.forEach(item => {
      const ano = item.ano || 0;
      if (!map[ano]) map[ano] = [];
      map[ano].push(item);
    });
    return map;
  }, [sancionadosData]);

  const anosSancionados = [2023, 2024, 2025, 2026];
  const [filters, setFilters] = useState<FilterValues & { modalidade?: string; situacao?: string }>({
    ano: '',
    mes: '',
    busca: '',
    entidade: '',
    modalidade: '',
    situacao: '',
  });

  const { anos: ANOS, loading: anosLoading } = useAvailableYears('licitacoes_v2', filters.entidade || undefined);
  const supabase = createBrowserClient();
  const { data, loading } = useLicitacoesData(filters, activeTab);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalDocs, setModalDocs] = useState<any[]>([]);

  const handleOpenDocs = useCallback((title: string, docs: any[]) => {
    setModalTitle(title);
    setModalDocs(docs || []);
    setModalOpen(true);
  }, []);

  // Ler parâmetros da URL na montagem inicial (ex: vindo da tela de despesas)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const buscaParam = params.get('busca');
      if (buscaParam) {
        setFilters((prev) => ({ ...prev, busca: buscaParam }));
      }
    }
  }, []);

  // Se veio via link com busca e pedir para abrir documento (ou encontrar resultado exato), abre o modal ou PDF automaticamente
  useEffect(() => {
    if (!loading && data.length > 0 && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const buscaParam = params.get('busca');
      const abrirDocParam = params.get('abrirDoc');
      if (buscaParam && (abrirDocParam === 'true' || data.length === 1)) {
        const first = data[0];
        const docs = first.documentos && Array.isArray(first.documentos) && first.documentos.length > 0
          ? first.documentos
          : first.arquivo_url
          ? [{ id: '1', nome_arquivo: `Edital / Documento - ${first.numero || 'Anexo'}`, url_arquivo: first.arquivo_url, tipo_documento: 'Edital / Íntegra' }]
          : [];
        if (docs.length > 0) {
          handleOpenDocs(`Licitação ${first.numero || first.objeto?.substring(0, 30) || '-'}`, docs);
        }
      }
    }
  }, [loading, data, handleOpenDocs]);

  const handleChange = useCallback(
    (field: 'ano' | 'mes' | 'busca' | 'entidade' | 'modalidade' | 'situacao', value: string) => {
      setFilters((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleClear = useCallback(() => {
    setFilters({ ano: '', mes: '', busca: '', entidade: '', modalidade: '', situacao: '' });
  }, []);

  const filterKey = `${activeTab}-${filters.ano}-${filters.mes}-${filters.busca}-${filters.entidade}-${filters.modalidade}-${filters.situacao}`;
  const hasActiveFilters = !!(filters.ano || filters.mes || filters.busca || filters.entidade || filters.modalidade || filters.situacao);

  const totalEstimado = useMemo(() => data.reduce((s, r) => s + (Number(r.valor_estimado) || 0), 0), [data]);

  // ─── Colunas base (comuns a todas as abas) ───
  const colunasBase = useMemo(
    () => [
      {
        header: 'Nº / Modalidade',
        accessor: 'numero',
        render: (val: string, row: any) => {
          const num = val || row.proclic || row.nlicitacao || '-';
          return (
            <div>
              <p className="text-sm font-semibold text-gray-900">{num}</p>
              <p className="text-xs text-gray-500 mt-0.5">{row.modalidade || '—'}</p>
            </div>
          );
        },
      },
      {
        header: 'Objeto',
        accessor: 'objeto',
        render: (val: string) => (
          <span
            className="block max-w-[280px] text-sm text-gray-700"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
            title={val}
          >
            {val || '-'}
          </span>
        ),
      },
      {
        header: 'Data de Abertura',
        accessor: 'data_abertura',
        render: (val: string) => (
          <span className="text-sm text-gray-600 whitespace-nowrap">
            {formatDateISO(val)}
          </span>
        ),
      },
      {
        header: 'Valor (Estimado / Homologado)',
        accessor: 'valor_estimado',
        render: (val: number, row: any) => {
          const est = Number(val) || 0;
          const hom = Number(row.valor_homologado) || 0;
          return (
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-800 tabular-nums">
                {formatBRL(est)}
              </p>
              {hom > 0 && (
                <p className="text-xs text-emerald-600 tabular-nums mt-0.5">
                  Homologado: {formatBRL(hom)}
                </p>
              )}
            </div>
          );
        },
      },
      {
        header: 'Documentos',
        accessor: 'acoes',
        render: (_: any, row: any) => {
          const docs = row.documentos || [];
          const qtd = docs.length;
          return (
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleOpenDocs(`Licitação ${row.numero || '-'}`, docs)}
                disabled={qtd === 0}
                className={`inline-flex items-center gap-1.5 text-sm font-medium transition-colors ${
                  qtd > 0
                    ? 'text-blue-600 hover:text-blue-800'
                    : 'text-gray-400 cursor-not-allowed opacity-60'
                }`}
              >
                <FileSearch size={14} />
                {qtd > 0 ? `Anexos (${qtd})` : 'Sem anexos'}
              </button>

              {row.link_tce && (
                <a
                  href={row.link_tce}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100 transition-colors"
                  title="Abrir detalhes no mural de licitações do TCE"
                >
                  Ver no TCE
                </a>
              )}
            </div>
          );
        },
      },
    ],
    [handleOpenDocs]
  );

  // Coluna de Situação (só aparece fora da aba Dispensa/Inexigibilidade)
  const colunaSituacao = useMemo(
    () => ({
      header: 'Situação',
      accessor: 'situacao',
      render: (val: string) => {
        const badge = getSituacaoBadge(val);
        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badge.className}`}
          >
            {badge.label}
          </span>
        );
      },
    }),
    []
  );

  // Colunas dinâmicas por aba
  const columns = useMemo(() => {
    if (activeTab === 'dispensa_inexigibilidade') {
      // Sem coluna de Situação
      return colunasBase;
    }
    // Licitações e Atas SRP: com Situação
    return [
      ...colunasBase.slice(0, 4), // Nº/Modalidade, Objeto, Data, Valor
      colunaSituacao,
      ...colunasBase.slice(4), // Documentos
    ];
  }, [activeTab, colunasBase, colunaSituacao]);

  // ─── Info legal de cada aba ───
  const tabLegalInfo: Record<TabType, { title: string; desc: string }> = {
    licitacoes: {
      title: 'Nota Legal — Critérios 8.1, 8.2 e 8.3',
      desc: 'Os processos licitatórios são conduzidos em conformidade com a Lei nº 14.133/2021 (Nova Lei de Licitações e Contratos Administrativos) e normas do TCE-PI. Os editais, termos de referência, atas, pareceres e demais documentos estão disponíveis para consulta e download em PDF.',
    },
    dispensa_inexigibilidade: {
      title: 'Nota Legal — Critério 8.4',
      desc: 'Os processos de dispensa e inexigibilidade de licitação são disponibilizados conforme o art. 74 e 75 da Lei nº 14.133/2021, com a íntegra dos documentos que os fundamentam, incluindo o ato de ratificação e o parecer jurídico.',
    },
    atas_srp: {
      title: 'Nota Legal — Critério 8.5',
      desc: 'As atas de adesão a registros de preços (SRP) de outros órgãos/entidades, conhecidas como "caronas", são divulgadas com a íntegra dos documentos conforme exigido pelo PNTP 2026.',
    },
    sancionados: {
      title: 'Nota Legal — Critério 8.7',
      desc: 'A relação de licitantes e/ou contratados sancionados administrativamente pelo Poder ou órgão é divulgada conforme recomendação do PNTP 2026. Não havendo registros de sanções, esta declaração é atualizada anualmente.',
    },
  };

  return (
    <ContentPage
      showSearch={false}
      title="Licitações"
      description="Acompanhe os processos licitatórios, dispensas, inexigibilidades e atas de adesão a registros de preços."
      breadcrumb={[
        { label: 'Portal da Transparência', href: '/' },
        { label: 'Licitações' },
      ]}
    >
      <FilterPanel
        anos={ANOS}
        meses={MESES}
        values={filters}
        onChange={handleChange}
        onClear={handleClear}
        anosLoading={anosLoading}
        empresas={EMPRESAS}
      >
        {/* Filtro de Modalidade */}
        <div className="flex flex-col gap-1 sm:w-48">
          <label className="text-xs font-medium text-gray-600">Modalidade</label>
          <div className="relative">
            <select
              value={filters.modalidade || ''}
              onChange={(e) => handleChange('modalidade', e.target.value)}
              className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 appearance-none text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-all"
            >
              <option value="">Todas</option>
              {MODALIDADES.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Filtro de Situação */}
        <div className="flex flex-col gap-1 sm:w-44">
          <label className="text-xs font-medium text-gray-600">Situação</label>
          <div className="relative">
            <select
              value={filters.situacao || ''}
              onChange={(e) => handleChange('situacao', e.target.value)}
              className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 appearance-none text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-all"
            >
              <option value="">Todas</option>
              {SITUACOES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>
      </FilterPanel>

      {/* ═══ SEÇÃO PCA (8.6) ═══ */}
      <div className="mt-8 mb-6 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-sky-100 rounded-xl shrink-0">
            <FileText size={24} className="text-sky-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-gray-900">Plano de Contratações Anual (PCA)</h2>
            <p className="text-sm text-gray-600 mt-1">
              Critério 8.6 (Recomendado) — Planejamento anual de contratações do município.
            </p>

            {loadingPca ? (
              <div className="mt-3 h-16 bg-gray-100 animate-pulse rounded-xl" />
            ) : pcaData.length > 0 ? (
              <div className="mt-4 space-y-3">
                {pcaData.map((pca) => (
                  <div key={pca.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-sky-50 border border-sky-100 rounded-xl">
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-900">
                        PCA {pca.ano}
                      </p>
                      {pca.responsavel && (
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-gray-600">
                          <span><strong>Responsável:</strong> {pca.responsavel}{pca.cargo_responsavel ? ` (${pca.cargo_responsavel})` : ''}</span>
                          {pca.frequencia_atualizacao && <span><strong>Atualização:</strong> {pca.frequencia_atualizacao}</span>}
                          {pca.data_publicacao && <span><strong>Publicado em:</strong> {formatDateISO(pca.data_publicacao)}</span>}
                        </div>
                      )}
                      {!pca.responsavel && (
                        <p className="text-xs text-gray-500 mt-1">
                          {pca.data_publicacao ? `Publicado em ${formatDateISO(pca.data_publicacao)}` : ''}
                        </p>
                      )}
                    </div>
                    {pca.arquivo_url ? (
                      <a
                        href={pca.arquivo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-sky-200 rounded-xl text-sm font-semibold text-sky-700 hover:bg-sky-100 transition shrink-0"
                      >
                        <Download size={16} />
                        Baixar Planilha
                      </a>
                    ) : (
                      <p className="text-xs text-gray-400 italic">Arquivo não disponível</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-3 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                <p className="text-sm text-gray-600 italic">
                  O Plano de Contratações Anual deste exercício está em elaboração e será publicado assim que finalizado.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6">
        {/* ─── Tabs ─── */}
        <div className="flex flex-wrap gap-1 border-b border-gray-200" role="tablist" aria-label="Seções de licitações">
          <button
            onClick={() => setActiveTab('licitacoes')}
            role="tab"
            aria-selected={activeTab === 'licitacoes'}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'licitacoes' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Gavel size={16} />Licitações
          </button>
          <button
            onClick={() => setActiveTab('dispensa_inexigibilidade')}
            role="tab"
            aria-selected={activeTab === 'dispensa_inexigibilidade'}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'dispensa_inexigibilidade' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <FileX size={16} />Dispensa / Inexigibilidade
          </button>
          <button
            onClick={() => setActiveTab('atas_srp')}
            role="tab"
            aria-selected={activeTab === 'atas_srp'}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'atas_srp' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <FileCheck size={16} />Atas SRP (Caronas)
          </button>
          <button
            onClick={() => setActiveTab('sancionados')}
            role="tab"
            aria-selected={activeTab === 'sancionados'}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'sancionados' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <ShieldAlert size={16} />Licitantes Sancionados
          </button>
        </div>

        {/* Totalizadores */}
        <div className="mt-4 bg-white border border-gray-100 rounded-2xl px-6 py-4 flex flex-wrap gap-6 items-center shadow-sm mb-4">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">
              Total de Processos
            </p>
            {loading ? (
              <div className="h-7 w-16 bg-gray-200 animate-pulse rounded mt-1" />
            ) : (
              <p className="text-xl font-semibold text-gray-800 tabular-nums">
                {data.length}
              </p>
            )}
          </div>
          <div className="w-px h-8 bg-gray-200 hidden sm:block" />
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">
              Valor Total Estimado
            </p>
            {loading ? (
              <div className="h-7 w-32 bg-gray-200 animate-pulse rounded mt-1" />
            ) : (
              <p className="text-xl font-semibold text-gray-900 tabular-nums">
                {formatBRL(totalEstimado)}
              </p>
            )}
          </div>

        </div>

        {/* Aviso de documentos */}
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 px-5 py-3">
          <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-blue-800 uppercase tracking-wider">
              Documentos Anexados
            </p>
            <p className="text-xs text-blue-700/80 mt-0.5">
              Clique em "Ver Anexos" para visualizar e baixar Editais, Avisos, Homologações, Atas e demais documentos de cada processo.
            </p>
          </div>
        </div>

        {/* Tabela */}
        {activeTab === 'sancionados' ? (
          <div className="space-y-6">
            {/* Declaração de Inexistência com Checklist Anual */}
            <div className="bg-white border border-amber-200 rounded-2xl overflow-hidden">
              <div className="bg-amber-50 px-6 py-4 border-b border-amber-100">
                <div className="flex items-center gap-3">
                  <ClipboardList size={20} className="text-amber-700" />
                  <h3 className="text-sm font-black text-amber-900 uppercase tracking-wider">
                    Critério 8.7 — Checklist de Verificação Anual
                  </h3>
                </div>
              </div>
              <div className="p-6">
                <p className="text-sm text-gray-700 mb-5">
                  Marque abaixo para cada ano se o município <strong>verificou a inexistência</strong> 
                  de licitantes ou contratados sancionados administrativamente. 
                  Esta declaração serve como comprovante de transparência ativa para o PNTP 2026.
                </p>

                <div className="space-y-3">
                  {anosSancionados.map((ano) => {
                    const registros = sancionadosPorAno[ano] || [];
                    return (
                      <div key={ano} className="border border-gray-200 rounded-xl overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-3.5 bg-gray-50 border-b border-gray-100">
                          <div className="flex items-center gap-3">
                            <div className={`p-1.5 rounded-lg ${registros.length > 0 ? 'bg-red-100' : 'bg-green-100'}`}>
                              {registros.length > 0 ? (
                                <AlertTriangle size={16} className="text-red-600" />
                              ) : (
                                <CheckCircle2 size={16} className="text-green-600" />
                              )}
                            </div>
                            <span className="text-sm font-bold text-gray-900">{ano}</span>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                              registros.length > 0 
                                ? 'bg-red-100 text-red-700' 
                                : 'bg-green-100 text-green-700'
                            }`}>
                              {registros.length > 0 
                                ? `${registros.length} registro(s)` 
                                : 'Nenhum sancionado'}
                            </span>
                          </div>
                          {/* Status visual */}
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">
                              {registros.length > 0 
                                ? '✅ Verificado' 
                                : '✅ Inexistência confirmada'}
                            </span>
                          </div>
                        </div>

                        {/* Se tem registros, mostra a tabela */}
                        {registros.length > 0 && (
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-gray-100 bg-red-50/50">
                                  <th className="text-left px-4 py-2.5 text-xs font-bold text-gray-700 uppercase">Empresa</th>
                                  <th className="text-left px-4 py-2.5 text-xs font-bold text-gray-700 uppercase">CNPJ</th>
                                  <th className="text-left px-4 py-2.5 text-xs font-bold text-gray-700 uppercase">Tipo Sanção</th>
                                  <th className="text-left px-4 py-2.5 text-xs font-bold text-gray-700 uppercase">Período</th>
                                  <th className="text-left px-4 py-2.5 text-xs font-bold text-gray-700 uppercase">Motivo</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-50">
                                {registros.map((r) => (
                                  <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-4 py-3 font-medium text-gray-900">{r.empresa_nome}</td>
                                    <td className="px-4 py-3 text-gray-600">{r.cnpj || '—'}</td>
                                    <td className="px-4 py-3">
                                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200">
                                        {r.tipo_sancao}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600 text-xs">
                                      {r.data_inicio ? formatDateISO(r.data_inicio) : '—'}
                                      {r.data_fim ? ` até ${formatDateISO(r.data_fim)}` : ''}
                                    </td>
                                    <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate" title={r.motivo}>{r.motivo || '—'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {/* Se não tem registros, mostra mensagem */}
                        {registros.length === 0 && (
                          <div className="px-5 py-3">
                            <p className="text-xs text-gray-500 italic">
                              ✓ Não há licitantes ou contratados sancionados administrativamente no exercício de {ano}.
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Resumo */}
            <div className="bg-green-50 border border-green-200 rounded-xl px-6 py-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 size={18} className="text-green-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-green-900">
                    Declaração de Transparência Ativa
                  </p>
                  <p className="text-sm text-green-800 mt-1">
                    O Município de Padre Marcos declara, para os devidos fins de cumprimento do 
                    Programa Nacional de Transparência Pública (PNTP 2026), que realizou a verificação 
                    dos exercícios de {anosSancionados[0]} a {anosSancionados[anosSancionados.length - 1]} 
                    quanto à existência de licitantes ou contratados sancionados administrativamente. 
                    {sancionadosData.length === 0 
                      ? ' Não foram encontrados registros de sanções administrativas no período.'
                      : ` Foram encontrados ${sancionadosData.length} registro(s) de sanção(ões), listados acima.`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <DataTable
            title={
              activeTab === 'licitacoes' ? 'Processos Licitatórios' :
              activeTab === 'dispensa_inexigibilidade' ? 'Dispensas e Inexigibilidades' :
              'Atas de Adesão a Registros de Preços (SRP)'
            }
            columns={columns}
            data={data}
            exportable={true}
            loading={loading}
            paginationResetKey={filterKey}
            hasActiveFilters={hasActiveFilters}
          />
        )}

        {/* Nota Legal dinâmica */}
        <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 px-6 py-4">
          <p className="text-sm font-semibold text-blue-800 mb-1">
            {tabLegalInfo[activeTab].title}
          </p>
          <p className="text-sm text-blue-800/80 leading-relaxed">
            {tabLegalInfo[activeTab].desc}
          </p>
        </div>
      </div>

      <DocumentListModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalTitle}
        documentos={modalDocs}
      />
    </ContentPage>
  );
}
