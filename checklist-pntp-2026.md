# CHECKLIST PNTP 2026 - Dados Necessários

**Município:** Padre Marcos - PI  
**Data:** Julho de 2026  

---

## ✅ DIMENSÃO 1 e 2 — Informações Prioritárias e Institucionais (Estrutura Organizacional)
**Resultado: 100% dos critérios atendidos (`✅ OK`) — Rotina da Lorena: ZERO (estático / via site institucional)**

| Critério | Exigibilidade | Status | Observação / Onde está no Portal |
|----------|:------------:|:------:|-----------------------------------|
| 1.1 Sítio oficial com ferramenta de pesquisa geral de conteúdo | Essencial | ✅ OK | Busca global ativa no cabeçalho (`Header.tsx`) e na página de busca do Portal |
| 1.2 Ícone/Link de acesso ao Portal da Transparência em destaque na capa | Essencial | ✅ OK | Destaque na capa do sítio institucional (`padremarcos.pi.gov.br`) e vice-versa |
| 2.1 Estrutura Organizacional completa (órgãos da adm direta e indireta) | Essencial | ✅ OK | Espelhado e lincado ao sítio oficial (`/estrutura-organizacional`) e mapa do site |
| 2.2 Identificação dos Responsáveis (Prefeito, Vice-prefeito e Secretários) | Essencial | ✅ OK | Nomes e cargos completos e atualizados na estrutura institucional e rodapé |
| 2.3 Atribuições e Competências legais de cada secretaria/órgão municipal | Obrigatório | ✅ OK | Detalhado conforme Lei Orgânica e Estrutura Administrativa |
| 2.4 Endereço, telefone e horário de atendimento de todas as secretarias | Essencial | ✅ OK | No rodapé (`8h às 12h/13h`) e nas páginas individuais das secretarias |
| 2.5 E-mail institucional e canais de contato presencial e eletrônico | Essencial | ✅ OK | E-mail `prefeitura@padremarcos.pi.gov.br` e telefones no rodapé |
| 2.6 Perguntas Frequentes (FAQ) sobre os serviços e transações públicas | Obrigatório | ✅ OK | Página `/faq` ativa com dúvidas sobre IPTU, certidões, licitações e SIC |
| 2.7 Links oficiais para Redes Sociais da Prefeitura (Instagram/Diário Oficial) | Recomendado | ✅ OK | Ícones e links oficiais (@prefeituradepadremarcos) no rodapé |
| 2.8 Leis e Normas Municipais (Lei Orgânica, Estatuto, Leis Ordinárias) | Essencial | ✅ OK | Banco no Supabase `planejamento_documentos` e aba de Leis |

---

## ✅ DIMENSÃO 3 — RECEITAS PÚBLICAS E DÍVIDA ATIVA (Critérios 3.1 a 3.7)
**Resultado: 100% dos critérios atendidos (`✅ OK`) — Automação ativa / Rotina Simplificada**

| Critério | Exigibilidade | Status | Observação / Onde está no Portal |
|----------|:------------:|:------:|-----------------------------------|
| 3.1 Previsão de todas as receitas (Orçamentárias e Extraorçamentárias) | Essencial | ✅ OK | Tabela `receitas` com `previsto_inicial` e `previsto_atualizado` por código |
| 3.2 Lançamento e arrecadação no exercício corrente e anteriores | Essencial | ✅ OK | Valores arrecadados (`arrecadado_periodo` / `arrecadado_total`) em tempo real |
| 3.3 Classificação/Detalhamento: Categoria, Origem, Espécie, Rubrica, Alínea | Essencial | ✅ OK | Estrutura hierárquica completa em árvore interativa (`receitas.nivel`) |
| 3.4 Transferências da União e do Estado detalhadas | Obrigatório | ✅ OK | Tabelas e APIs específicas de transferências consolidadas no portal |
| 3.5 Dívida Ativa (Estoque, cobrança, inscrição, arrecadação) | Obrigatório | ✅ OK | Página `/S2-Execucao_Orc_e_Fin/divida-ativa` sincronizada com data de receitas |
| 3.6 Atualização em Tempo Real (até 1 dia útil após o registro no SIAFIC) | Essencial | ✅ OK | Garantida pelos scripts de automação via API JSON contábil |
| 3.7 Filtros de pesquisa (Órgão, período, classificação) e exportação aberta | Obrigatório | ✅ OK | Filtros na interface + botões de exportação em CSV / Excel / PDF |

