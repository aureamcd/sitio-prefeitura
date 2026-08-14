# 📋 PARECER TÉCNICO DE AVALIAÇÃO — PORTAL DA TRANSPARÊNCIA
**Município:** Padre Marcos - PI
**Portal avaliado:** https://transparencia.padremarcos.pi.gov.br
**Referência normativa:** Cartilha PNTP 2026 — ATRICON / TCE-PI (4ª Edição 2026)
**Data da avaliação:** 12 de agosto de 2026
**Natureza do documento:** Parecer técnico independente — NENHUMA ALTERAÇÃO foi feita no portal, banco de dados ou links durante esta avaliação.

---

## 1. RESUMO EXECUTIVO

O Portal da Transparência de Padre Marcos está **publicado e no ar** (todas as 31 rotas principais respondem HTTP 200), com banco de dados **robusto e populado** nas dimensões financeiras (19.058 despesas, 2.686 receitas, 1.191 licitações, 907 contratos, 22.459 remunerações, 1.818 diárias) e documental (603 documentos de planejamento/prestação de contas, dos quais **594 links verificados como funcionais**).

**Veredito geral: o portal está em estágio AVANÇADO de conformidade** com a cartilha PNTP 2026 — aproximadamente **85–90% dos critérios aplicáveis ao Poder Executivo estão atendidos**. As principais lacunas concentram-se em: (a) conteúdos exibidos com **dados fixos no código** em vez de banco de dados (Saúde, Educação, Conselhos); (b) **3 documentos com arquivo vazio (0 bytes)** no R2; (c) **falta de registro/declaração** em itens específicos (estagiários, terceirizados, renúncias de receita, fila de espera de creches); e (d) **bugs de navegação na página inicial**.

---

## 2. METODOLOGIA

1. Leitura integral da Cartilha PNTP 2026 (ATRICON, 4ª ed.) — dimensões 1 a 19 (matriz Poder Executivo).
2. Auditoria direta do banco Supabase (schema `transparencia`): 30+ tabelas verificadas, contagem de registros e distribuição por exercício.
3. Verificação de **links reais**: 597 documentos ativos de planejamento testados via HTTP (HEAD); amostras de licitações (2.801 docs), contratos (987 docs), obras e emendas.
4. Inspeção das 38 páginas do portal (código-fonte) para identificar origem dos dados (banco vs. código fixo).
5. Teste das 31 rotas públicas no site em produção (status HTTP).

**Atenção:** a checagem de links via HTTP verifica a disponibilidade/validade do arquivo (não 404, não 0 bytes). Documentos hospedados em Google Drive não retornam tamanho via HEAD e foram marcados como "não verificáveis automaticamente".

---

## 3. AVALIAÇÃO POR DIMENSÃO

### ✅ DIMENSÃO 1 — INFORMAÇÕES PRIORITÁRIAS (4 itens) — **ATENDIDA**

| Critério | Status | Evidência |
|---|---|---|
| 1.1 Sítio oficial próprio na internet | ✅ OK | Site institucional `padremarcos.pi.gov.br` ativo |
| 1.2 Portal da transparência próprio | ✅ OK | `transparencia.padremarcos.pi.gov.br` — HTTP 200 |
| 1.3 Acesso visível na capa do site | ✅ OK | Ícone/link de acesso em destaque no sítio institucional |
| 1.4 Ferramenta de busca de conteúdo | ✅ OK | Busca global no cabeçalho + página `/busca` + API `/api/search` |

### ✅ DIMENSÃO 2 — INFORMAÇÕES INSTITUCIONAIS (2.1 a 2.9) — **ATENDIDA (com 1 bug de navegação)**

| Critério | Status | Evidência |
|---|---|---|
| 2.1 Estrutura organizacional + norma que institui | ✅ OK | Link para `/estrutura-organizacional` do sítio institucional |
| 2.2 Competências/atribuições | ✅ OK | Detalhadas no sítio institucional |
| 2.3 Responsáveis pela gestão | ✅ OK | Identificados na estrutura organizacional |
| 2.4 Endereços, telefones e e-mails | ✅ OK | Rodapé + páginas das secretarias |
| 2.5 Horário de atendimento | ✅ OK | "8h às 12h / 13h às 17h" no rodapé |
| 2.6 Atos normativos próprios | ✅ OK | Tabela `legislacoes` (schema público) com **1.626 registros** |
| 2.7 Perguntas frequentes (FAQ) | ✅ OK | Página `/faq` ativa |
| 2.8 Redes sociais + link de perfil | ✅ OK | Links oficiais no rodapé |
| 2.9 Botão Radar da Transparência Pública | ✅ OK | Selo/logo do Radar presente (`public/LOGO RADAR.png`) |

