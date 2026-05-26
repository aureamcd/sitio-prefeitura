-- =============================================================
-- DEDUPLICAÇÃO COMPLETA — Schema transparencia
-- Portal da Transparência de Padre Marcos - PI
-- =============================================================
-- Execute este script no SQL Editor do Supabase.
-- Antes de executar, recomenda-se rodar SELECT apenas para
-- visualizar o que será deletado (comente o DELETE, descomente o SELECT).
-- =============================================================

SET search_path TO transparencia;

-- =============================================================
-- 1. receitas — unique: (ano, codigo_contabil)
-- =============================================================
-- Visualizar duplicatas (descomente para ver antes de deletar)
/*
SELECT ano, codigo_contabil, COUNT(*) AS qtd
FROM transparencia.receitas
GROUP BY ano, codigo_contabil
HAVING COUNT(*) > 1
ORDER BY ano, codigo_contabil;
*/

BEGIN;
WITH dedup AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY ano, codigo_contabil
           ORDER BY created_at ASC, id ASC
         ) AS rn
  FROM transparencia.receitas
)
DELETE FROM transparencia.receitas
WHERE id IN (SELECT id FROM dedup WHERE rn > 1);
COMMIT;

-- Adiciona unique constraint (se já existir, recria)
ALTER TABLE transparencia.receitas DROP CONSTRAINT IF EXISTS uq_receitas_ano_codigo;
ALTER TABLE transparencia.receitas
  ADD CONSTRAINT uq_receitas_ano_codigo UNIQUE (ano, codigo_contabil);

-- =============================================================
-- 2. receitas_detalhes — unique lógico depende do tipo
--    Para 'especificacao': (ano, codigo_contabil, tipo, data_lancamento, valor, historico)
--    Para 'extra-orcamentaria': (ano, codigo_contabil, tipo, data_lancamento, valor, descricao_receita)
-- =============================================================
-- Visualizar duplicatas
/*
SELECT ano, codigo_contabil, tipo, data_lancamento, valor, historico, COUNT(*) AS qtd
FROM transparencia.receitas_detalhes
GROUP BY ano, codigo_contabil, tipo, data_lancamento, valor, historico
HAVING COUNT(*) > 1
ORDER BY ano, codigo_contabil;
*/

BEGIN;
WITH dedup AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY ano, codigo_contabil, tipo, COALESCE(data_lancamento::TEXT, ''), valor, COALESCE(historico, '')
           ORDER BY id ASC
         ) AS rn
  FROM transparencia.receitas_detalhes
)
DELETE FROM transparencia.receitas_detalhes
WHERE id IN (SELECT id FROM dedup WHERE rn > 1);
COMMIT;

-- Adiciona unique index (não pode ser constraint UNIQUE porque valores NULL em data_lancamento/historico são permitidos)
CREATE UNIQUE INDEX IF NOT EXISTS uq_receitas_detalhes
  ON transparencia.receitas_detalhes (ano, codigo_contabil, tipo, COALESCE(data_lancamento, '1900-01-01'), valor, COALESCE(historico, ''));

-- =============================================================
-- 3. divida_ativa — unique: (ano, tipo)
-- =============================================================
/*
SELECT ano, tipo, COUNT(*) AS qtd
FROM transparencia.divida_ativa
GROUP BY ano, tipo
HAVING COUNT(*) > 1
ORDER BY ano, tipo;
*/

BEGIN;
WITH dedup AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY ano, tipo
           ORDER BY created_at ASC, id ASC
         ) AS rn
  FROM transparencia.divida_ativa
)
DELETE FROM transparencia.divida_ativa
WHERE id IN (SELECT id FROM dedup WHERE rn > 1);
COMMIT;

ALTER TABLE transparencia.divida_ativa DROP CONSTRAINT IF EXISTS uq_divida_ativa_ano_tipo;
ALTER TABLE transparencia.divida_ativa
  ADD CONSTRAINT uq_divida_ativa_ano_tipo UNIQUE (ano, tipo);