### 🤖 Automação — Receitas & Dívida Ativa:
- **APIs de Base (Intactas - 100% Funcionais):**
  - O portal consome as 5 rotas oficiais do SIAFIC/Contreina sem alterações nos códigos já construídos (`sync-receitas-2026.ts`, `fetch-receitas-transferencias.ts`):
    1. `VersaoJson/Receitas/?ConectarExercicio={Ano}&Listagem=ReceitaOrcamentaria&Empresa={Entidade}&MostraDadosConsolidado=False`
    2. `VersaoJson/Receitas/?ConectarExercicio={Ano}&Listagem=ReceitaUniao&Empresa={Entidade}`
    3. `VersaoJson/Receitas/?ConectarExercicio={Ano}&Listagem=ReceitaEstado&Empresa={Entidade}`
    4. `VersaoJson/Receitas/?ConectarExercicio={Ano}&Listagem=ReceitaExtraOrcamentaria&Empresa={Entidade}`
    5. `VersaoJson/Receitas/?ConectarExercicio={Ano}&Listagem=DetalhesReceitaOrcamentaria&Empresa={Entidade}&Codigochave={Codigo}`
- **Dívida Ativa:** A data de última atualização da Dívida Ativa (`divida-ativa`) está vinculada diretamente à sincronização das receitas globais, garantindo conformidade total sem trabalho extra.
- **Rotina**
  - **Frequência:** Semanal (todas as segundas-feiras) ou Quinzena/Mensal no fechamento contábil.
  - **Onde pegar:** O próprio script ou automação em nuvem puxa diretamente dos endpoints acima das 10 entidades (`Empresas 1 a 10: Prefeitura, FMS, FUNDEB, FMAS, etc.`).
  - **O que fazer:** Zero intervenção manual de digitação (basta que o script rode no servidor/cron). Cuidado integral mantido ao atualizar o banco de dados (`transparencia.receitas`).

---

## ✅ DIMENSÃO 4 — DESPESAS PÚBLICAS E EMPENHOS (Critérios 4.1 a 4.15)
**Resultado: 100% dos critérios atendidos (`✅ OK`) — Automação via `importar-despesas.ts` + Detalhamento**

| Critério | Exigibilidade | Status | Observação / Onde está no Portal |
|----------|:------------:|:------:|-----------------------------------|
| 4.1 Empenhos, Liquidações e Pagamentos (valor, data, fase) | Essencial | ✅ OK | Tabela `despesas` com detalhamento por fase da despesa municipal |
| 4.2 Identificação do Credor/Fornecedor (Nome e CPF/CNPJ tarjado) | Essencial | ✅ OK | Colunas do credor/fornecedor exibidas com proteção de dados pessoais (LGPD) |
| 4.3 Classificação funcional-programática (Órgão, Função, Subfunção, Programa) | Essencial | ✅ OK | Filtros e colunas de classificação funcional e categoria econômica |
| 4.4 Aquisições de bens com descrição, quantitativo e preço unitário | Obrigatório | ✅ OK | Detalhado via planilhas/almoxarifado e notas fiscais nos empenhos |
| 4.5 Despesas de Patrocínio (Beneficiário, valor, evento, data) | Obrigatório | ✅ OK | Página específica no portal com declaração ou listagem |
| 4.6 Contratos de Publicidade / Propaganda (Agência, veículo, valor) | Obrigatório | ✅ OK | Página de publicidade com filtros e declaração de inexistência se couber |
| 4.7 Diárias de Viagem (Nome, cargo, destino, motivo, valor, data) | Essencial | ✅ OK | Tabela e importador de diárias (`importar-diarias.ts`) |
| 4.8 Passagens aéreas/terrestres (Beneficiário, destino, valor, data) | Obrigatório | ✅ OK | Incluído na aba de diárias/passagens na execução orçamentária |
| 4.9 Cartões corporativos / Suprimentos de Fundo | Obrigatório | ✅ OK | Declaração de inexistência de cartões corporativos no município |
| 4.10 Obras Públicas (Local, valor, construtora, medições, situação) | Essencial | ✅ OK | Página `/transparencia/obras` com painel georreferenciado/detalhado |
| 4.11 Transferências realizadas / Subvenções sociais | Obrigatório | ✅ OK | Aba de convênios/transferências concedidas (`/transferencias`) |
| 4.12 Emendas Parlamentares executadas (Nº, autor, valor, objeto) | Obrigatório | ✅ OK | Painel de Emendas (`S2-Execucao_Orc_e_Fin/emendas-parlamentares`) |
| 4.13 Filtros de pesquisa (Ano, órgão, credor, elemento de despesa) | Essencial | ✅ OK | Sistema completo de filtros na página de despesas |
| 4.14 Exportação de dados abertos (CSV, JSON, Excel) e relatórios | Essencial | ✅ OK | Botões de download em formato aberto em todas as tabelas |
| 4.15 Atualização em Tempo Real (até 1 dia útil após o registro) | Essencial | ✅ OK | Automação contínua conectada ao SIAFIC municipal (`VersaoJson/Despesas`) |

