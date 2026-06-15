-- ============================================================
-- CRIAR TABELA PARA CRITÉRIO 9.4 DO PNTP 2026
-- ORDEM CRONOLÓGICA DE PAGAMENTOS
-- ============================================================
-- Execute este script no SQL Editor do Supabase Dashboard
-- ============================================================

-- ─── TABELA: Ordem Cronológica de Pagamentos ───
-- Critério 9.4 (Obrigatório)
CREATE TABLE IF NOT EXISTS transparencia.ordem_cronologica_pagamentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ano INTEGER NOT NULL,
    mes INTEGER,
    empresa_codigo TEXT,
    empresa_nome TEXT,
    empenho TEXT,
    tipo_empenho TEXT,
    fornecedor TEXT NOT NULL,
    cpf_cnpj_fornecedor TEXT,
    valor_empenho NUMERIC(15,2) DEFAULT 0,
    valor_pago NUMERIC(15,2) DEFAULT 0,
    valor_desconto NUMERIC(15,2) DEFAULT 0,
    valor_liquido_pago NUMERIC(15,2) DEFAULT 0,
    data_vencimento DATE,
    data_pagamento DATE,
    justificativa TEXT,
    justificativa_texto TEXT,
    data_justificativa DATE,
    tipo_lista TEXT,
    numero_contrato TEXT,
    categoria_contrato TEXT,
    categoria_contrato_descr TEXT,
    processo TEXT,
    unidade_nome TEXT,
    autorizador_nome TEXT,
    historico TEXT,
    notas_fiscais TEXT,
    licitacao TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para busca
CREATE INDEX IF NOT EXISTS idx_ocp_ano ON transparencia.ordem_cronologica_pagamentos (ano);
CREATE INDEX IF NOT EXISTS idx_ocp_data_pagamento ON transparencia.ordem_cronologica_pagamentos (data_pagamento);
CREATE INDEX IF NOT EXISTS idx_ocp_fornecedor ON transparencia.ordem_cronologica_pagamentos (fornecedor);
CREATE INDEX IF NOT EXISTS idx_ocp_empenho ON transparencia.ordem_cronologica_pagamentos (empenho);

-- ============================================================
-- RLS (Row Level Security)
-- ============================================================
ALTER TABLE transparencia.ordem_cronologica_pagamentos ENABLE ROW LEVEL SECURITY;

-- Permite leitura pública anônima (para o portal)
CREATE POLICY "Leitura pública Ordem Cronológica" 
    ON transparencia.ordem_cronologica_pagamentos 
    FOR SELECT USING (true);

-- Escrita apenas via service_role (já feito por padrão)

-- ============================================================
-- VERIFICAÇÃO
-- ============================================================
SELECT '✅ Tabela ordem_cronologica_pagamentos criada com sucesso!' as resultado;