-- =============================================================
-- 4. despesas — unique: (ano, pkemp)
--    pkemp é o identificador único do empenho na API
-- =============================================================
/*
SELECT ano, pkemp, COUNT(*) AS qtd
FROM transparencia.despesas
WHERE pkemp IS NOT NULL
GROUP BY ano, pkemp
HAVING COUNT(*) > 1
ORDER BY ano, pkemp;

-- Também verificar registros sem pkemp
SELECT * FROM transparencia.despesas WHERE pkemp IS NULL OR pkemp = '';
*/

-- Dedup: registros com pkemp
BEGIN;
WITH dedup AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY ano, pkemp
           ORDER BY created_at ASC, id ASC
         ) AS rn
  FROM transparencia.despesas
  WHERE pkemp IS NOT NULL AND pkemp != ''
)
DELETE FROM transparencia.despesas
WHERE id IN (SELECT id FROM dedup WHERE rn > 1);
COMMIT;

-- Dedup: registros sem pkemp (pkemp = '' ou NULL) — dedup por linha inteira
BEGIN;
WITH dedup_nulos AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY ano, COALESCE(fornecedor_nome, ''), COALESCE(valor_empenhado, 0), COALESCE(data_empenho, '1900-01-01'), COALESCE(numero_empenho, '')
           ORDER BY id ASC
         ) AS rn
  FROM transparencia.despesas
  WHERE pkemp IS NULL OR pkemp = ''
)
DELETE FROM transparencia.despesas
WHERE id IN (SELECT id FROM dedup_nulos WHERE rn > 1);
COMMIT;

-- =============================================================
-- 5. diarias — unique: (ano, nempg, numero_liquidacao)
-- =============================================================
/*
SELECT ano, nempg, numero_liquidacao, COUNT(*) AS qtd
FROM transparencia.diarias
WHERE nempg IS NOT NULL
GROUP BY ano, nempg, numero_liquidacao
HAVING COUNT(*) > 1
ORDER BY ano, nempg;
*/

BEGIN;
WITH dedup AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY ano, COALESCE(nempg, ''), COALESCE(numero_liquidacao, '')
           ORDER BY created_at ASC, id ASC
         ) AS rn
  FROM transparencia.diarias
)
DELETE FROM transparencia.diarias
WHERE id IN (SELECT id FROM dedup WHERE rn > 1);
COMMIT;

CREATE UNIQUE INDEX IF NOT EXISTS uq_diarias_ano_nempg
  ON transparencia.diarias (ano, COALESCE(nempg, ''), COALESCE(numero_liquidacao, ''));

-- =============================================================
-- 6. licitacoes — unique: (ano, proclic)
-- =============================================================
/*
SELECT ano, proclic, COUNT(*) AS qtd
FROM transparencia.licitacoes
WHERE proclic IS NOT NULL
GROUP BY ano, proclic
HAVING COUNT(*) > 1
ORDER BY ano, proclic;

SELECT ano, tipo_licitacao, objeto FROM transparencia.licitacoes WHERE proclic IS NULL OR proclic = '';
*/

-- Dedup: registros com proclic
BEGIN;
WITH dedup AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY ano, proclic
           ORDER BY created_at ASC, id ASC
         ) AS rn
  FROM transparencia.licitacoes
  WHERE proclic IS NOT NULL AND proclic != ''
)
DELETE FROM transparencia.licitacoes
WHERE id IN (SELECT id FROM dedup WHERE rn > 1);
COMMIT;

-- Dedup: registros sem proclic — dedup por linha inteira
BEGIN;
WITH dedup_nulos AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY ano, COALESCE(tipo_licitacao, ''), COALESCE(objeto, ''), COALESCE(numero, '')
           ORDER BY id ASC
         ) AS rn
  FROM transparencia.licitacoes
  WHERE proclic IS NULL OR proclic = ''
)
DELETE FROM transparencia.licitacoes
WHERE id IN (SELECT id FROM dedup_nulos WHERE rn > 1);
COMMIT;