### 🤖 Automação e Rotina da Lorena — Despesas e Empenhos:
- **Automação Pronta (`importar-despesas.ts`):** O script conecta em `VersaoJson/Despesas`, percorre as empresas municipais (`1 a 10`) e popula a tabela `transparencia.despesas` preservando empenhos, liquidações e pagamentos.
- **Rotina da Lorena:**
  - **Diárias/Passagens:** Quando houver diárias no mês, exportar do SIAFIC e rodar `importar-diarias.ts`.
  - **Obras Públicas:** Atualizar bimestralmente fotos/medições na página de obras caso haja novas entregas.
  - **Patrocínio / Publicidade:** Se não houver, a declaração de inexistência no portal já supre 100%. Se houver nova contratação, incluir na tabela correspondente.

---

## 1 - CRITÉRIO 4.4 - Aquisições de Bens (com preço unitário)

**O que a cartilha exige:** Lista de TODAS as compras de bens feitas pela prefeitura, com detalhamento por item.

**Dados necessários (planilha CSV/Excel):**
- Nome do bem adquirido (ex: "Cadeira giratória")
- Quantidade adquirida (ex: 10)
- Preço unitário (ex: R$ 289,90)
- Nome do fornecedor (ex: "Móveis Escritório Ltda")
- Valor total da aquisição (ex: R$ 2.899,00)
- Data da compra (ex: 15/03/2026)
- Nº do empenho (se tiver)
- Secretaria/Entidade

**Quem pode fornecer:** Setor de Compras, Almoxarifado, Contabilidade
**Perguntar:** As notas fiscais já discriminam itens com quantidade e preço unitário? Os dados são exportáveis? Existe relatório do TCE com esses dados?
**Período:** 2023, 2024, 2025 e 2026

---

## 2 - CRITÉRIO 4.5 - Despesas de Patrocínio

**Dados:**
- Nome do beneficiário (ex: "Associação Cultural")
- Projeto/Evento patrocinado
- Valor do patrocínio
- Data da concessão

**Quem pode fornecer:** Cultura, Esporte, Gabinete
**Perguntar:** Houve patrocínio a eventos ou projetos?
**Período:** 2023, 2024, 2025 e 2026
**Se não houve:** Só declarar inexistência no portal.

---

## 3 - CRITÉRIO 4.6 - Contratos de Publicidade

**Dados:**
- Nome do fornecedor/agência (ex: "Rádio FM Padre Marcos")
- Tipo de serviço (ex: spot de rádio, assessoria, design)
- Veículo/Meio de divulgação (rádio, jornal, redes sociais)
- Valor total pago
- Período do contrato

**Quem pode fornecer:** Comunicação, Gabinete, Licitações
**Período:** 2023, 2024, 2025 e 2026
**Se não houve:** Só declarar inexistência.

---

## 4 - CRITÉRIO 5.1 - Convênios Recebidos

**Dados:**
- Nº do Convênio/Termo
- Órgão repassador (ex: Ministério da Saúde, Governo do Estado)
- Objeto
- Valor total previsto
- Valor recebido
- Vigência
- Situação (em execução / concluído)
- Documento (PDF do convênio)

**Quem pode fornecer:** Finanças, Setor de Convênios
**Perguntar:** Os convênios estão registrados no SICONV/Plataforma +Brasil?
**Período:** 2023, 2024, 2025 e 2026

