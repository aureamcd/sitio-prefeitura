-- ========================================================
-- Bucket usado para anexos enviados pelo cidadão e anexos de resposta do admin
INSERT INTO storage.buckets (id, name, public)
VALUES ('attachments', 'attachments', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- TABELAS DO SISTEMA e-SIC & OUVIDORIA
-- ========================================================
-- Execute este script no SQL Editor do Supabase
-- (Dashboard → SQL Editor → New Query)
--
-- Estrutura segue a Lei nº 12.527/2011 e PNTP 2026
-- ========================================================

-- ═══════════════════════════════════════════════
-- 1. TABELA: esic_solicitacoes
-- Armazena pedidos de acesso à informação (LAI)
-- ═══════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS esic_solicitacoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Protocolo único gerado pelo sistema
  protocolo TEXT UNIQUE NOT NULL,
  
  -- Dados do solicitante
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  cpf TEXT,
  telefone TEXT,
  
  -- Conteúdo da solicitação
  descricao TEXT NOT NULL,
  orgao_destinatario TEXT,
  
  -- Status do fluxo
  status TEXT NOT NULL DEFAULT 'recebido'
    CHECK (status IN ('recebido', 'em_analise', 'respondido', 'indeferido', 'prorrogado')),
  
  -- Resposta da prefeitura
  resposta TEXT,
  resposta_anexo_url TEXT,
  justificativa_indeferimento TEXT,
  
  -- Prorrogação
  data_prorrogacao TIMESTAMPTZ,
  motivo_prorrogacao TEXT,
  
  -- Datas automáticas
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  respondido_em TIMESTAMPTZ,
  prazo_resposta TIMESTAMPTZ NOT NULL
);

-- Índices para consulta performática
CREATE INDEX IF NOT EXISTS idx_esic_protocolo ON esic_solicitacoes(protocolo);
CREATE INDEX IF NOT EXISTS idx_esic_email ON esic_solicitacoes(email);
CREATE INDEX IF NOT EXISTS idx_esic_cpf ON esic_solicitacoes(cpf);
CREATE INDEX IF NOT EXISTS idx_esic_status ON esic_solicitacoes(status);
CREATE INDEX IF NOT EXISTS idx_esic_created ON esic_solicitacoes(created_at DESC);

-- Trigger: atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_esic_updated_at
  BEFORE UPDATE ON esic_solicitacoes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- ═══════════════════════════════════════════════
-- 2. TABELA: ouvidoria_manifestacoes
-- Armazena manifestações de ouvidoria
-- ═══════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS ouvidoria_manifestacoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  protocolo TEXT UNIQUE NOT NULL,
  
  -- Tipo de manifestação
  tipo TEXT NOT NULL
    CHECK (tipo IN ('denuncia', 'reclamacao', 'solicitacao', 'sugestao', 'elogio')),
  
  -- Dados do manifestante
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  cpf TEXT,
  telefone TEXT,
  anonimo BOOLEAN DEFAULT FALSE,
  
  -- Conteúdo
  descricao TEXT NOT NULL,
  orgao_destinatario TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'recebido'
    CHECK (status IN ('recebido', 'em_analise', 'respondido', 'indeferido', 'prorrogado')),
  
  -- Resposta
  resposta TEXT,
  resposta_anexo_url TEXT,
  justificativa_indeferimento TEXT,
  
  -- Prorrogação
  data_prorrogacao TIMESTAMPTZ,
  motivo_prorrogacao TEXT,
  
  -- Datas
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  respondido_em TIMESTAMPTZ,
  prazo_resposta TIMESTAMPTZ NOT NULL,
  
  -- Anexo
  anexo_url TEXT
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_ouvidoria_protocolo ON ouvidoria_manifestacoes(protocolo);
CREATE INDEX IF NOT EXISTS idx_ouvidoria_email ON ouvidoria_manifestacoes(email);
CREATE INDEX IF NOT EXISTS idx_ouvidoria_cpf ON ouvidoria_manifestacoes(cpf);
CREATE INDEX IF NOT EXISTS idx_ouvidoria_status ON ouvidoria_manifestacoes(status);
CREATE INDEX IF NOT EXISTS idx_ouvidoria_tipo ON ouvidoria_manifestacoes(tipo);
CREATE INDEX IF NOT EXISTS idx_ouvidoria_created ON ouvidoria_manifestacoes(created_at DESC);

CREATE OR REPLACE TRIGGER trigger_ouvidoria_updated_at
  BEFORE UPDATE ON ouvidoria_manifestacoes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- ═══════════════════════════════════════════════
-- 3. RLS (Row Level Security)
-- Permite INSERT público e SELECT/UPDATE restrito
-- ═══════════════════════════════════════════════
ALTER TABLE esic_solicitacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ouvidoria_manifestacoes ENABLE ROW LEVEL SECURITY;

-- Política: qualquer pessoa pode inserir (formulário público)
CREATE POLICY "Permitir INSERT público e-SIC"
  ON esic_solicitacoes FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Permitir INSERT público Ouvidoria"
  ON ouvidoria_manifestacoes FOR INSERT
  TO anon
  WITH CHECK (true);

-- Política: leitura pública por protocolo + email/cpf
CREATE POLICY "Consulta pública por protocolo e-SIC"
  ON esic_solicitacoes FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Consulta pública por protocolo Ouvidoria"
  ON ouvidoria_manifestacoes FOR SELECT
  TO anon
  USING (true);
