# 🗄️ Tabelas Supabase — Portal da Transparência

Este documento descreve todas as tabelas necessárias no Supabase para o funcionamento completo do Portal da Transparência de Padre Marcos - PI.

---

## 📋 Lista de Tabelas

| # | Tabela | Finalidade | Status |
|---|--------|------------|--------|
| 1 | `manifestacoes_esic` | Solicitações de informação (e-SIC) | ✅ Já existe |
| 2 | `ouvidoria_manifestacoes` | Manifestações da Ouvidoria | ✅ Já existe |
| 3 | `legislacoes` | Leis, decretos, portarias e atos normativos | ✅ Já existe |
| 4 | `publicacoes` | Publicações oficiais (editais, atas, etc.) | ✅ Já existe |
| 5 | `noticias` | Notícias do município | ✅ Já existe |
| 6 | `diarias` | Diárias e passagens concedidas | 🔲 Nova |
| 7 | `emendas_parlamentares` | Emendas parlamentares recebidas | 🔲 Nova |
| 8 | `concursos` | Concursos e processos seletivos | 🔲 Nova |

---

## 1. `manifestacoes_esic` — e-SIC (Serviço de Informação ao Cidadão)

```sql
CREATE TABLE manifestacoes_esic (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocolo     TEXT UNIQUE NOT NULL,
  nome          TEXT NOT NULL,
  email         TEXT NOT NULL,
  cpf           TEXT,
  telefone      TEXT,
  descricao     TEXT NOT NULL,
  orgao_destinatario TEXT,
  status        TEXT NOT NULL DEFAULT 'recebido'
                CHECK (status IN ('recebido','em_analise','respondido','indeferido','prorrogado')),
  resposta      TEXT,
  resposta_anexo_url TEXT,
  justificativa_indeferimento TEXT,
  data_prorrogacao     TIMESTAMPTZ,
  motivo_prorrogacao   TEXT,
  prazo_resposta TIMESTAMPTZ NOT NULL,
  respondido_em TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- RLS: anônimo pode INSERT e SELECT próprio; admin pode tudo
```

**Tipos:** `lib/types/esic.ts`

---

## 2. `ouvidoria_manifestacoes` — Ouvidoria Municipal

```sql
CREATE TABLE ouvidoria_manifestacoes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocolo     TEXT UNIQUE NOT NULL,
  tipo          TEXT NOT NULL
                CHECK (tipo IN ('denuncia','reclamacao','solicitacao','sugestao','elogio')),
  nome          TEXT NOT NULL,
  email         TEXT NOT NULL,
  cpf           TEXT,
  telefone      TEXT,
  descricao     TEXT NOT NULL,
  orgao_destinatario TEXT,
  status        TEXT NOT NULL DEFAULT 'recebido'
                CHECK (status IN ('recebido','em_analise','respondido','indeferido','prorrogado')),
  resposta      TEXT,
  resposta_anexo_url TEXT,
  justificativa_indeferimento TEXT,
  data_prorrogacao     TIMESTAMPTZ,
  motivo_prorrogacao   TEXT,
  prazo_resposta TIMESTAMPTZ NOT NULL,
  respondido_em TIMESTAMPTZ,
  anonimo       BOOLEAN DEFAULT false,
  anexo_url     TEXT,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);
```

**Tipos:** `lib/types/ouvidoria.ts`

---

## 3. `legislacoes` — Leis e Normas

```sql
CREATE TABLE legislacoes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo          TEXT NOT NULL,
  tipo            TEXT,
  numero          TEXT,
  ano             INTEGER NOT NULL,
  descricao       TEXT,
  orgao           TEXT,
  data_publicacao DATE,
  arquivo_url     TEXT,
  arquivo_r2_url  TEXT,
  slug            TEXT UNIQUE,
  publicado       BOOLEAN DEFAULT true,
  conteudo_html   TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);
```

**API Routes:** `app/api/admin/legislacoes/`

---

## 4. `publicacoes` — Publicações Oficiais

```sql
CREATE TABLE publicacoes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo          TEXT NOT NULL,
  tipo            TEXT,
  numero          TEXT,
  ano             INTEGER NOT NULL,
  descricao       TEXT,
  orgao           TEXT,
  data_publicacao DATE,
  arquivo_url     TEXT,
  arquivo_r2_url  TEXT,
  slug            TEXT UNIQUE,
  publicado       BOOLEAN DEFAULT true,
  conteudo_html   TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);
```

**API Routes:** `app/api/admin/publicacoes/`

---

## 5. `noticias` — Notícias

```sql
CREATE TABLE noticias (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo          TEXT NOT NULL,
  slug            TEXT UNIQUE NOT NULL,
  conteudo        TEXT NOT NULL,
  resumo          TEXT,
  imagem_url      TEXT,
  autor           TEXT,
  publicado       BOOLEAN DEFAULT true,
  data_publicacao TIMESTAMPTZ DEFAULT now(),
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);
```

