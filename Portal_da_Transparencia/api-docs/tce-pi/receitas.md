# Receitas

## Detalhamento da Receita de um Município em um Exercício

`GET /receitas/:idUnidadeGestora/:exercicio`

**Parâmetros:**
- `:idUnidadeGestora` - ID do município
- `:exercicio` - Ano do exercício

---

## Detalhamento da Receita de um Órgão em um Exercício

`GET /receitas/estado/:idUnidadeGestora/:exercicio`

**Parâmetros:**
- `:idUnidadeGestora` - ID do órgão estadual
- `:exercicio` - Ano do exercício

---

## Lista de Receitas de um Município

`GET /receitas/:idUnidadeGestora`

**Parâmetros:**
- `:idUnidadeGestora` - ID do município

---

## Lista de Receitas do Estado

`GET /receitas/estado/:idUnidadeGestora?`

**Parâmetros:**
- `:idUnidadeGestora` - ID da unidade gestora (opcional?)

---

## Quantidade total de receitas de um Município em um exercício

`GET /receitas/:idUnidadeGestora/:exercicio/quantidadeTotal`

**Parâmetros:**
- `:idUnidadeGestora` - ID do município
- `:exercicio` - Ano do exercício

---

## Quantidade total de receitas de um Órgão em um exercício

`GET /receitas/estado/:idUnidadeGestora/:exercicio/quantidadeTotal`

**Parâmetros:**
- `:idUnidadeGestora` - ID do órgão estadual
- `:exercicio` - Ano do exercício

---

## Total de Receitas dos Municípios do Estado

`GET /receitas/total`

Sem parâmetros. Retorna o total de receitas de todos os municípios.