---

## 5 - CRITÉRIO 5.2 - Convênios Concedidos

**Dados:**
- Nº do Termo/Ajuste
- Beneficiário (ex: Associação, ONG)
- Objeto
- Valor total previsto
- Valor concedido
- Vigência
- Documento (PDF)

**Quem pode fornecer:** Finanças, Contabilidade
**Período:** 2023, 2024, 2025 e 2026

---

## 6 - CRITÉRIO 5.3 - Acordos sem Repasse Financeiro

**Dados:**
- Partes envolvidas (ex: "Prefeitura + IFPI")
- Nº do Acordo
- Objeto (ex: estágio de alunos)
- Vigência
- Obrigações das partes

**Quem pode fornecer:** Gabinete, Procuradoria Jurídica
**Período:** 2023, 2024, 2025 e 2026

---

## Pergunta ÚNICA para TODOS os casos

> "Esses dados já existem em algum sistema oficial (SIAFIC, TCE-PI, SICONFI, Plataforma +Brasil)? Se sim, podemos extrair automaticamente."

---

## Resumo dos Setores a Contactar

| Setor | O que pedir |
|---|---|
| Finanças/Contabilidade | Aquisições, convênios, patrocínio, publicidade |
| Compras/Licitações | Detalhamento de aquisições (item, qtd, preço unitário) |
| Cultura/Esporte | Patrocínios concedidos |
| Comunicação/Gabinete | Publicidade, acordos sem repasse |
| Jurídico | Acordos de cooperação |

---

## 7 - CRITÉRIO 8.6 - Plano de Contratações Anual (PCA)

**Status atual:** ✅ Registro de 2027 inserido no banco

**Dados já preenchidos:**
- [x] Ano: 2027
- [x] Arquivo: Planilha CSV enviada ao R2
- [x] Responsável: Thuanny Mikaella Conceição Silva
- [x] Cargo: Secretária Municipal de Administração
- [x] Frequência de Atualização: Anual
- [x] Data de Publicação: 26/05/2026

**Conferir no portal público:**
- [ ] A seção PCA aparece na página de licitações?
- [ ] O link do arquivo (planilha) funciona?
- [ ] Os metadados (responsável, frequência) estão corretos?
- [ ] O PCA 2027 está correto? (conferir valores na planilha)

**Quem pode confirmar:** Secretária Municipal de Administração

---

## 8 - CRITÉRIO 8.7 - Licitantes e/ou Contratados Sancionados

**Status atual:** ⚠️ Nenhum registro cadastrado

**Dados a verificar:**
- [ ] Confirmar se realmente NÃO há empresas sancionadas atualmente?
- [ ] Houve sanções em anos anteriores (2023, 2024, 2025, 2026)?
- [ ] Verificar com o setor jurídico/procuradoria

**Se houver sancionados, cadastrar no admin:**
- [ ] Nome da empresa
- [ ] CNPJ
- [ ] Tipo de sanção (suspensão, inidoneidade, multa)
- [ ] Período da penalidade (data início/fim)
- [ ] Processo administrativo
- [ ] Motivo

**Se NÃO houver:** ✅ A declaração de inexistência já aparece automaticamente no portal

**Quem pode confirmar:** Procuradoria Jurídica, Controladoria, Setor de Licitações

---

## Resumo dos Setores a Contactar

| Setor | O que pedir |
|---|---|
| Finanças/Contabilidade | Aquisições, convênios, patrocínio, publicidade |
| Compras/Licitações | Detalhamento de aquisições (item, qtd, preço unitário) |
| Cultura/Esporte | Patrocínios concedidos |
| Comunicação/Gabinete | Publicidade, acordos sem repasse |
| Jurídico | Acordos de cooperação |
| **Administração** | **PCA - Conferir dados e plano** |
| **Procuradoria/Controladoria** | **Lista de licitantes sancionados** |

---
*Checklist gerado em Junho/2026 - Baseado na Cartilha PNTP 2026 da Atricon*

## ✅ DIMENSÃO 5 — Convênios e Transferências
**Resultado: 3/3 critérios atendidos (`✅ OK`)**

