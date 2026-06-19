-- ============================================================================
-- Remove a constraint chk_tipo da tabela planejamento_documentos
-- para permitir inserir documentos complementares (ex: Parecer Controle Interno)
-- ============================================================================

ALTER TABLE transparencia.planejamento_documentos 
DROP CONSTRAINT IF EXISTS chk_tipo;
