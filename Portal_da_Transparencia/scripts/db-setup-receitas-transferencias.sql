-- Tabelas para armazenar as receitas de transferências da União e do Estado (PNTP)
-- Criar no Schema "transparencia"

create table if not exists transparencia.receitas_transferencias (
  id uuid not null default gen_random_uuid (),
  exercicio integer not null,
  tipo character varying(20) not null, -- 'UNIAO' ou 'ESTADO'
  ordem integer null,
  codigo character varying(50) null,
  especificacao text null,
  previsao_inicial numeric(16, 2) null,
  previsao_atualizada numeric(16, 2) null,
  arrecadado_periodo numeric(16, 2) null,
  arrecadado_total numeric(16, 2) null,
  data_importacao timestamp without time zone null default now(),
  constraint receitas_transferencias_pkey primary key (id)
) TABLESPACE pg_default;

-- Opcional: Índice para otimizar as buscas por ano e tipo
create index if not exists idx_receitas_transferencias_exercicio_tipo on transparencia.receitas_transferencias (exercicio, tipo);