---

## 6. `diarias` — Diárias e Passagens 🔲 NOVA

```sql
CREATE TABLE diarias (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  servidor            TEXT NOT NULL,
  cargo               TEXT NOT NULL,
  destino             TEXT NOT NULL,
  periodo_inicio      DATE NOT NULL,
  periodo_fim         DATE NOT NULL,
  valor               NUMERIC(12,2) NOT NULL,
  objetivo            TEXT NOT NULL,
  data_concessao      DATE NOT NULL,
  data_prestacao_contas DATE,
  status              TEXT NOT NULL DEFAULT 'pendente'
                      CHECK (status IN ('pendente','concluida','cancelada')),
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX idx_diarias_servidor ON diarias(servidor);
CREATE INDEX idx_diarias_data_concessao ON diarias(data_concessao);
CREATE INDEX idx_diarias_status ON diarias(status);
```

**Tipos:** `lib/types/transparencia.ts` → `Diaria`

---

## 7. `emendas_parlamentares` — Emendas Parlamentares 🔲 NOVA

```sql
CREATE TABLE emendas_parlamentares (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero              TEXT NOT NULL,
  ano                 INTEGER NOT NULL,
  tipo                TEXT NOT NULL
                      CHECK (tipo IN ('individual','bancada','comissao','relator')),
  autor               TEXT NOT NULL,
  autor_cargo         TEXT NOT NULL,
  valor_previsto      NUMERIC(14,2) NOT NULL,
  valor_recebido      NUMERIC(14,2),
  objeto              TEXT NOT NULL,
  orgao_responsavel   TEXT NOT NULL,
  status              TEXT NOT NULL DEFAULT 'prevista'
                      CHECK (status IN ('prevista','recebida','em_execucao','concluida','cancelada')),
  data_recebimento    DATE,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX idx_emendas_ano ON emendas_parlamentares(ano);
CREATE INDEX idx_emendas_autor ON emendas_parlamentares(autor);
CREATE INDEX idx_emendas_status ON emendas_parlamentares(status);
```

**Tipos:** `lib/types/transparencia.ts` → `EmendaParlamentar`

---

## 8. `concursos` — Concursos e Processos Seletivos 🔲 NOVA

```sql
CREATE TABLE concursos (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo              TEXT NOT NULL,
  tipo                TEXT NOT NULL
                      CHECK (tipo IN ('concurso','processo_seletivo','teste_seletivo')),
  numero_edital       TEXT NOT NULL,
  ano                 INTEGER NOT NULL,
  descricao           TEXT NOT NULL,
  status              TEXT NOT NULL DEFAULT 'aberto'
                      CHECK (status IN ('aberto','em_andamento','homologado','cancelado')),
  data_abertura       DATE NOT NULL,
  data_encerramento   DATE,
  data_homologacao    DATE,
  arquivo_edital_url  TEXT,
  arquivo_resultado_url TEXT,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX idx_concursos_status ON concursos(status);
CREATE INDEX idx_concursos_ano ON concursos(ano);
```

**Tipos:** `lib/types/transparencia.ts` → `Concurso`

---

## 🔐 Variáveis de Ambiente (.env.local)

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

---

## 📦 Passo a passo para integrar

### 1. Criar as tabelas no Supabase

Acesse o SQL Editor do Supabase e execute os `CREATE TABLE` statements acima.

### 2. Configurar RLS (Row Level Security)

Para `diarias`, `emendas_parlamentares` e `concursos`:

```sql
-- Habilitar RLS
ALTER TABLE diarias ENABLE ROW LEVEL SECURITY;
ALTER TABLE emendas_parlamentares ENABLE ROW LEVEL SECURITY;
ALTER TABLE concursos ENABLE ROW LEVEL SECURITY;

-- Política: qualquer um pode SELECT (dados públicos)
CREATE POLICY "Select público" ON diarias FOR SELECT USING (true);
CREATE POLICY "Select público" ON emendas_parlamentares FOR SELECT USING (true);
CREATE POLICY "Select público" ON concursos FOR SELECT USING (true);

-- Política: apenas service_role pode INSERT/UPDATE/DELETE
-- (via API routes protegidas)
```

### 3. Criar as API Routes

Para cada tabela nova, crie uma API Route similar ao padrão existente:

```
app/api/transparencia/diarias/route.ts
app/api/transparencia/emendas/route.ts
app/api/transparencia/concursos/route.ts
```

### 4. Testar

Após criar as tabelas, execute `npm run build` para verificar se os tipos estão corretos.

---

> **Documentação gerada em:** maio/2026  
> **Última atualização:** 15/05/2026
