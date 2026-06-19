-- ============================================================================
-- Criação da tabela: planejamento_complementar_docs
-- Schema: transparencia
-- Descrição: Documentos complementares de planejamento e prestação de contas
--            que não se enquadram na tabela planejamento_documentos
--            (ex: Programação Financeira, Parecer Controle Interno, etc.)
-- ============================================================================

CREATE TABLE IF NOT EXISTS transparencia.planejamento_complementar_docs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo            TEXT NOT NULL,
  titulo          TEXT NOT NULL,
  exercicio       INTEGER NOT NULL,
  descricao       TEXT,
  data_publicacao DATE,
  arquivo_url     TEXT NOT NULL,
  arquivo_nome    TEXT,
  ativo           BOOLEAN DEFAULT true,
  ordem           INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_complementar_exercicio ON transparencia.planejamento_complementar_docs(exercicio);
CREATE INDEX IF NOT EXISTS idx_complementar_tipo ON transparencia.planejamento_complementar_docs(tipo);
CREATE INDEX IF NOT EXISTS idx_complementar_ativo ON transparencia.planejamento_complementar_docs(ativo);

-- RLS: dados públicos (leitura para todos)
ALTER TABLE transparencia.planejamento_complementar_docs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Select público" ON transparencia.planejamento_complementar_docs
  FOR SELECT USING (true);

CREATE POLICY "Insert service_role" ON transparencia.planejamento_complementar_docs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Update service_role" ON transparencia.planejamento_complementar_docs
  FOR UPDATE USING (true);

CREATE POLICY "Delete service_role" ON transparencia.planejamento_complementar_docs
  FOR DELETE USING (true);