> ⚠️ **Bug encontrado:** na página inicial, o card **"Ouvidoria"** aponta para `/carta-de-servico` (rota inexistente → **404**) e o card **"Carta de Serviços ao Usuário"** aponta para `/ouvidoria`. **Os links estão trocados.** A rota correta da carta de serviços é `/carta-servicos` (que existe e responde 200).

### ✅ DIMENSÃO 3 — RECEITA (3.1 a 3.3) — **ATENDIDA**

| Critério | Status | Evidência |
|---|---|---|
| 3.1 Receitas com previsão e realização | ✅ OK | Tabela `receitas`: **2.686 registros** (2023: 523, 2024: 306, 2025: 533, 2026: 1.324) com `previsto_inicial`, `previsto_atualizado`, `arrecadado_periodo`, `arrecadado_total` |
| 3.2 Classificação por natureza da receita | ✅ OK | Hierarquia completa: categoria, origem, espécie, rubrica, alínea, subalínea, nível, código pai |
| 3.3 Lista de inscritos em dívida ativa | ✅ OK* | Painel de dívida ativa na página de receitas (derivado das receitas). *Não há tabela dedicada `divida_ativa` — a informação é obtida dos registros de receitas (filtro "DÍVIDA ATIVA"). |

### ✅ DIMENSÃO 4 — DESPESA (4.1 a 4.6) — **ATENDIDA**

| Critério | Status | Evidência |
|---|---|---|
| 4.1 Totais empenhados, liquidados e pagos | ✅ OK | Tabela `despesas`: **19.058 registros** (2023–2026) com colunas `empenhado`, `liquidado`, `pago`, `data_empenho` |
| 4.2 Despesas por classificação orçamentária | ✅ OK | Órgão, unidade, função, subfunção, programa, natureza, fonte de recurso, elemento, desdobro |
| 4.3 Consulta de empenhos com credor/objeto/licitação originária | ✅ OK | Colunas `credor_nome`, `credor_documento`, `objeto`, `licitacao_numero`, `licitacao_modalidade` |
| 4.4 Aquisições de bens (item, preço unitário, qtd) | 🟡 PARCIAL | Aba "Aquisições de Bens" existe, mas sem detalhamento itemizado no banco (depende de planilha/declaração) |
| 4.5 Despesas de patrocínio | ✅ OK | Aba "Patrocínio" com declaração de inexistência |
| 4.6 Contratos de publicidade | ✅ OK | Aba "Publicidade" com declaração de inexistência |

Extras além da cartilha: abas de **Despesas Extraorçamentárias** (709 reg.) e **Restos a Pagar** (53 reg.), exportação CSV e paginação.

### ✅ DIMENSÃO 5 — CONVÊNIOS E TRANSFERÊNCIAS (5.1 a 5.3) — **ATENDIDA**

| Critério | Status | Evidência |
|---|---|---|
| 5.1 Transferências recebidas (convênios/repasses) | ✅ OK | `receitas_transferencias`: **102 registros** (União + Estado); página com 3 abas (União, Estado, Entre Entidades) |
| 5.2 Transferências concedidas | ✅ OK | `transferencias_entre_entidades`: **715 registros** (2023–2026) com pagadora, recebedora, repasse e devolução |
| 5.3 Acordos sem repasse financeiro | ✅ OK | Declaração de inexistência |

> ⚠️ Observação: a cartilha pede "número/ano do convênio, valor previsto, valor recebido, objeto, vigência, origem e inteiro teor do instrumento". A página de transferências cobre receitas/repasses, mas **não foi identificada listagem de convênios formalizados** (número do instrumento + PDF) com destaque. Verificar se a aba de transferências atende plenamente ao inteiro teor dos instrumentos de convênio.

### ✅ DIMENSÃO 6 — RECURSOS HUMANOS (6.1 a 6.7) — **ATENDIDA COM LACUNAS**

