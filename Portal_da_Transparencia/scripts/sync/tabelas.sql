create table transparencia.despesas_detalhes (
  id uuid not null default gen_random_uuid (),
  empresa character varying(10) null,
  empresa_nome text null,
  despesa_id uuid null,
  pkemp character varying(200) null,
  detalhes jsonb null,
  itens jsonb null,
  pagamentos jsonb null,
  notas_fiscais jsonb null,
  created_at timestamp with time zone null default now(),
  constraint despesas_detalhes_pkey primary key (id),
  constraint despesas_detalhes_despesa_id_fkey foreign KEY (despesa_id) references transparencia.despesas (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_despesas_detalhes_pkemp on transparencia.despesas_detalhes using btree (pkemp) TABLESPACE pg_default;

create index IF not exists idx_despesas_detalhes_despesa on transparencia.despesas_detalhes using btree (despesa_id) TABLESPACE pg_default;

create table transparencia.despesas (
  id uuid not null default gen_random_uuid (),
  empresa character varying(10) null,
  empresa_nome text null,
  ano integer not null,
  mes integer null,
  pkemp character varying(200) null,
  codigo character varying(200) null,
  tipo_empenho character varying(20) null,
  numero_empenho character varying(200) null,
  data_empenho date null,
  fornecedor_codigo character varying(200) null,
  fornecedor_nome text null,
  fornecedor_cpf_cnpj character varying(30) null,
  orgao_codigo character varying(100) null,
  orgao_nome text null,
  unidade_codigo character varying(100) null,
  unidade_nome text null,
  funcao_codigo character varying(20) null,
  funcao_nome text null,
  subfuncao_codigo character varying(20) null,
  subfuncao_nome text null,
  programa_codigo character varying(200) null,
  programa_nome text null,
  projeto_atividade_codigo character varying(200) null,
  projeto_atividade_nome text null,
  natureza_codigo character varying(200) null,
  natureza_nome text null,
  fonte_codigo character varying(200) null,
  fonte_nome text null,
  fonte_stn character varying(200) null,
  fonte_stn_nome text null,
  recurso_codigo character varying(200) null,
  recurso_nome text null,
  ficha character varying(50) null,
  processo character varying(100) null,
  licitacao_numero character varying(200) null,
  licitacao_modalidade character varying(200) null,
  licitacao_descricao text null,
  objeto text null,
  dotacao_inicial numeric(15, 2) null default 0,
  alteracao_dotacao numeric(15, 2) null default 0,
  dotacao_atualizada numeric(15, 2) null default 0,
  valor_empenhado numeric(15, 2) null default 0,
  valor_anulado numeric(15, 2) null default 0,
  valor_reforco numeric(15, 2) null default 0,
  valor_liquidado numeric(15, 2) null default 0,
  valor_pago numeric(15, 2) null default 0,
  empenhado_ate_data numeric(15, 2) null default 0,
  liquidado_ate_data numeric(15, 2) null default 0,
  pago_ate_data numeric(15, 2) null default 0,
  origem character varying(100) null default 'API-JSON'::character varying,
  payload jsonb null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint despesas_pkey primary key (id),
  constraint despesas_pkemp_key unique (pkemp)
) TABLESPACE pg_default;

create index IF not exists idx_despesas_fornecedor_trgm on transparencia.despesas using gin (fornecedor_nome gin_trgm_ops) TABLESPACE pg_default;

create index IF not exists idx_despesas_objeto_trgm on transparencia.despesas using gin (objeto gin_trgm_ops) TABLESPACE pg_default;

create table transparencia.despesas_extra_orcamentarias (
  id uuid not null default gen_random_uuid (),
  empresa character varying(10) null,
  empresa_nome text null,
  ano integer not null,
  codigo character varying(200) null,
  descricao text null,
  data date null,
  nomenclatura text null,
  historico text null,
  numero_guia character varying(200) null,
  data_guia date null,
  cnpj_inscricao character varying(30) null,
  codigo_adotado character varying(200) null,
  pago numeric(14, 2) null default 0,
  origem character varying(100) null default 'API-JSON'::character varying,
  created_at timestamp with time zone null default timezone ('utc'::text, now()),
  constraint despesas_extra_orcamentarias_pkey primary key (id)
) TABLESPACE pg_default;

create index IF not exists idx_desp_extra_ano on transparencia.despesas_extra_orcamentarias using btree (ano) TABLESPACE pg_default;

create table transparencia.diarias (
  id uuid not null default gen_random_uuid (),
  empresa character varying(10) null,
  empresa_nome text null,
  ano integer not null,
  nempg character varying(200) null,
  numero_liquidacao character varying(200) null,
  ordem_pagamento character varying(200) null,
  data date null,
  valor numeric(12, 2) null default 0,
  valor_anulado numeric(12, 2) null default 0,
  descricao text null,
  favorecido text null,
  cargo text null,
  cpf_formatado character varying(30) null,
  orgao_codigo character varying(20) null,
  orgao_nome text null,
  unidade_codigo character varying(20) null,
  unidade_nome text null,
  elemento_nome text null,
  quantidade character varying(50) null,
  origem character varying(100) null default 'API-JSON'::character varying,
  created_at timestamp with time zone null default timezone ('utc'::text, now()),
  constraint diarias_pkey primary key (id)
) TABLESPACE pg_default;

create index IF not exists idx_diarias_ano on transparencia.diarias using btree (ano) TABLESPACE pg_default;

create index IF not exists idx_diarias_favorecido on transparencia.diarias using btree (favorecido) TABLESPACE pg_default;

create index IF not exists idx_diarias_data on transparencia.diarias using btree (data) TABLESPACE pg_default;

create unique INDEX IF not exists uq_diarias_ano_nempg on transparencia.diarias using btree (
  ano,
  COALESCE(nempg, ''::character varying),
  COALESCE(numero_liquidacao, ''::character varying)
) TABLESPACE pg_default;

create table transparencia.licitacoes (
  id uuid not null default gen_random_uuid (),
  empresa_nome text null,
  ano character varying(10) null,
  proclic character varying(200) null,
  numero character varying(200) null,
  nlicitacao character varying(200) null,
  numlic character varying(200) null,
  tipo_licitacao text null,
  data_abertura date null,
  data_encerramento date null,
  registro_preco character varying(5) null,
  objeto text null,
  situacao text null,
  valor numeric(14, 2) null default 0,
  empresa character varying(10) null,
  carona character varying(10) null,
  artigo_inciso text null,
  origem character varying(100) null default 'API-JSON'::character varying,
  created_at timestamp with time zone null default timezone ('utc'::text, now()),
  constraint licitacoes_pkey primary key (id)
) TABLESPACE pg_default;

create index IF not exists idx_licitacoes_ano on transparencia.licitacoes using btree (ano) TABLESPACE pg_default;

create index IF not exists idx_licitacoes_situacao on transparencia.licitacoes using btree (situacao) TABLESPACE pg_default;

create table transparencia.contratos (
  id uuid not null default gen_random_uuid (),
  empresa character varying(10) null,
  empresa_nome text null,
  ano character varying(10) null,
  codigo character varying(200) null,
  numero_contrato character varying(200) null,
  fornecedor text null,
  cnpj_inscricao character varying(30) null,
  objeto text null,
  objeto_completo text null,
  valor numeric(14, 2) null default 0,
  data_assinatura date null,
  data_publicacao date null,
  vigencia_inicio date null,
  vigencia_fim date null,
  situacao text null,
  licitacao_tipo text null,
  licitacao_numero character varying(200) null,
  modalidade text null,
  gestor_nome text null,
  gestor_codigo character varying(20) null,
  entidade text null,
  fundamento_legal text null,
  origem character varying(100) null default 'API-JSON'::character varying,
  created_at timestamp with time zone null default timezone ('utc'::text, now()),
  constraint contratos_pkey primary key (id)
) TABLESPACE pg_default;

create index IF not exists idx_contratos_ano on transparencia.contratos using btree (ano) TABLESPACE pg_default;

create index IF not exists idx_contratos_fornecedor on transparencia.contratos using btree (fornecedor) TABLESPACE pg_default;

create table transparencia.transferencias (
  id uuid not null default gen_random_uuid (),
  empresa character varying(10) null,
  empresa_nome text null,
  mes integer null,
  entidade_pagadora text null,
  entidade_recebedora text null,
  cnpj_pagadora character varying(30) null,
  cnpj_recebedora character varying(30) null,
  repasse numeric(14, 2) null default 0,
  devolucao numeric(14, 2) null default 0,
  previsto numeric(14, 2) null default 0,
  destino character varying(50) null,
  ano integer not null,
  origem character varying(100) null default 'API-JSON'::character varying,
  created_at timestamp with time zone null default timezone ('utc'::text, now()),
  constraint transferencias_pkey primary key (id)
) TABLESPACE pg_default;

create index IF not exists idx_transferencias_ano on transparencia.transferencias using btree (ano) TABLESPACE pg_default;

create table transparencia.restos_pagar (
  id uuid not null default gen_random_uuid (),
  empresa character varying(10) null,
  empresa_nome text null,
  ano integer not null,
  codigo character varying(200) null,
  descricao text null,
  empenhado numeric(14, 2) null default 0,
  liquidado numeric(14, 2) null default 0,
  pago numeric(14, 2) null default 0,
  origem character varying(100) null default 'API-JSON'::character varying,
  created_at timestamp with time zone null default timezone ('utc'::text, now()),
  constraint restos_pagar_pkey primary key (id)
) TABLESPACE pg_default;

create index IF not exists idx_restos_pagar_ano on transparencia.restos_pagar using btree (ano) TABLESPACE pg_default;

create table transparencia.servidores (
  id uuid not null default gen_random_uuid (),
  empresa character varying(10) null,
  empresa_nome text null,
  ano integer not null,
  matricula character varying(200) null,
  nome text null,
  cargo text null,
  lotacao text null,
  funcao text null,
  data_admissao date null,
  situacao text null,
  rendimentos numeric(14, 2) null default 0,
  descontos numeric(14, 2) null default 0,
  liquido numeric(14, 2) null default 0,
  origem character varying(100) null default 'API-JSON'::character varying,
  created_at timestamp with time zone null default timezone ('utc'::text, now()),
  constraint servidores_pkey primary key (id)
) TABLESPACE pg_default;

create index IF not exists idx_servidores_ano on transparencia.servidores using btree (ano) TABLESPACE pg_default;

create index IF not exists idx_servidores_nome on transparencia.servidores using btree (nome) TABLESPACE pg_default;

create unique INDEX IF not exists uq_servidores_ano_matricula on transparencia.servidores using btree (ano, COALESCE(matricula, ''::character varying)) TABLESPACE pg_default;

create table transparencia.receitas (
  id uuid not null default gen_random_uuid (),
  ano integer not null,
  codigo_contabil character varying(50) not null,
  codigo_limpo character varying(50) not null,
  descricao text not null,
  nivel smallint not null,
  tipo_nivel character varying(30) not null,
  codigo_pai character varying(50) null,
  categoria character varying(10) null,
  origem character varying(10) null,
  especie character varying(10) null,
  rubrica character varying(10) null,
  alinea character varying(20) null,
  subalinea character varying(20) null,
  detalhamento character varying(30) null,
  cod_aplicacao character varying(50) null,
  fonte_stn character varying(50) null,
  fonte_recurso character varying(100) null,
  previsto_inicial numeric(15, 2) null default 0,
  previsto_atualizado numeric(15, 2) null default 0,
  arrecadado_periodo numeric(15, 2) null default 0,
  arrecadado_total numeric(15, 2) null default 0,
  created_at timestamp with time zone null default timezone ('utc'::text, now()),
  empresa character varying(20) null,
  empresa_nome text null,
  constraint receitas_pkey primary key (id)
) TABLESPACE pg_default;

create index IF not exists idx_receitas_ano on transparencia.receitas using btree (ano) TABLESPACE pg_default;

create index IF not exists idx_receitas_codigo on transparencia.receitas using btree (codigo_contabil) TABLESPACE pg_default;

create index IF not exists idx_receitas_codigo_limpo on transparencia.receitas using btree (codigo_limpo) TABLESPACE pg_default;

create index IF not exists idx_receitas_nivel on transparencia.receitas using btree (nivel) TABLESPACE pg_default;

create index IF not exists idx_receitas_categoria on transparencia.receitas using btree (categoria) TABLESPACE pg_default;

create index IF not exists idx_receitas_origem on transparencia.receitas using btree (origem) TABLESPACE pg_default;

create index IF not exists idx_receitas_especie on transparencia.receitas using btree (especie) TABLESPACE pg_default;

create index IF not exists idx_receitas_rubrica on transparencia.receitas using btree (rubrica) TABLESPACE pg_default;

create index IF not exists idx_receitas_pai on transparencia.receitas using btree (codigo_pai) TABLESPACE pg_default;

create unique INDEX IF not exists uq_receitas on transparencia.receitas using btree (
  empresa,
  ano,
  codigo_contabil,
  COALESCE(fonte_stn, ''::character varying),
  COALESCE(fonte_recurso, ''::character varying),
  COALESCE(cod_aplicacao, ''::character varying)
) TABLESPACE pg_default;

create table transparencia.receitas_detalhes (
  id bigint generated always as identity not null,
  receita_id uuid null,
  ano integer not null,
  codigo_contabil character varying(50) not null,
  descricao_receita text not null,
  data_lancamento date null,
  historico text null,
  documento character varying(100) null,
  contribuinte text null,
  cpf_cnpj character varying(30) null,
  valor numeric(15, 2) null default 0,
  origem character varying(100) null,
  created_at timestamp with time zone null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone null default timezone ('utc'::text, now()),
  empresa character varying(20) null,
  empresa_nome text null,
  constraint receitas_detalhes_pkey primary key (id)
) TABLESPACE pg_default;

create index IF not exists idx_receitas_detalhes_receita on transparencia.receitas_detalhes using btree (receita_id) TABLESPACE pg_default;

create index IF not exists idx_receitas_detalhes_codigo on transparencia.receitas_detalhes using btree (codigo_contabil) TABLESPACE pg_default;

create index IF not exists idx_receitas_detalhes_ano on transparencia.receitas_detalhes using btree (ano) TABLESPACE pg_default;

create index IF not exists idx_receitas_detalhes_data on transparencia.receitas_detalhes using btree (data_lancamento) TABLESPACE pg_default;

create unique INDEX IF not exists uq_receitas_detalhes on transparencia.receitas_detalhes using btree (
  ano,
  codigo_contabil,
  COALESCE(data_lancamento, '1900-01-01'::date),
  valor,
  COALESCE(historico, ''::text)
) TABLESPACE pg_default;

