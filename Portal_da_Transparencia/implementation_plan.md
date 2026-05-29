# Integração do Painel Admin com PNTP 2026

Este plano detalha a criação de novas abas no Painel Admin Institucional para permitir o gerenciamento manual dos dados exigidos pela Cartilha PNTP 2026, com formulários específicos para cada critério.

## Diagnóstico do Bug das Receitas

**Problema:** As tabelas de `receitas` e `receitas_detalhes` foram criadas, mas os dados não aparecem no portal.
**Causa:** Ao criar as tabelas manualmente pelo SQL Editor do Supabase, elas não recebem automaticamente a permissão de leitura para usuários anônimos (o frontend). O RLS (Row Level Security) e as permissões do Postgres estão bloqueando a leitura.
**Solução Imediata:** Fornecerei os comandos SQL exatos que você precisará rodar no Supabase para corrigir isso, sem precisar alterar código.

## User Review Required

> [!IMPORTANT]
> Precisamos confirmar a arquitetura do banco para as novas abas.
> O plano propõe criar tabelas específicas para dados estruturados (Fila do SUS, Emendas PIX) e usar o sistema existente de publicações/documentos (adaptado) para exigências que são resolvidas via PDF (Balanços, Listas Nominais).
> **Aprovação necessária:** Por favor, revise as tabelas e campos propostos abaixo e me diga se atende à forma como a Prefeitura deseja preencher esses dados.

## Proposed Changes

Para atender a Cartilha PNTP 2026 através de painéis no formato do Admin de Publicações, criaremos um sistema modular no `Portal_Institucional`.

### 1. Novo Schema de Banco de Dados (`transparencia_pntp`)

Criaremos novas tabelas no Supabase para armazenar os dados que não vêm da contabilidade.

#### [NEW] `pntp_renuncia_receita`
Para os Critérios 16.1 a 16.3:
- `tributo`: string (Ex: IPTU, ISS)
- `beneficiario`: string (Nome/CPF/CNPJ mascarado)
- `valor`: numérico
- `fundamento_legal`: string
- `ano`: inteiro

#### [NEW] `pntp_emendas_pix` (Transferências Especiais)
Para o Critério 17.2:
- `autor_emenda`: string
- `valor_recebido`: numérico
- `data_recebimento`: date
- `objeto_finalidade`: text
- `pdf_plano_trabalho`: string (URL)

#### [NEW] `pntp_obras_publicas`
- `descricao_objeto`: text
- `localizacao`: text
- `valor_total`: numérico
- `situacao`: string (Em andamento, Paralisada, Concluída)
- `motivo_paralisacao`: text (obrigatório se paralisada)
- `pdf_planilha_quantitativos`: string (URL)

#### [NEW] `pntp_saude`
Para os Critérios 18.2 a 18.5:
- Tabela `pntp_saude_filas`: `especialidade`, `quantidade_aguardando`, `data_atualizacao`.
- Tabela `pntp_saude_medicamentos`: `nome_medicamento`, `status_estoque` (Disponível/Falta), `ultima_atualizacao`.

#### [NEW] `pntp_educacao`
Para o Critério 19.2:
- Tabela `pntp_educacao_creches`: `unidade_escolar`, `vagas_oferecidas`, `fila_espera`.

### 2. Painel Admin (UI) no Portal_Institucional

Criaremos uma nova área centralizadora no painel admin atual (`/admin/pntp`) com abas laterais/superiores para navegar por esses formulários.

#### [NEW] `app/admin/pntp/layout.tsx`
Layout compartilhado com menu de navegação lateral contendo os links:
- Renúncia de Receitas
- Emendas PIX
- Obras Públicas
- Saúde (Filas e Medicamentos)
- Educação (Creches)
- Documentos Especiais (Estagiários, Terceirizados, Relatórios Fiscais - reaproveitando ou criando uma visão focada do módulo atual de publicações).

#### [NEW] `app/admin/pntp/renuncia/page.tsx` (e `/nova`, `/editar`)
Painel completo seguindo a identidade visual (Lucide icons, botões azuis, Tailwind) para CRUD de Renúncias de Receitas.

#### [NEW] `app/admin/pntp/emendas-pix/page.tsx`
Painel para Emendas PIX, incluindo campo para upload de PDF do Plano de Trabalho para o bucket (integrando com o `/api/upload` já existente).

#### [NEW] `app/admin/pntp/saude/page.tsx`
Painel com duas sessões: Medicamentos da REMUME e Filas de Especialidades.

### 3. Ajuste do Portal da Transparência (Front-end Público)

As páginas públicas no `Portal_da_Transparencia` precisarão buscar e exibir os dados preenchidos nesse novo admin.

#### [MODIFY] `Portal_da_Transparencia/app/(paginas)/S...`
Alteraremos as páginas de Receitas, Despesas, Obras, Saúde e Educação para ler do schema `transparencia_pntp` quando os dados forem provenientes do admin.

---

## Verification Plan

### Manual Verification
1. Rodarei o script de criação das novas tabelas e solicitarei que o usuário aplique os `GRANT` no Supabase.
2. Abriremos o Admin Institucional, testaremos o fluxo de criação de uma "Renúncia de Receita" e faremos upload de um PDF de teste para "Emendas PIX".
3. Validaremos se o banco de dados armazena as informações corretamente e se elas estão prontas para serem puxadas pelo Portal da Transparência.