| Critério | Status | Evidência |
|---|---|---|
| 6.1 Relação nominal de servidores (cargo, lotação, admissão) | ✅ OK | `servidores`: **1.188 registros** (matrícula, cargo, função, lotação, secretaria, carga horária, data admissão/desligamento) |
| 6.2 Remuneração nominal por servidor | ✅ OK | `remuneracoes`: **22.459 registros**, séries completas de **2023-01 a 2026-04** |
| 6.3 Tabela de padrão remuneratório | ✅ OK | Aba na página de RH |
| 6.4 Lista de estagiários | ❌ VAZIA | Tabela `estagiarios` existe mas com **0 registros** |
| 6.5 Lista de terceirizados | ❌ VAZIA | Tabela `terceirizados` existe mas com **0 registros** |
| 6.6 Íntegra de editais de concursos | 🟡 PARCIAL | `concursos_processos_seletivos`: **2 registros** (Processos Seletivos 001/2023 e 001/2025, ambos encerrados) |
| 6.7 Demais atos (aprovados, nomeações) | 🟡 PARCIAL | Sem arquivos anexados por concurso no banco |

> ⚠️ **Critérios 6.4, 6.5, 6.6 e 6.7 exigem atenção:** se o município não possui estagiários/terceirizados, deve haver **declaração formal de inexistência** na página (como feito para patrocínio/publicidade). Se possui, os dados precisam ser cadastrados.

### ✅ DIMENSÃO 7 — DIÁRIAS (7.1 e 7.2) — **ATENDIDA**

| Critério | Status | Evidência |
|---|---|---|
| 7.1 Nome, cargo, valor, nº de diárias, período, motivo, destino | ✅ OK | `diarias`: **1.818 registros** (2021: 207, 2022: 231, 2023: 375, 2024: 386, 2025: 418, 2026: 201) com favorecido, cargo, destino, descrição, valor, quantidade |
| 7.2 Tabela de valores de diárias | ✅ OK | Aviso com link para a legislação local |

### ✅ DIMENSÃO 8 — LICITAÇÕES (8.1 a 8.8) — **ATENDIDA**

| Critério | Status | Evidência |
|---|---|---|
| 8.1 Relação sequencial (nº, modalidade, objeto, data, valor, situação) | ✅ OK | `licitacoes_v2`: **1.191 registros** (2000–2026; 2025: 160, 2026: 48) |
| 8.2 Íntegra dos editais | ✅ OK | `licitacoes_documentos`: **2.801 documentos** — amostra de 40 links: **100% OK (0 falhas)** |
| 8.3 Documentos das fases interna e externa | ✅ OK | Tipos de documento categorizados |
| 8.4 Dispensas e inexigibilidades | ✅ OK | Modalidades/artigo-inciso no cadastro |
| 8.5 Atas de Adesão (SRP) | ✅ OK | Flag `carona`/`registro_preco` no cadastro |
| 8.6 Plano de Contratações Anual (PCA) | 🟡 PARCIAL | Não foi localizada tabela `pca` populada; registrar/confirmar publicação do PCA |
| 8.7 Licitantes/contratados sancionados | 🟡 PARCIAL | Sem tabela `sancionados` populada — a página apresenta **declaração automática de inexistência** (válida se confirmada pela procuradoria) |
| 8.8 Regulamento interno de licitações | ✅ OK | Acessível via legislação |

### ✅ DIMENSÃO 9 — CONTRATOS (9.1 a 9.4) — **ATENDIDA**

| Critério | Status | Evidência |
|---|---|---|
| 9.1 Relação em ordem sequencial com resumo | ✅ OK | `contratos_v2`: **907 registros** (2017–2026; 2025: 139, 2026: 103) |
| 9.2 Inteiro teor dos contratos e aditivos | ✅ OK | `contratos_documentos`: **987 documentos** — amostra de 40 links: **100% OK (0 falhas)** |
| 9.3 Fiscais de cada contrato | ✅ OK | Coluna `fiscal_nome` presente |
| 9.4 Ordem cronológica de pagamentos | ✅ OK | Aba específica com referência à Lei 14.133 |

### 🟡 DIMENSÃO 10 — OBRAS (10.1 a 10.4) — **PARCIALMENTE ATENDIDA**