-- =============================================================
-- 7. contratos — unique: (ano, codigo)
-- =============================================================
/*
SELECT ano, codigo, COUNT(*) AS qtd
FROM transparencia.contratos
WHERE codigo IS NOT NULL
GROUP BY ano, codigo
HAVING COUNT(*) > 1
ORDER BY ano, codigo;

SELECT ano, numero_contrato, fornecedor FROM transparencia.contratos WHERE codigo IS NULL OR codigo = '';
*/

-- Dedup: registros com codigo
BEGIN;
WITH dedup AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY ano, codigo
           ORDER BY created_at ASC, id ASC
         ) AS rn
  FROM transparencia.contratos
  WHERE codigo IS NOT NULL AND codigo != ''
)
DELETE FROM transparencia.contratos
WHERE id IN (SELECT id FROM dedup WHERE rn > 1);
COMMIT;

-- Dedup: registros sem codigo — dedup por linha inteira
BEGIN;
WITH dedup_nulos AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY ano, COALESCE(numero_contrato, ''), COALESCE(fornecedor, ''), COALESCE(valor, 0)
           ORDER BY id ASC
         ) AS rn
  FROM transparencia.contratos
  WHERE codigo IS NULL OR codigo = ''
)
DELETE FROM transparencia.contratos
WHERE id IN (SELECT id FROM dedup_nulos WHERE rn > 1);
COMMIT;

-- =============================================================
-- 8. transferencias — sem chave única clara; dedup por linha exata
-- =============================================================
/*
SELECT ano, mes, entidade_pagadora, entidade_recebedora, repasse, COUNT(*) AS qtd
FROM transparencia.transferencias
GROUP BY ano, mes, entidade_pagadora, entidade_recebedora, repasse
HAVING COUNT(*) > 1
ORDER BY ano, mes;
*/

BEGIN;
WITH dedup AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY ano, COALESCE(mes, 0), COALESCE(entidade_pagadora, ''), COALESCE(entidade_recebedora, ''), COALESCE(repasse, 0)
           ORDER BY id ASC
         ) AS rn
  FROM transparencia.transferencias
)
DELETE FROM transparencia.transferencias
WHERE id IN (SELECT id FROM dedup WHERE rn > 1);
COMMIT;

-- =============================================================
-- 9. restos_pagar — unique: (ano, codigo)
-- =============================================================
/*
SELECT ano, codigo, COUNT(*) AS qtd
FROM transparencia.restos_pagar
WHERE codigo IS NOT NULL
GROUP BY ano, codigo
HAVING COUNT(*) > 1
ORDER BY ano, codigo;
*/

BEGIN;
WITH dedup AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY ano, COALESCE(codigo, '')
           ORDER BY created_at ASC, id ASC
         ) AS rn
  FROM transparencia.restos_pagar
)
DELETE FROM transparencia.restos_pagar
WHERE id IN (SELECT id FROM dedup WHERE rn > 1);
COMMIT;

-- =============================================================
-- 10. despesas_extra_orcamentarias — unique: (ano, codigo)
-- =============================================================
/*
SELECT ano, codigo, COUNT(*) AS qtd
FROM transparencia.despesas_extra_orcamentarias
WHERE codigo IS NOT NULL
GROUP BY ano, codigo
HAVING COUNT(*) > 1
ORDER BY ano, codigo;
*/

BEGIN;
WITH dedup AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY ano, COALESCE(codigo, '')
           ORDER BY created_at ASC, id ASC
         ) AS rn
  FROM transparencia.despesas_extra_orcamentarias
)
DELETE FROM transparencia.despesas_extra_orcamentarias
WHERE id IN (SELECT id FROM dedup WHERE rn > 1);
COMMIT;

