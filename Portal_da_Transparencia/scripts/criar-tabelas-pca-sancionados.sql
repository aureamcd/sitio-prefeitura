-- ============================================================
-- CRIAR TABELAS PARA CRITÉRIOS 8.6 E 8.7 DO PNTP 2026
-- ============================================================
-- Execute este script no SQL Editor do Supabase Dashboard
-- ============================================================

-- ─── 1. TABELA: Plano de Contratações Anual (PCA) ───
-- Critério 8.6 (Recomendado)
CREATE TABLE IF NOT EXISTS transparencia.plano_contratacoes_anual (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ano INTEGER NOT NULL,
    arquivo_url TEXT,
    arquivo_nome TEXT,
    responsavel TEXT,
    cargo_responsavel TEXT,
    frequencia_atualizacao TEXT DEFAULT 'Anual',
    data_publicacao DATE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Único PCA por ano
CREATE UNIQUE INDEX IF NOT EXISTS idx_pca_ano ON transparencia.plano_contratacoes_anual (ano);

-- ─── 2. TABELA: Licitantes Sancionados ───
-- Critério 8.7 (Recomendado)
CREATE TABLE IF NOT EXISTS transparencia.sancionados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ano INTEGER NOT NULL,
    empresa_nome TEXT NOT NULL,
    cnpj TEXT,
    tipo_sancao TEXT NOT NULL,
    data_inicio DATE,
    data_fim DATE,
    processo TEXT,
    motivo TEXT,
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índice para busca por ano
CREATE INDEX IF NOT EXISTS idx_sancionados_ano ON transparencia.sancionados (ano);

-- ============================================================
-- RLS (Row Level Security) — desabilitado para admin via service_role
-- ============================================================
ALTER TABLE transparencia.plano_contratacoes_anual ENABLE ROW LEVEL SECURITY;
ALTER TABLE transparencia.sancionados ENABLE ROW LEVEL SECURITY;

-- Permite leitura pública anônima (para o portal)
CREATE POLICY "Leitura pública PCA" 
    ON transparencia.plano_contratacoes_anual 
    FOR SELECT USING (true);

CREATE POLICY "Leitura pública Sancionados" 
    ON transparencia.sancionados 
    FOR SELECT USING (true);

-- Escrita apenas via service_role (já feito por padrão)

-- ============================================================
-- VERIFICAÇÃO
-- ============================================================
SELECT '✅ Tabelas criadas com sucesso!' as resultado;
