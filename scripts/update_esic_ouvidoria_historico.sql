-- Execute este script no SQL Editor do Supabase para adicionar a coluna de histórico

INSERT INTO storage.buckets (id, name, public)
VALUES ('attachments', 'attachments', true)
ON CONFLICT (id) DO UPDATE SET public = true;

ALTER TABLE esic_solicitacoes 
ADD COLUMN IF NOT EXISTS historico JSONB DEFAULT '[]'::jsonb;

ALTER TABLE ouvidoria_manifestacoes 
ADD COLUMN IF NOT EXISTS historico JSONB DEFAULT '[]'::jsonb;

ALTER TABLE esic_solicitacoes
ADD COLUMN IF NOT EXISTS resposta_anexo_url TEXT;

ALTER TABLE ouvidoria_manifestacoes
ADD COLUMN IF NOT EXISTS resposta_anexo_url TEXT;

-- A coluna historico armazenará um array de objetos com o formato:
-- { "data": "2026-05-14T10:00:00Z", "ator": "lorena@prefeitura.gov.br", "acao": "Mudou status para Respondido", "detalhes": "..." }
