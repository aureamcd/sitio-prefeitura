import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Mapeamento de slugs para tabelas e colunas
const TABELA_MAP: Record<string, { tabela: string; colunas: string[]; nome: string }> = {
  despesas: {
    tabela: 'despesas',
    colunas: ['numero_empenho', 'data_empenho', 'credor_nome', 'credor_documento', 'empresa_nome', 'orgao_nome', 'funcao_nome', 'subfuncao_nome', 'natureza_codigo', 'fonte_nome', 'objeto', 'empenhado', 'liquidado', 'pago'],
    nome: 'despesas',
  },
  receitas: {
    tabela: 'receitas',
    colunas: ['codigo_contabil', 'descricao', 'nivel', 'previsto_inicial', 'previsto_atualizado', 'arrecadado_periodo', 'arrecadado_total'],
    nome: 'receitas',
  },
  renuncias: {
    tabela: 'renuncias_desoneracoes',
    colunas: ['especie', 'fundamentacao_legal', 'beneficiario', 'cpf_cnpj', 'valor_previsto', 'valor_realizado', 'exercicio'],
    nome: 'renuncias',
  },
  incentivos: {
    tabela: 'incentivos_cultura_esporte',
    colunas: ['projeto', 'area', 'beneficiario', 'cpf_cnpj', 'tipo_incentivo', 'valor_beneficio', 'fundamento_legal', 'ano'],
    nome: 'incentivos_cultura_esporte',
  },
  'despesas-extra': {
    tabela: 'despesas_extra_orcamentarias',
    colunas: ['codigo', 'nomenclatura', 'descricao', 'historico', 'numero_guia', 'data', 'pago', 'cnpj_inscricao'],
    nome: 'despesas_extra_orcamentarias',
  },
  'restos-pagar': {
    tabela: 'restos_pagar',
    colunas: ['codigo', 'descricao', 'empenhado', 'liquidado', 'pago'],
    nome: 'restos_a_pagar',
  },
  licitacoes: {
    tabela: 'licitacoes_v2',
    colunas: ['numero', 'modalidade', 'objeto', 'ano', 'situacao', 'data_abertura'],
    nome: 'licitacoes',
  },
  contratos: {
    tabela: 'contratos_v2',
    colunas: ['numero', 'contratado', 'cpf_cnpj', 'objeto', 'data_assinatura', 'data_inicio', 'data_fim', 'valor', 'situacao'],
    nome: 'contratos',
  },

  servidores: {
    tabela: 'servidores',
    colunas: ['nome', 'matricula', 'cargo', 'lotacao', 'situacao', 'carga_horaria', 'data_admissao', 'data_desligamento', 'ativo'],
    nome: 'servidores',
  },
  diarias: {
    tabela: 'diarias',
    colunas: ['favorecido', 'cargo', 'descricao', 'data', 'valor', 'valor_anulado', 'quantidade', 'empresa_nome'],
    nome: 'diarias',
  },
  obras: {
    tabela: 'obras',
    colunas: ['objeto', 'ano', 'situacao', 'empresa_responsavel', 'cnpj_empresa', 'localizacao', 'data_inicio', 'data_previsao_fim', 'valor_total', 'valor_executado', 'percentual_executado', 'contrato_numero'],
    nome: 'obras',
  },
  emendas: {
    tabela: 'cadastro_emendas',
    colunas: ['ano', 'numero_emenda', 'parlamentar', 'objeto', 'beneficiario', 'valor_previsto'],
    nome: 'emendas_parlamentares',
  },
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const slug = (await params).slug;

  const config = TABELA_MAP[slug];
  if (!config) {
    return new NextResponse('Tabela não encontrada', { status: 404 });
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Tenta buscar dados da tabela — se não existir, retorna CSV vazio
    const { data, error } = await supabase
      .schema('transparencia')
      .from(config.tabela)
      .select(config.colunas.join(','))
      .order('ano', { ascending: false })
      .limit(10000);

    // Se a tabela não existe ou está vazia, retorna CSV com cabeçalhos apenas
    const rows = (!error && data) ? data : [];

    // Gera CSV
    const headerRow = config.colunas.map((c) => `"${c}"`).join(';');
    const dataRows = rows.map((row: any) =>
      config.colunas.map((col) => {
        const val = row[col];
        if (val === null || val === undefined) return '""';
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(';')
    );
    const csv = `\uFEFF${headerRow}\n${dataRows.join('\n')}`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${config.nome}.csv"`,
      },
    });
  } catch (err) {
    console.error(`Erro ao exportar ${slug}:`, err);
    return new NextResponse('Erro ao gerar o arquivo', { status: 500 });
  }
}
