-- ============================================================
-- CRIAR TABELA + IMPORTAR OBRAS PÚBLICAS
-- Critérios 10.1, 10.2, 10.3, 10.4 do PNTP 2026
-- ============================================================
-- Execute este script COMPLETO no SQL Editor do Supabase
-- ============================================================

-- ─── 1. CRIAR TABELA ───
CREATE TABLE IF NOT EXISTS transparencia.obras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    objeto TEXT NOT NULL,
    localizacao TEXT,
    situacao TEXT,
    data_inicio DATE,
    data_previsao_fim DATE,
    empresa_responsavel TEXT,
    cnpj_empresa TEXT,
    valor_total NUMERIC(15,2),
    valor_executado NUMERIC(15,2),
    percentual_executado NUMERIC(5,1),
    contrato_numero TEXT,
    licitacao TEXT,
    empresa TEXT DEFAULT '1',
    ano INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_obras_ano ON transparencia.obras (ano);
CREATE INDEX IF NOT EXISTS idx_obras_situacao ON transparencia.obras (situacao);
CREATE INDEX IF NOT EXISTS idx_obras_empresa ON transparencia.obras (empresa_responsavel);

-- RLS (leitura pública)
ALTER TABLE transparencia.obras ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leitura pública Obras" ON transparencia.obras;
CREATE POLICY "Leitura pública Obras" 
    ON transparencia.obras 
    FOR SELECT USING (true);

-- ─── 2. IMPORTAR OBRAS ───

-- 2a. Obras detalhadas (com contratos, mais recentes)
INSERT INTO transparencia.obras (objeto, localizacao, situacao, data_inicio, data_previsao_fim, empresa_responsavel, cnpj_empresa, contrato_numero, licitacao, empresa, ano)
SELECT * FROM (VALUES
  (
    'Contratação de empresa especializada para construção de escola de ensino infantil na localidade Canto Alegre, no Município de Padre Marcos – PI.',
    'Localidade Canto Alegre', 'Em andamento', '2026-01-05'::date, '2026-11-01'::date,
    'S2E SERVIÇOS LTDA', '47.643.407/0001-09', '008/2026', 'CONCORRÊNCIA Nº 013/2025', '1', 2026
  ),
  (
    'Contratação de empresa especializada para execução da obra de reforma e ampliação da U.E. Cândida Macêdo, a ser realizada na zona urbana do Município de Padre Marcos – PI.',
    'Zona Urbana', 'Em andamento', '2026-02-03'::date, '2026-06-01'::date,
    'FAG CONSTRUCOES EVENTOS E SERVICOS LTDA- ME', '10.786.555/0001-64', '029/2026', 'CONCORRÊNCIA Nº 015/2025', '1', 2026
  ),
  (
    'Contratação de empresa especializada para a execução da obra de construção de unidades habitacionais no Município de Padre Marcos – PI, com recursos oriundos do Programa Minha Casa, Minha Vida – MCMV FNHIS Sub 50 (Proposta nº 040503/2025 e Convênio nº 987304/2025).',
    'Sede do Município', 'Em andamento', '2026-03-06'::date, '2026-11-12'::date,
    'IDEAL SERVIÇOS DE LIMPEZA E CONSTRÇÃO LTDA', '25.079.729/0001-26', '046/2026', 'CONCORRÊNCIA Nº 001/2026', '1', 2026
  ),
  (
    'Contratação de empresa especializada para a construção de CRECHE TIPO 1 na zona urbana do município de Padre Marcos – PI, conforme Proposta nº 003083/2024 e Convênio nº 962715/2024, firmados com o Fundo Nacional de Desenvolvimento da Educação – FNDE, do Ministério da Educação.',
    'Zona Urbana', 'Em andamento', '2025-06-13'::date, '2027-02-01'::date,
    'BERNARDO GRANJA SOUSA "MM PLANEJADOS"', '18.310.280/0001-08', '098/2025', 'CONCORRÊNCIA Nº 004/2025', '1', 2025
  ),
  (
    'Contratação de empresa especializada para a execução da obra de construção da nova sede da Prefeitura Municipal de Padre Marcos – PI.',
    'Sede do Município', 'Em andamento', '2025-07-20'::date, '2026-11-15'::date,
    'BERNARDO GRANJA SOUSA "MM PLANEJADOS"', '18.310.280/0001-08', '113/2025', 'CONCORRÊNCIA Nº 006/2025', '1', 2025
  ),
  (
    'Contratação de empresa especializada para a execução da obra de construção de praça pública e quiosques na sede do Município de Padre Marcos – PI.',
    'Sede do Município', 'Em andamento', '2025-11-08'::date, '2026-07-01'::date,
    'CRC CONSTRUÇÕES E TERRAPLANAGEM LTDA', '36.426.568/0001-16', '136/2025', 'CONCORRÊNCIA Nº 011/2025', '1', 2025
  ),
  (
    'Contratação de empresa especializada para a construção de escola em tempo integral na sede do município de Padre Marcos, PI – FNDE – escola de 9 salas, conforme Convênio nº 960708/2024 e Proposta nº 004119/2024, do Ministério da Educação.',
    'Sede do Município', 'Em andamento', '2025-11-16'::date, '2026-11-11'::date,
    'W J DE JESUS CAVALCANTE LTDA', '32.098.679/0001-90', '137/2025', 'CONCORRÊNCIA Nº 003/2025', '1', 2025
  )
) AS v
WHERE NOT EXISTS (
  SELECT 1 FROM transparencia.obras o 
  WHERE o.objeto ILIKE LEFT(v.column1, 60) || '%' 
    AND o.empresa_responsavel = v.column6
);

