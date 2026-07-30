-- ============================================================================
-- Tabela: incentivos_cultura_esporte
-- Finalidade: Armazenar projetos de incentivo à cultura e esporte com renúncia
--             de receita (Critério 16.4 do PNTP 2026)
-- Schema: transparencia
-- ============================================================================

CREATE TABLE IF NOT EXISTS transparencia.incentivos_cultura_esporte (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto           TEXT NOT NULL,            -- Nome do projeto/evento (ex: "Festa do Padroeiro 2025")
  area              TEXT NOT NULL             -- 'cultura' ou 'esporte'
                    CHECK (area IN ('cultura', 'esporte')),
  beneficiario      TEXT NOT NULL,            -- Nome do beneficiário/realizador (ex: "Associação Cultural X")
  cpf_cnpj          TEXT,                     -- CPF/CNPJ do beneficiário
  tipo_incentivo    TEXT NOT NULL,            -- Tipo: 'isencao_iss', 'patrocinio_abatimento', 'isencao_taxa', 'outro'
  valor_beneficio   NUMERIC(14,2) NOT NULL,   -- Valor do benefício concedido
  fundamento_legal  TEXT NOT NULL,            -- Lei municipal que autorizou (ex: "Lei Municipal nº XXX/2023")
  ano               INTEGER NOT NULL,         -- Ano de referência
  descricao         TEXT,                     -- Descrição resumida do projeto
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_incentivos_ano ON transparencia.incentivos_cultura_esporte(ano);
CREATE INDEX IF NOT EXISTS idx_incentivos_area ON transparencia.incentivos_cultura_esporte(area);

-- RLS: leitura pública, escrita apenas via service_role
ALTER TABLE transparencia.incentivos_cultura_esporte ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura pública" ON transparencia.incentivos_cultura_esporte
  FOR SELECT USING (true);

-- ============================================================================
-- Instruções:
-- 1. Acesse o SQL Editor do Supabase
-- 2. Cole e execute este script
-- 3. Confirme que a tabela foi criada em Database > Tables
-- ============================================================================