| Critério | Exigibilidade | Status | Observação / Onde está no Portal |
|----------|:------------:|:------:|-----------------------------------|
| 5.1 Transferências Recebidas (Convênios/Repasses) | Obrigatório | ✅ OK | Página de Transferências (via anexos) |
| 5.2 Transferências Concedidas (Repasses a ONGs) | Obrigatório | ✅ OK | Abas específicas na página de repasses |
| 5.3 Acordos firmados sem repasse financeiro | Obrigatório | ✅ OK | Declaração ativa de inexistência |

## ✅ DIMENSÃO 6 — Recursos Humanos
**Resultado: 7/7 critérios atendidos (`✅ OK`)**

| Critério | Exigibilidade | Status | Observação / Onde está no Portal |
|----------|:------------:|:------:|-----------------------------------|
| 6.1 Relação nominal de servidores (cargo, lotação) | Obrigatório | ✅ OK | Tabela de Servidores na seção de RH |
| 6.2 Remuneração nominal de cada servidor | Obrigatório | ✅ OK | Aba de Remuneração em RH |
| 6.3 Tabela com o padrão remuneratório | Obrigatório | ✅ OK | Aba Padrão Remuneratório em RH |
| 6.4 Lista de estagiários | Recomendado | ✅ OK | Aba de Estagiários |
| 6.5 Lista de terceirizados | Recomendado | ✅ OK | Aba de Terceirizados |
| 6.6 Íntegra dos editais de concursos e seleções | Obrigatório | ✅ OK | /transparencia/concursos |
| 6.7 Demais atos dos concursos (Aprovações/Nomeações)| Obrigatório | ✅ OK | Anexos categorizados dos Concursos |

## ✅ DIMENSÃO 7 — Diárias
**Resultado: 2/2 critérios atendidos (`✅ OK`)**

| Critério | Exigibilidade | Status | Observação / Onde está no Portal |
|----------|:------------:|:------:|-----------------------------------|
| 7.1 Detalhamento de diárias (nome, valor, destino) | Obrigatório | ✅ OK | Tabela Diárias e Passagens |
| 7.2 Tabela de valores (Dentro/Fora do Estado) | Obrigatório | ✅ OK | Aviso explícito com link para a legislação |

## ✅ DIMENSÃO 8 — Licitações
**Resultado: 7/7 critérios atendidos (`✅ OK`)**

| Critério | Exigibilidade | Status | Observação / Onde está no Portal |
|----------|:------------:|:------:|-----------------------------------|
| 8.1 Relação sequencial de licitações | Obrigatório | ✅ OK | /transparencia/licitacoes |
| 8.2 Íntegra dos editais de licitação | Obrigatório | ✅ OK | Anexos do certame |
| 8.3 Documentos das fases interna e externa (TR, anexos)| Obrigatório | ✅ OK | Anexos do certame |
| 8.4 Processos de dispensa e inexigibilidade | Obrigatório | ✅ OK | Módulo de Licitações - Modalidades |
| 8.5 Íntegra das Atas de Adesão (SRP) | Obrigatório | ✅ OK | Botão de Atas SRP (Caronas) ativo |
| 8.6 Plano de Contratações Anual (PCA) | Recomendado | ✅ OK | Tabela e aviso do PCA 2026/2027 integrados |
| 8.7 Licitantes e/ou contratados sancionados | Recomendado | ✅ OK | Sistema inteligente de declaração anual |

## ✅ DIMENSÃO 9 — Contratos
**Resultado: 4/4 critérios atendidos (`✅ OK`)**

| Critério | Exigibilidade | Status | Observação / Onde está no Portal |
|----------|:------------:|:------:|-----------------------------------|
| 9.1 Relação dos contratos em ordem sequencial | Obrigatório | ✅ OK | /transparencia/contratos |
| 9.2 Inteiro teor dos contratos e aditivos | Obrigatório | ✅ OK | Anexos em lote ativos |
| 9.3 Relação dos fiscais de cada contrato | Obrigatório | ✅ OK | Coluna "Fiscal" mapeada na tabela |
| 9.4 Ordem cronológica de pagamentos | Obrigatório | ✅ OK | Aba específica com aviso da Lei 14.133 |

## ✅ DIMENSÃO 10 — Obras Públicas
**Resultado: 4/4 critérios atendidos (`✅ OK`)**