-- 2b. Obras da listagem (com valores e obras antigas)
INSERT INTO transparencia.obras (objeto, localizacao, situacao, data_inicio, empresa_responsavel, valor_total, empresa, ano)
SELECT * FROM (VALUES
  (
    'Contratação de empresa especializada para execução de obras de pavimentação asfáltica e drenagem de águas pluviais em diversas ruas da zona urbana do Município de Padre Marcos-PI',
    'Zona Urbana', 'Em andamento', '2025-06-06'::date,
    'COMLIMA CONSTRUTORA LTDA', 8623490.97, '1', 2025
  ),
  (
    'Contratação de empresa especializada para execução de obras de pavimentação asfáltica em diversas ruas da zona urbana do Município de Padre Marcos-PI',
    'Zona Urbana', 'Em andamento', '2025-06-16'::date,
    'BERNARDO GRANJA SOUSA "MM PLANEJADOS"', 5542800.00, '1', 2025
  ),
  (
    'MÓDULOS SANITÁRIOS — Construção de módulos sanitários em comunidades rurais',
    'Comunidades Rurais', 'Em andamento', '2008-06-26'::date,
    'CONSTRUTORA AVANÇO LTDA.', 103100.00, '1', 2008
  ),
  (
    'REFORMA DAS ESTRADAS VICINAIS — Recuperação de estradas vicinais do município',
    'Zona Rural', 'Em andamento', '2008-06-16'::date,
    'AMARO COELHO CONSTRUÇOES LTDA', 144000.00, '1', 2008
  ),
  (
    'REFORMA DE PRAÇA — Reforma da praça da sede do município',
    'Sede do Município', 'Em andamento', '2008-05-27'::date,
    'CONSTRUTORA MARCOS LTDA', 41500.00, '1', 2008
  ),
  (
    'REFORMA E AMPLIAÇÃO DA QUADRA POLIESPORTIVA',
    'Sede do Município', 'Paralisada', '2008-06-18'::date,
    'CONSTRUTORA MARCOS LTDA', 50000.00, '1', 2008
  )
) AS v
WHERE NOT EXISTS (
  SELECT 1 FROM transparencia.obras o 
  WHERE o.objeto ILIKE LEFT(v.column1, 50) || '%' 
    AND o.empresa_responsavel = v.column5
);

-- ─── 3. VERIFICAR RESULTADO ───
SELECT '✅ Tabela criada e dados importados!' as resultado;

SELECT ano, COUNT(*) as qtd, SUM(valor_total)::numeric(15,2) as valor_total
FROM transparencia.obras 
GROUP BY ano 
ORDER BY ano DESC;

SELECT '🏁 Total: ' || COUNT(*) || ' obra(s) importadas' as total FROM transparencia.obras;