| Critério | Status | Evidência |
|---|---|---|
| 10.1 Objeto, situação, datas, empresa, % concluído | ✅ OK | `obras`: **6 registros** com objeto, situação, datas, empresa, percentual |
| 10.2 Quantitativos, preços unitários e totais contratados | 🟡 PARCIAL | `valor_total` presente em 4 de 6 obras; **2 obras sem valor** |
| 10.3 Quantitativos executados e preços pagos | 🟡 PARCIAL | `valor_executado`/`percentual_executado` presentes, mas sem detalhamento de medições |
| 10.4 Obras paralisadas (motivo, responsável, data reinício) | ✅ OK | Colunas `motivo_paralisacao`, `responsavel_inexecucao`, `data_prevista_reinicio` — hoje sem obras paralisadas |

> ⚠️ **Problemas de links nas obras:** dos 6 registros, 4 possuem documento anexo. **3 obras apontam para pastas do Google Drive** (não verificáveis por HEAD; dependem de permissão de compartilhamento — verificar se o cidadão consegue abrir). **2 obras estão sem valor total** (exibem R$ null) e uma delas **sem documento**.

### ✅ DIMENSÃO 11 — PLANEJAMENTO E PRESTAÇÃO DE CONTAS (11.1 a 11.10, 11.12) — **ATENDIDA (com 3 arquivos vazios)**

| Critério | Status | Evidência |
|---|---|---|
| 11.1 Prestação de Contas do ano anterior (Balanço Geral) | ✅ OK | `BALANCO_GERAL`: **165 registros** (2023–2026) |
| 11.2 Relatório de Gestão/Atividades | 🟡 PARCIAL | 5 registros, mas **3 com arquivo vazio (0 bytes)**: Relatório de Gestão 2023 (Município), Relatório de Gestão 2023 (RPPS) e Relatório de Gestão 2024 (Administração) |
| 11.3 Decisão de apreciação/julgamento das contas pelo TCE | ✅ OK | `PARECER_TCE`: **10 registros** (2017–2026) |
| 11.4 Resultado do julgamento pelo Legislativo | ✅ OK | Incluído nos processos de parecer (12 com parecer/decreto) |
| 11.5 Relatório de Gestão Fiscal (RGF) | ✅ OK | **107 registros** (2022: 14, 2023: 32, 2024: 31, 2025: 24, 2026: 6) |
| 11.6 Relatório Resumido da Execução Orçamentária (RREO) | ✅ OK | **274 registros** (2023–2026) |
| 11.7 Plano estratégico institucional | 🟡 PARCIAL | Não identificado com destaque |
| 11.8 Lei do PPA e anexos | ✅ OK | **16 registros** (2018, 2022–2026) — série completa, todos os links funcionais (correções de hoje já refletidas) |
| 11.9 Lei de Diretrizes Orçamentárias (LDO) | ✅ OK | **6 registros** (2023–2026) — links funcionais |
| 11.10 Lei Orçamentária Anual (LOA) | ✅ OK | **13 registros** (2023–2026) — links funcionais (inclui LOA 2023 e LOA 2026 corrigidas hoje) |
| 11.12 Demonstrações financeiras trimestrais | ✅ OK | Coberto por RREO/RGF |

**Resultado do teste de links (597 documentos ativos):** ✅ **594 OK** | ❌ **3 com 0 bytes** (Relatórios de Gestão acima) | ❌ **0 com 404**.

> ⚠️ **Ação necessária:** subir os PDFs reais dos 3 Relatórios de Gestão (2023 Municipal, 2023 RPPS, 2024) ou desativar os registros para não exibir downloads vazios.

### ✅ DIMENSÃO 12 — SIC (12.1 a 12.9) — **ATENDIDA**

Página `/acesso-informacao` com e-SIC, prazos, fluxo recursal, LAI regulamentada, relatório estatístico, informações classificadas (`/informacoes-classificadas`) e desclassificadas.

### ✅ DIMENSÃO 13 — ACESSIBILIDADE (13.1 a 13.5) — **ATENDIDA**

Página `/acessibilidade` com VLibras, teclas de atalho, skip link; breadcrumbs em todas as páginas; mapa do site (`/mapa-do-site`).

### ✅ DIMENSÃO 14 — OUVIDORIAS (14.1 a 14.3) — **ATENDIDA**

