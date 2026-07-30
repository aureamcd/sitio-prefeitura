-- Criação da tabela de Despesas Extraorçamentárias
CREATE TABLE IF NOT EXISTS transparencia.despesas_extra_orcamentarias (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    ano INTEGER NOT NULL,
    empresa TEXT NOT NULL,
    codigo TEXT,
    descricao TEXT,
    nomenclatura TEXT,
    historico TEXT,
    data DATE,
    numero_guia TEXT,
    data_guia DATE,
    cnpj_inscricao TEXT,
    codigo_adotado TEXT,
    pago NUMERIC(15, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhorar a performance das consultas do frontend
CREATE INDEX IF NOT EXISTS idx_desp_extra_ano ON transparencia.despesas_extra_orcamentarias(ano);
CREATE INDEX IF NOT EXISTS idx_desp_extra_empresa ON transparencia.despesas_extra_orcamentarias(empresa);

-- Políticas RLS (Row Level Security) para leitura pública
ALTER TABLE transparencia.despesas_extra_orcamentarias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura pública extraorcamentarias" 
ON transparencia.despesas_extra_orcamentarias 
FOR SELECT 
USING (true);
