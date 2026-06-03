# Prefeituras

## Lista dados consolidados de Receita e Despesa de um Município em um Exercício

`GET /:idUnidadeGestora/:exercicio`

**Parâmetros:**
- `:idUnidadeGestora` - ID do município
- `:exercicio` - Ano do exercício

**Nota:** Este endpoint está na raiz da API, sem prefixo.

---

## Lista de Municípios filtrados por Nome

`GET /prefeituras/:nome`

**Parâmetros:**
- `:nome` - Nome do município para busca

---

## Lista Gestor Atual de um Município

`GET /prefeituras/:idUnidadeGestora/gestor`

**Parâmetros:**
- `:idUnidadeGestora` - ID do município

---

## Lista todos os Municípios do Estado do Piauí

`GET /prefeituras`

Sem parâmetros. Retorna todos os municípios.