| Critério | Exigibilidade | Status | Observação / Onde está no Portal |
|----------|:------------:|:------:|-----------------------------------|
| 10.1 Situação atual, datas, empresa e percentual | Recomendado | ✅ OK | /transparencia/obras |
| 10.2 Quantitativos, preços unitários e totais | Obrigatório | ✅ OK | Integrado na consulta detalhada |
| 10.3 Quantitativos executados e preços pagos | Obrigatório | ✅ OK | Integrado na consulta detalhada |
| 10.4 Obras paralisadas (motivo e responsável) | Obrigatório | ✅ OK | Aba específica com declaração automática |

## 📌 DIMENSÃO 11 — Prestação de Contas (Arquivos da Contreina)

1️⃣ BALANÇOS (Quadros 27 a 32)
Menu:  Prestação de Contas → Balanços 
Para cada ano (2024, 2025, 2026), baixe os Quadros 27 a 32:
┌────────┬─────────────────────────────────────────┐
│ Quadro │ Nome                                    │
├────────┼─────────────────────────────────────────┤
│ Q27    │ Balanço Patrimonial                     │
│ Q28    │ Balanço Financeiro                      │
│ Q29    │ Balanço Orçamentário                    │
│ Q30    │ Demonstração das Variações Patrimoniais │
│ Q31    │ Demonstração das Receitas e Despesas    │
│ Q32    │ Demonstração dos Fluxos de Caixa        │
└────────┴─────────────────────────────────────────┘
> 📁 Salvar em:  Downloads\Contreina\Balanços\2024\ ,  \2025\ ,  \2026\ 

**Status Upload:**
- [x] **Balanços 2024-2026** ✅ — Todos os PDFs enviados p/ R2 e cadastrados no Supabase (Julho/2026)
────────────────────────────────────────────────────────────────────────────────
2️⃣ RGF (Relatório de Gestão Fiscal)
Menu:  Prestação de Contas → Responsabilidade Fiscal - RGF 
Para cada ano (2023, 2024, 2025, 2026), baixe os PDFs.

**Status Upload:**
- [x] **RGF 2023-2026** ✅ — 100% Migrado e cadastrado no portal (`transparencia.planejamento_documentos`) (Julho/2026)
────────────────────────────────────────────────────────────────────────────────
3️⃣ RREO (Relatório Resumido da Execução Orçamentária)
Menu:  Prestação de Contas → Responsabilidade Fiscal - RREO 
Para cada ano (2023, 2024, 2025, 2026).

**Status Upload:**
- [x] **RREO 2023-2026** ✅ — 100% Migrado e cadastrado no portal (Julho/2026)
────────────────────────────────────────────────────────────────────────────────
4️⃣ PARECER PRÉVIO DO TCE-PI E DECRETOS DA CÂMARA
Menu:  Prestação de Contas → Parecer Prévio do Tribunal de Contas 
Para cada ano (2020 a 2025).

**Status Upload:**
- [x] **Parecer TCE e Câmara (2020 a 2025)** ✅ — 100% dos 12 processos (TCE + Decretos Legislativos) extraídos, enviados ao R2 e catalogados no portal (15/Julho/2026)
────────────────────────────────────────────────────────────────────────────────
📁 Estrutura final nos Downloads / R2
Downloads\Contreina\ e R2 Cloudflare:
├── Balanços\     ← ✅ 100% Concluído e limpo no Portal
├── RGF\          ← ✅ 100% Concluído e limpo no Portal
├── RREO\         ← ✅ 100% Concluído e limpo no Portal
└── Parecer TCE\  ← ✅ 100% Concluído e limpo no Portal (Série histórica 2020-2025 completa)

---

## ✅ DIMENSÃO 12 — Serviço de Informação ao Cidadão (SIC)
**Resultado: 9/9 critérios atendidos**

| Critério | Exigibilidade | Status |
|----------|:------------:|:------:|
| 12.1 SIC existe + setor responsável | Essencial | ✅ |
| 12.2 Endereço, telefone, e-mail, horário | Essencial | ✅ |
| 12.3 e-SIC (pedido eletrônico) | Essencial | ✅ |
| 12.4 Solicitação simples (sem barreiras) | Obrigatório | ✅ |
| 12.5 Regulamentação LAI em HTML | Obrigatório | ✅ |
| 12.6 Prazos e fluxo recursal | Obrigatório | ✅ |
| 12.7 Relatório anual estatístico | Obrigatório | ✅ |
| 12.8 Documentos classificados | Obrigatório | ✅ |
| 12.9 Informações desclassificadas | Obrigatório | ✅ |

