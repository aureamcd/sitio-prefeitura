-- =============================================================
-- Setup completo do banco de dados - Portal da Transparência
-- Padre Marcos - PI
-- =============================================================
-- Execute este script no SQL Editor do Supabase
-- =============================================================

CREATE SCHEMA IF NOT EXISTS transparencia;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- =============================================================
-- 1. RECEITAS ORÇAMENTÁRIAS (agregado por código contábil)
--
-- Nota: As colunas codigo_limpo, nivel, tipo_nivel e codigo_pai
-- foram adicionadas posteriormente via import-receitas.ts e
-- são preenchidas pelo import-all.ts. Caso não existam no
-- banco, a aplicação as calcula client-side a partir do
-- codigo_contabil (lib/receitas/receitasTree.ts).
-- =============================================================
CREATE TABLE IF NOT EXISTS transparencia.receitas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ano INTEGER NOT NULL,
    codigo_contabil VARCHAR(50) NOT NULL,
    codigo_limpo VARCHAR(50),
    descricao TEXT NOT NULL,
    nivel INTEGER DEFAULT 0,
    tipo_nivel VARCHAR(50),
    codigo_pai VARCHAR(50),
    cod_aplicacao VARCHAR(50),
    fonte_stn VARCHAR(50),
    fonte_recurso VARCHAR(100),
    previsto_inicial NUMERIC(15, 2) DEFAULT 0,
    previsto_atualizado NUMERIC(15, 2) DEFAULT 0,
    arrecadado_periodo NUMERIC(15, 2) DEFAULT 0,
    arrecadado_total NUMERIC(15, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_receitas_ano ON transparencia.receitas (ano);
CREATE INDEX IF NOT EXISTS idx_receitas_codigo ON transparencia.receitas (codigo_contabil);

-- =============================================================
-- 2. DETALHES DAS RECEITAS (lançamentos individuais)
-- =============================================================
CREATE TABLE IF NOT EXISTS transparencia.receitas_detalhes (
    id BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL,
    receita_id UUID NULL,
    codigo_contabil VARCHAR(50) NOT NULL,
    descricao_receita TEXT NOT NULL,
    data_lancamento DATE NULL,
    historico TEXT NULL,
    documento VARCHAR(100) NULL,
    contribuinte TEXT NULL,
    cpf_cnpj VARCHAR(30) NULL,
    valor NUMERIC(15, 2) NULL DEFAULT 0,
    ano INTEGER NOT NULL,
    origem VARCHAR(100) NULL,
    tipo VARCHAR(50) NULL,
    created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT receitas_detalhes_pkey PRIMARY KEY (id),
    CONSTRAINT receitas_detalhes_receita_id_fkey
        FOREIGN KEY (receita_id)
        REFERENCES transparencia.receitas (id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_receitas_detalhes_receita ON transparencia.receitas_detalhes (receita_id);
CREATE INDEX IF NOT EXISTS idx_receitas_detalhes_codigo ON transparencia.receitas_detalhes (codigo_contabil);
CREATE INDEX IF NOT EXISTS idx_receitas_detalhes_ano ON transparencia.receitas_detalhes (ano);
CREATE INDEX IF NOT EXISTS idx_receitas_detalhes_data ON transparencia.receitas_detalhes (data_lancamento);
CREATE INDEX IF NOT EXISTS idx_receitas_detalhes_tipo ON transparencia.receitas_detalhes (tipo);

-- =============================================================
-- 2b. DÍVIDA ATIVA (estoque por tipo e exercício — PNTP 2026)
-- =============================================================
CREATE TABLE IF NOT EXISTS transparencia.divida_ativa (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ano INTEGER NOT NULL,
    tipo TEXT NOT NULL,
    saldo_anterior NUMERIC(15, 2) DEFAULT 0,
    inscrito_ano NUMERIC(15, 2) DEFAULT 0,
    arrecadado_ano NUMERIC(15, 2) DEFAULT 0,
    saldo_atual NUMERIC(15, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_divida_ativa_ano ON transparencia.divida_ativa (ano);

-- =============================================================
-- 3. DESPESAS (por empenho)
-- =============================================================
CREATE TABLE IF NOT EXISTS transparencia.despesas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ano INTEGER NOT NULL,
    pkemp VARCHAR(200),
    codigo VARCHAR(200),
    tipo_empenho VARCHAR(20),
    numero_empenho VARCHAR(200),
    data_empenho DATE,
    fornecedor_codigo VARCHAR(200),
    fornecedor_nome TEXT,
    fornecedor_cpf_cnpj VARCHAR(30),
    orgao_unidade VARCHAR(100),
    orgao_nome TEXT,
    funcao_codigo VARCHAR(20),
    funcao_nome TEXT,
    subfuncao_codigo VARCHAR(20),
    subfuncao_nome TEXT,
    natureza_codigo VARCHAR(200),
    natureza_nome TEXT,
    fonte_codigo VARCHAR(200),
    fonte_nome TEXT,
    recurso_codigo VARCHAR(200),
    recurso_nome TEXT,
    fonte_stn VARCHAR(200),
    programa_codigo VARCHAR(200),
    programa_nome TEXT,
    projeto_atividade_codigo VARCHAR(200),
    projeto_atividade_nome TEXT,
    dotacao_inicial NUMERIC(15, 2) DEFAULT 0,
    alteracao_dotacao NUMERIC(15, 2) DEFAULT 0,
    dotacao_atualizada NUMERIC(15, 2) DEFAULT 0,
    valor_empenhado NUMERIC(15, 2) DEFAULT 0,
    valor_liquidado NUMERIC(15, 2) DEFAULT 0,
    valor_pago NUMERIC(15, 2) DEFAULT 0,
    empenhado_ate_data NUMERIC(15, 2) DEFAULT 0,
    liquidado_ate_data NUMERIC(15, 2) DEFAULT 0,
    pago_ate_data NUMERIC(15, 2) DEFAULT 0,
    processo VARCHAR(100),
    licitacao VARCHAR(200),
    origem VARCHAR(100) DEFAULT 'API-JSON',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_despesas_ano ON transparencia.despesas (ano);
CREATE INDEX IF NOT EXISTS idx_despesas_pkemp ON transparencia.despesas (pkemp);
CREATE INDEX IF NOT EXISTS idx_despesas_fornecedor ON transparencia.despesas (fornecedor_nome);
CREATE INDEX IF NOT EXISTS idx_despesas_data ON transparencia.despesas (data_empenho);
CREATE INDEX IF NOT EXISTS idx_despesas_fornecedor_trgm ON transparencia.despesas USING gin (fornecedor_nome gin_trgm_ops);

-- =============================================================
-- 4. DIÁRIAS
-- =============================================================
CREATE TABLE IF NOT EXISTS transparencia.diarias (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ano INTEGER NOT NULL,
    nempg VARCHAR(50),
    numero_liquidacao VARCHAR(50),
    ordem_pagamento VARCHAR(50),
    data DATE,
    valor NUMERIC(12, 2) DEFAULT 0,
    valor_anulado NUMERIC(12, 2) DEFAULT 0,
    descricao TEXT,
    favorecido TEXT,
    cargo TEXT,
    cpf_formatado VARCHAR(30),
    orgao_codigo VARCHAR(20),
    orgao_nome TEXT,
    unidade_codigo VARCHAR(20),
    unidade_nome TEXT,
    elemento_nome TEXT,
    quantidade VARCHAR(50),
    origem VARCHAR(100) DEFAULT 'API-JSON',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_diarias_ano ON transparencia.diarias (ano);
CREATE INDEX IF NOT EXISTS idx_diarias_favorecido ON transparencia.diarias (favorecido);
CREATE INDEX IF NOT EXISTS idx_diarias_data ON transparencia.diarias (data);

-- =============================================================
-- 5. LICITAÇÕES
-- =============================================================
CREATE TABLE IF NOT EXISTS transparencia.licitacoes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ano VARCHAR(10),
    proclic VARCHAR(50),
    numero VARCHAR(50),
    nlicitacao VARCHAR(50),
    numlic VARCHAR(50),
    tipo_licitacao TEXT,
    data_abertura DATE,
    data_encerramento DATE,
    registro_preco VARCHAR(5),
    objeto TEXT,
    situacao TEXT,
    valor NUMERIC(14, 2) DEFAULT 0,
    empresa VARCHAR(10),
    carona VARCHAR(10),
    artigo_inciso TEXT,
    origem VARCHAR(100) DEFAULT 'API-JSON',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_licitacoes_ano ON transparencia.licitacoes (ano);
CREATE INDEX IF NOT EXISTS idx_licitacoes_situacao ON transparencia.licitacoes (situacao);

-- =============================================================
-- 6. CONTRATOS
-- =============================================================
CREATE TABLE IF NOT EXISTS transparencia.contratos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ano VARCHAR(10),
    codigo VARCHAR(50),
    numero_contrato VARCHAR(50),
    fornecedor TEXT,
    cnpj_inscricao VARCHAR(30),
    objeto TEXT,
    objeto_completo TEXT,
    valor NUMERIC(14, 2) DEFAULT 0,
    data_assinatura DATE,
    data_publicacao DATE,
    vigencia_inicio DATE,
    vigencia_fim DATE,
    situacao TEXT,
    licitacao_tipo TEXT,
    licitacao_numero VARCHAR(50),
    modalidade TEXT,
    gestor_nome TEXT,
    gestor_codigo VARCHAR(20),
    entidade TEXT,
    fundamento_legal TEXT,
    origem VARCHAR(100) DEFAULT 'API-JSON',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_contratos_ano ON transparencia.contratos (ano);
CREATE INDEX IF NOT EXISTS idx_contratos_fornecedor ON transparencia.contratos (fornecedor);

-- =============================================================
-- 7. TRANSFERÊNCIAS ENTRE ENTIDADES
-- =============================================================
CREATE TABLE IF NOT EXISTS transparencia.transferencias (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    mes INTEGER,
    entidade_pagadora TEXT,
    entidade_recebedora TEXT,
    cnpj_pagadora VARCHAR(30),
    cnpj_recebedora VARCHAR(30),
    repasse NUMERIC(14, 2) DEFAULT 0,
    devolucao NUMERIC(14, 2) DEFAULT 0,
    previsto NUMERIC(14, 2) DEFAULT 0,
    destino VARCHAR(50),
    ano INTEGER NOT NULL,
    origem VARCHAR(100) DEFAULT 'API-JSON',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_transferencias_ano ON transparencia.transferencias (ano);

-- =============================================================
-- 8. RESTOS A PAGAR
-- =============================================================
CREATE TABLE IF NOT EXISTS transparencia.restos_pagar (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ano INTEGER NOT NULL,
    codigo VARCHAR(50),
    descricao TEXT,
    empenhado NUMERIC(14, 2) DEFAULT 0,
    liquidado NUMERIC(14, 2) DEFAULT 0,
    pago NUMERIC(14, 2) DEFAULT 0,
    origem VARCHAR(100) DEFAULT 'API-JSON',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_restos_pagar_ano ON transparencia.restos_pagar (ano);

-- =============================================================
-- 9. DESPESAS EXTRA-ORÇAMENTÁRIAS
-- =============================================================
CREATE TABLE IF NOT EXISTS transparencia.despesas_extra_orcamentarias (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ano INTEGER NOT NULL,
    codigo VARCHAR(50),
    descricao TEXT,
    data DATE,
    nomenclatura TEXT,
    historico TEXT,
    numero_guia VARCHAR(50),
    data_guia DATE,
    cnpj_inscricao VARCHAR(30),
    codigo_adotado VARCHAR(50),
    pago NUMERIC(14, 2) DEFAULT 0,
    origem VARCHAR(100) DEFAULT 'API-JSON',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_desp_extra_ano ON transparencia.despesas_extra_orcamentarias (ano);

-- =============================================================
-- 10. SERVIDORES (PESSOAL)
-- =============================================================
CREATE TABLE IF NOT EXISTS transparencia.servidores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ano INTEGER NOT NULL,
    matricula VARCHAR(50),
    nome TEXT,
    cargo TEXT,
    lotacao TEXT,
    funcao TEXT,
    data_admissao DATE,
    situacao TEXT,
    rendimentos NUMERIC(14, 2) DEFAULT 0,
    descontos NUMERIC(14, 2) DEFAULT 0,
    liquido NUMERIC(14, 2) DEFAULT 0,
    origem VARCHAR(100) DEFAULT 'API-JSON',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_servidores_ano ON transparencia.servidores (ano);
CREATE INDEX IF NOT EXISTS idx_servidores_nome ON transparencia.servidores (nome);

-- =============================================================
-- 11. EMENDAS PARLAMENTARES
-- =============================================================
CREATE TABLE IF NOT EXISTS transparencia.emendas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ano INTEGER NOT NULL,
    tipo_transferencia TEXT,
    receita_transferencia TEXT,
    recurso_aplicacao_financeira TEXT,
    empenhado NUMERIC(14, 2) DEFAULT 0,
    liquidado NUMERIC(14, 2) DEFAULT 0,
    pago NUMERIC(14, 2) DEFAULT 0,
    origem VARCHAR(100) DEFAULT 'API-JSON',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_emendas_ano ON transparencia.emendas (ano);

-- =============================================================
-- 12. OBRAS PÚBLICAS (para dados futuros)
-- =============================================================
CREATE TABLE IF NOT EXISTS transparencia.obras (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ano INTEGER NOT NULL,
    objeto TEXT,
    localizacao TEXT,
    contrato_numero VARCHAR(50),
    empresa_responsavel TEXT,
    cnpj_empresa VARCHAR(30),
    data_inicio DATE,
    data_previsao_fim DATE,
    situacao TEXT,
    percentual_executado NUMERIC(5, 2) DEFAULT 0,
    valor_total NUMERIC(14, 2) DEFAULT 0,
    valor_executado NUMERIC(14, 2) DEFAULT 0,
    origem VARCHAR(100) DEFAULT 'API-JSON',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_obras_ano ON transparencia.obras (ano);

-- =============================================================
-- CORREÇÕES — aumenta colunas VARCHAR(50) que recebem dados longos da API
-- =============================================================

-- Despesas
ALTER TABLE transparencia.despesas ALTER COLUMN pkemp TYPE VARCHAR(200);
ALTER TABLE transparencia.despesas ALTER COLUMN codigo TYPE VARCHAR(200);
ALTER TABLE transparencia.despesas ALTER COLUMN numero_empenho TYPE VARCHAR(200);
ALTER TABLE transparencia.despesas ALTER COLUMN fornecedor_codigo TYPE VARCHAR(200);
ALTER TABLE transparencia.despesas ALTER COLUMN natureza_codigo TYPE VARCHAR(200);
ALTER TABLE transparencia.despesas ALTER COLUMN fonte_codigo TYPE VARCHAR(200);
ALTER TABLE transparencia.despesas ALTER COLUMN recurso_codigo TYPE VARCHAR(200);
ALTER TABLE transparencia.despesas ALTER COLUMN fonte_stn TYPE VARCHAR(200);
ALTER TABLE transparencia.despesas ALTER COLUMN programa_codigo TYPE VARCHAR(200);
ALTER TABLE transparencia.despesas ALTER COLUMN projeto_atividade_codigo TYPE VARCHAR(200);
ALTER TABLE transparencia.despesas ALTER COLUMN licitacao TYPE VARCHAR(200);

-- Diárias
ALTER TABLE transparencia.diarias ALTER COLUMN nempg TYPE VARCHAR(200);
ALTER TABLE transparencia.diarias ALTER COLUMN numero_liquidacao TYPE VARCHAR(200);
ALTER TABLE transparencia.diarias ALTER COLUMN ordem_pagamento TYPE VARCHAR(200);

-- Licitações
ALTER TABLE transparencia.licitacoes ALTER COLUMN proclic TYPE VARCHAR(200);
ALTER TABLE transparencia.licitacoes ALTER COLUMN numero TYPE VARCHAR(200);
ALTER TABLE transparencia.licitacoes ALTER COLUMN nlicitacao TYPE VARCHAR(200);
ALTER TABLE transparencia.licitacoes ALTER COLUMN numlic TYPE VARCHAR(200);

-- Contratos
ALTER TABLE transparencia.contratos ALTER COLUMN codigo TYPE VARCHAR(200);
ALTER TABLE transparencia.contratos ALTER COLUMN numero_contrato TYPE VARCHAR(200);
ALTER TABLE transparencia.contratos ALTER COLUMN licitacao_numero TYPE VARCHAR(200);

-- Restos a pagar
ALTER TABLE transparencia.restos_pagar ALTER COLUMN codigo TYPE VARCHAR(200);

-- Despesas extra
ALTER TABLE transparencia.despesas_extra_orcamentarias ALTER COLUMN codigo TYPE VARCHAR(200);
ALTER TABLE transparencia.despesas_extra_orcamentarias ALTER COLUMN numero_guia TYPE VARCHAR(200);
ALTER TABLE transparencia.despesas_extra_orcamentarias ALTER COLUMN codigo_adotado TYPE VARCHAR(200);

-- Servidores
ALTER TABLE transparencia.servidores ALTER COLUMN matricula TYPE VARCHAR(200);