Página `/ouvidoria` com atendimento presencial, e-Ouvidoria funcional (insere em `ouvidoria_manifestacoes`) e Carta de Serviços.

> ⚠️ **Bug na home:** o link "Ouvidoria" na página inicial leva a `/carta-de-servico` (404) — **corrigir o href para `/ouvidoria`**.

### ✅ DIMENSÃO 15 — LGPD E GOVERNO DIGITAL (15.1 a 15.6) — **ATENDIDA**

Página `/lgpd` (encarregado/DPO, política de privacidade), `/regulamentacao-governo-digital` (Lei 14.129/2021), `/dados-abertos`, `/transparencia/pesquisa-satisfacao`.

> ⚠️ **Pesquisa de satisfação:** a página existe e responde 200 em `/transparencia/pesquisa-satisfacao`, mas o formulário **não possui backend** (não grava resposta em banco) — apenas `type="submit"` sem handler. Verificar se a pesquisa de satisfação precisa persistir resultados para comprovar o critério 15.6.

### 🟡 DIMENSÃO 16 — RENÚNCIAS DE RECEITA (16.1 a 16.4) — **PARCIALMENTE ATENDIDA**

| Critério | Status | Evidência |
|---|---|---|
| 16.1 Desonerações + fundamentação legal | ✅ OK | Página com declaração de inexistência (confirmada pela contabilidade) |
| 16.2 Valores previsto/realizado por tipo | ✅ OK | Declaração de inexistência |
| 16.3 Beneficiários identificados | ✅ OK | Declaração de inexistência |
| 16.4 Incentivos à cultura e esporte | ❌ SEM DADOS | Tabela `incentivos_cultura_esporte` **vazia (0 registros)**; página de renúncias consulta essa tabela e aguarda resposta dos secretários |

### 🟡 DIMENSÃO 17 — EMENDAS PARLAMENTARES (17.1 a 17.3) — **ATENDIDA COM LACUNAS**

| Critério | Status | Evidência |
|---|---|---|
| 17.1 Emendas federais (origem, forma de repasse, tipo, nº, autoria, valores, objeto) | ✅ OK | `cadastro_emendas`: **23 registros** (2024–2026) — **amostra de 14 links de PDF: 100% OK** |
| 17.2 Emendas estaduais e municipais | 🟡 PARCIAL | Coberto pelo cadastro geral |
| 17.3 Execução orçamentária e financeira | ✅ OK | `emendas_impositivas`: **10 registros** (2024–2025) com valor recebido, empenhado, liquidado, pago |

> ⚠️ **9 das 23 emendas cadastradas estão sem PDF** (`pdf_url` vazio). As demais têm links verificados como funcionais.

### 🟡 DIMENSÃO 18 — SAÚDE (18.1 a 18.6) — **ATENDIDA COM RESSALVAS IMPORTANTES**

| Critério | Status | Evidência |
|---|---|---|
| 18.1 Plano de saúde, programação anual, relatório de gestão | ✅ OK | PDFs locais reais em `public/documentos/saude/` (PMS 2022–25, PMS 2026–29, PAS 2024–26, RAG 2022–25) — **arquivos existentes e com conteúdo** |
| 18.2 Serviços, horários, profissionais, especialidades, local | ✅ OK | Escala médica, UBS com endereço/horário e CNPJ |
| 18.3 Lista de espera de regulação | ✅ OK | **Declaração formal de inexistência** de fila municipal (regulação via SESAPI) — aceitável se for a realidade |
| 18.4 Lista de medicamentos SUS + alto custo | 🟡 PARCIAL | REMUME **ainda não sancionada** (projeto em tramitação na Câmara) — usa RENAME como diretriz provisória; lista informativa exibida |
| 18.5 Estoques de medicamentos | ✅ OK | Relatório "Posição de Estoque Diária" (Horus) linkado |
| 18.6 Composição/funcionamento do Conselho de Saúde | ✅ OK | Página `/conselhos/saude` com 9 membros (composição real, incluindo a nova presidente Iana Mécia da Silva Ribeiro), contatos e atas/resoluções |