-- =============================================================
-- 11. servidores — unique: (ano, matricula)
-- =============================================================
/*
SELECT ano, matricula, COUNT(*) AS qtd
FROM transparencia.servidores
WHERE matricula IS NOT NULL
GROUP BY ano, matricula
HAVING COUNT(*) > 1
ORDER BY ano, matricula;
*/

BEGIN;
WITH dedup AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY ano, COALESCE(matricula, '')
           ORDER BY created_at ASC, id ASC
         ) AS rn
  FROM transparencia.servidores
)
DELETE FROM transparencia.servidores
WHERE id IN (SELECT id FROM dedup WHERE rn > 1);
COMMIT;

CREATE UNIQUE INDEX IF NOT EXISTS uq_servidores_ano_matricula
  ON transparencia.servidores (ano, COALESCE(matricula, ''));

-- =============================================================
-- 12. emendas — sem chave única clara; dedup por linha exata
-- =============================================================
/*
SELECT ano, tipo_transferencia, receita_transferencia, COUNT(*) AS qtd
FROM transparencia.emendas
GROUP BY ano, tipo_transferencia, receita_transferencia
HAVING COUNT(*) > 1
ORDER BY ano, tipo_transferencia;
*/

BEGIN;
WITH dedup AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY ano, COALESCE(tipo_transferencia, ''), COALESCE(receita_transferencia, ''), COALESCE(empenhado, 0)
           ORDER BY id ASC
         ) AS rn
  FROM transparencia.emendas
)
DELETE FROM transparencia.emendas
WHERE id IN (SELECT id FROM dedup WHERE rn > 1);
COMMIT;

-- =============================================================
-- 13. obras — unique: (ano, contrato_numero)
-- =============================================================
/*
SELECT ano, contrato_numero, COUNT(*) AS qtd
FROM transparencia.obras
WHERE contrato_numero IS NOT NULL
GROUP BY ano, contrato_numero
HAVING COUNT(*) > 1
ORDER BY ano, contrato_numero;
*/

BEGIN;
WITH dedup AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY ano, COALESCE(contrato_numero, '')
           ORDER BY created_at ASC, id ASC
         ) AS rn
  FROM transparencia.obras
)
DELETE FROM transparencia.obras
WHERE id IN (SELECT id FROM dedup WHERE rn > 1);
COMMIT;

-- =============================================================
-- RESUMO — quantas linhas em cada tabela após limpeza
-- =============================================================
SELECT 'receitas' AS tabela, COUNT(*) AS linhas FROM transparencia.receitas
UNION ALL
SELECT 'receitas_detalhes', COUNT(*) FROM transparencia.receitas_detalhes
UNION ALL
SELECT 'divida_ativa', COUNT(*) FROM transparencia.divida_ativa
UNION ALL
SELECT 'despesas', COUNT(*) FROM transparencia.despesas
UNION ALL
SELECT 'diarias', COUNT(*) FROM transparencia.diarias
UNION ALL
SELECT 'licitacoes', COUNT(*) FROM transparencia.licitacoes
UNION ALL
SELECT 'contratos', COUNT(*) FROM transparencia.contratos
UNION ALL
SELECT 'transferencias', COUNT(*) FROM transparencia.transferencias
UNION ALL
SELECT 'restos_pagar', COUNT(*) FROM transparencia.restos_pagar
UNION ALL
SELECT 'despesas_extra_orcamentarias', COUNT(*) FROM transparencia.despesas_extra_orcamentarias
UNION ALL
SELECT 'servidores', COUNT(*) FROM transparencia.servidores
UNION ALL
SELECT 'emendas', COUNT(*) FROM transparencia.emendas
UNION ALL
SELECT 'obras', COUNT(*) FROM transparencia.obras
ORDER BY tabela;

-- =============================================================
-- PRONTO! As duplicatas foram removidas e constraints foram
-- adicionadas para prevenir futuras duplicatas.
-- =============================================================