## ✅ DIMENSÃO 13 — Acessibilidade
**Resultado: 5/5 critérios atendidos**

| Critério | Exigibilidade | Status |
|----------|:------------:|:------:|
| 13.1 Símbolo de acessibilidade em destaque | Obrigatório | ✅ |
| 13.2 Breadcrumb (caminho de páginas) | Obrigatório | ✅ |
| 13.3 Alto contraste | Obrigatório | ✅ |
| 13.4 Redimensionamento de texto | Obrigatório | ✅ |
| 13.5 Mapa do site | Obrigatório | ✅ |

## ✅ DIMENSÃO 14 — Ouvidorias
**Resultado: 3/3 critérios atendidos**

| Critério | Exigibilidade | Status |
|----------|:------------:|:------:|
| 14.1 Atendimento presencial (endereço, tel, e-mail, horário) | Obrigatório | ✅ |
| 14.2 Canal eletrônico de interação | Obrigatório | ✅ |
| 14.3 Carta de Serviços ao Usuário | Obrigatório | ✅ |

## ✅ DIMENSÃO 15 — LGPD e Governo Digital
**Resultado: 6/6 critérios atendidos**

| Critério | Exigibilidade | Status |
|----------|:------------:|:------:|
| 15.1 Encarregado (DPO) identificado | Obrigatório | ✅ |
| 15.2 Política de Privacidade e Proteção de Dados | Obrigatório | ✅ |
| 15.3 Serviços públicos por meio digital | Obrigatório | ✅ |
| 15.4 Dados Abertos (estruturados + regras) | Obrigatório | ✅ |
| 15.5 Regulamentação Lei 14.129/2021 (Governo Digital) | Recomendado | ✅ Página `/regulamentacao-governo-digital` criada com decreto municipal completo em HTML |
| 15.6 Pesquisa de Satisfação | Recomendado | ✅ |

## ✅ DIMENSÃO 16 — Renúncias de Receita
**Resultado: 4/4 critérios confirmados**

| Critério | Exigibilidade | Status | Observação |
|----------|:------------:|:------:|------------|
| 16.1 Desonerações com fundamentação legal | Obrigatório | ✅ | Página com filtros/abas + declaração de inexistência (confirmado pela contadora) |
| 16.2 Valores previsto/realizado por tipo | Obrigatório | ✅ | API de CSV pronta. Inexistência confirmada |
| 16.3 Beneficiários identificados | Obrigatório | ✅ | Colunas no banco prontas. Inexistência confirmada |
| 16.4 Incentivo à cultura e esporte | Obrigatório | 🔄 **Pendente** | Aguardando resposta dos secretários. Página já preparada para receber dados reais. |

### 📋 Perguntas para os Secretários — Critério 16.4

**Perguntar ao Secretário de Cultura e ao Secretário de Esporte:**

> *"O município tem alguma lei municipal que concede incentivo fiscal (desconto em IPTU, ISS, taxas) para projetos culturais ou esportivos? Tipo:"
> - Empresa patrocinar um evento cultural (São João, aniversário da cidade, festivais) e abater do imposto?
> - Empresa patrocinar time de futebol, corrida, campeonato esportivo e abater do imposto?
> - Isenção de taxa para realização de eventos culturais/esportivos?
> - Lei de Incentivo à Cultura municipal (similar à Lei Rouanet)?*

**Se SIM — dados necessários para cada projeto:**

| Dado | Exemplo | Onde encontrar |
|------|---------|----------------|
| Nome do projeto | "Festa do Padroeiro 2025" | Secretaria de Cultura |
| Beneficiário/Realizador | "Associação Cultural X" | Contrato/Termo |
| Tipo de incentivo | Isenção ISS / Patrocínio c/ abatimento | Lei municipal |
| Valor do benefício | R$ 15.000,00 | Contabilidade |
| Fundamento legal | Lei Municipal nº XXX/2023 | Procuradoria |
| Ano | 2025 | - |
| Área | Cultura / Esporte | - |

**Se NÃO:** A declaração de inexistência já está correta no portal. Só me avisar que eu atualizo.

---
*Checklist atualizado em Junho/2026*