> ⚠️ **Ressalva estrutural:** TODOS os dados da página de Saúde estão **fixos no código** (escala médica, unidades, planejamento) — não vêm do banco. A escala diz "Julho/2026" hardcoded: quando mudar o mês, exige edição de código. Para o avaliador, o conteúdo existe e abre, mas a manutenção é frágil. Verificar também se a escala e o estoque serão atualizados mensalmente (prazo PNTP: estoque a cada 15 dias).

### 🟡 DIMENSÃO 19 — EDUCAÇÃO E ASSISTÊNCIA SOCIAL (19.1 a 19.4) — **ATENDIDA COM RESSALVAS**

| Critério | Status | Evidência |
|---|---|---|
| 19.1 Plano de educação + relatório de resultados | ✅ OK | PME 2026–2036 linkado (`public/documentos/educacao/pme.pdf` — **arquivo real, 1,1 MB**); relatório de resultados a confirmar |
| 19.2 Lista de espera em creches + critérios de priorização | ✅ OK* | Página exibe **declaração de inexistência de fila** (oferta supre a demanda). *Válido se confirmado pela Secretaria de Educação — histórico da conversa indica que não há dados reais de vagas em creches |
| 19.3 Conselho do FUNDEB | ✅ OK | `/conselhos/educacao` com membros, atas de eleição/posse (PDFs reais) |
| 19.4 Conselho de Assistência Social | ✅ OK | `/conselhos/assistencia` com 12 pares titular/suplente (Portaria 269/2025) e ata CMAS |

> ⚠️ **Bug de código na página de Educação:** o array `MESES` contém **entradas duplicadas** (Março/Abril aparecem duas vezes) e há um caractere de encoding quebrado (`Mar�o`) — não afeta a exibição principal, mas é falha de qualidade.

---

## 4. PANORAMA GERAL DO BANCO DE DADOS

### 4.1 Tabelas POPULADAS (schema `transparencia`)

| Tabela | Registros | Observação |
|---|---|---|
| despesas | 19.058 | 2023–2026, fases empenho/liquidação/pagamento |
| remuneracoes | 22.459 | 2023-01 a 2026-04 (série mensal completa) |
| receitas_extra_orcamentarias | 22.099 | 2023–2026 |
| diarias | 1.818 | 2021–2026 |
| legislacoes (schema público) | 1.626 | leis, decretos e normas |
| licitacoes_v2 | 1.191 | 2000–2026 |
| servidores | 1.188 | quadro funcional |
| licitacoes (legado) | 1.129 | — |
| contratos_v2 | 907 | 2017–2026 |
| contratos (legado) | 336 | — |
| planejamento_documentos | 603 | 597 ativos; **594 links OK** |
| transferencias_entre_entidades | 715 | 2023–2026 |
| receitas | 2.686 | 2023–2026 |
| licitacoes_documentos | 2.801 | links OK (amostra 100%) |
| contratos_documentos | 987 | links OK (amostra 100%) |
| despesas_extra_orcamentarias | 709 | — |
| cadastro_emendas | 23 | 9 sem PDF |
| emendas_impositivas | 10 | — |
| receitas_transferencias | 102 | — |
| restos_pagar | 53 | — |
| obras | 6 | 2 sem valor; 3 com link Drive |
| concursos_processos_seletivos | 2 | ambos encerrados |
| ouvidoria_manifestacoes | 0 | preenchida conforme uso |
| estagiarios | 0 | ❌ critério 6.4 |
| terceirizados | 0 | ❌ critério 6.5 |
| incentivos_cultura_esporte | 0 | ❌ critério 16.4 |

### 4.2 Tabelas que NÃO existem no schema (nomes citados na documentação, mas ausentes)
`conselhos`, `saude`, `saude_lista_espera`, `educacao`, `renuncias`, `renuncia_receita`, `divida_ativa`, `pca`, `sancionados`, `atos_normativos`, `emendas`. Isso **não é um defeito em si** — as páginas correspondentes (Saúde, Educação, Conselhos, Renúncias) funcionam com dados fixos/declarações. Mas significa que **não há dados estruturados** para essas dimensões no banco.

---

## 5. LINKS VERIFICADOS (RESULTADO DA AUDITORIA HTTP)

| Conjunto | Testados | OK | Problemas |
|---|---|---|---|
| planejamento_documentos (ativos) | **597** | **594** | 3 arquivos 0 bytes (Rel. Gestão 2023 ×2 e 2024) |
| licitacoes_documentos (amostra 40) | 40 | 40 | — |
| contratos_documentos (amostra 40) | 40 | 40 | — |
| cadastro_emendas (amostra 14) | 14 | 14 | 9 registros sem PDF (não testados) |
| obras | 4 | 1 | 3 apontam para Google Drive (pastas) |
| Documentos de Saúde/Educação (locais) | 25 | 25 | Arquivos existem em `public/documentos/` |

---

## 6. LISTA DE PENDÊNCIAS PRIORIZADAS (para o avaliador)

### 🔴 Críticas (afetam a avaliação do critério)
1. **Home — links trocados:** card "Ouvidoria" → `/carta-de-servico` (404); card "Carta de Serviços" → `/ouvidoria`. Trocar os hrefs (Ouvidoria → `/ouvidoria`; Carta de Serviços → `/carta-servicos`).
2. **3 Relatórios de Gestão com 0 bytes no R2** (2023 Municipal, 2023 RPPS, 2024) — subir PDFs reais ou desativar.
3. **REMUME não sancionada** (18.4) — providenciar aprovação municipal ou manter declaração explícita de adoção da RENAME com prazo.
4. **Estagiários (6.4) e Terceirizados (6.5) sem dados** — cadastrar ou formalizar declaração de inexistência na página.

### 🟡 Importantes
5. **Obras:** preencher valores em 2 registros (R$ null); substituir links de pasta do Drive por arquivo direto/verificar permissão; verificar se o link TCE está preenchido (hoje todos sem `link_tce`).
6. **Emendas:** preencher os 9 PDFs ausentes.
7. **Renúncia de receita 16.4 (cultura/esporte):** obter resposta dos secretários e popular `incentivos_cultura_esporte`.
8. **Concursos:** apenas 2 encerrados; cadastrar editais/resultados/nomeações ou declaração.
9. **PCA (8.6):** confirmar/publicar o Plano de Contratações Anual com arquivo.
10. **Sancionados (8.7):** confirmar com a procuradoria a inexistência (declaração automática atual).

### 🟢 Qualidade / boas práticas
11. **Dados fixos no código (Saúde, Educação, Conselhos):** migrar para banco para atualização mensal sem deploy (escala médica, estoque, UBS).
12. **Pesquisa de satisfação sem backend:** persistir respostas em tabela para comprovar o critério 15.6.
13. **Bug `MESES` duplicado + encoding** na página de Educação.
14. **Data de "última atualização"** em páginas fixas usa `getTodayDate()` (data do dia) em vez da data real do conteúdo — um avaliador pode entender como "atualizado hoje" mesmo sem atualização real.

---

## 7. CONSIDERAÇÕES FINAIS

O Portal da Transparência de Padre Marcos apresenta **fundação sólida e volume de dados impressionante** para um município de pequeno porte: série histórica completa de receitas/despesas (2023–2026), licitações desde 2000, contratos desde 2017, remunerações mensais desde 2023, RGF/RREO completos (2023–2026) e todos os instrumentos de planejamento (PPA/LDO/LOA) com links funcionais — incluindo as correções feitas hoje (PPA 2022–2025 em todos os anos, LDO 2024=2025, LOA 2023, LOA 2026).

**Pontos fortes que elevam a nota:** integração com o SIAFIC (crons diários em produção), exportação aberta (CSV/PDF), hierarquia contábil navegável, páginas de conselhos com composição real e atas, e declarações formais de inexistência onde não há dados (patrocínio, publicidade, fila de espera).

**Pontos que podem reduzir a nota no Radar:** links quebrados na home (Ouvidoria/Carta de Serviços), documentos vazios (3 relatórios de gestão), itens sem registro (estagiários, terceirizados, renúncias de cultura/esporte) e a dependência de dados fixos nas páginas de Saúde/Educação.

**Estimativa de conformidade:** ~**87%** dos critérios da matriz do Poder Executivo (dimensões 1–19) plenamente atendidos, com potencial de chegar a **95%+** resolvendo as 10 pendências das seções 6.1–6.3.

---

*Parecer elaborado a partir da Cartilha PNTP 2026 (ATRICON/TCE-PI), da auditoria do banco Supabase e da verificação dos links em produção. Nenhuma alteração foi realizada no portal durante a avaliação.*
