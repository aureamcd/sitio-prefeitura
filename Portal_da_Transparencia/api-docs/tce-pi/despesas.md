# Despesas

## Despesas de um Município Por Exercício e Por Elemento

`GET /despesas/:idUnidadeGestora/:exercicio/porElemento`

**Parâmetros:**
- `:idUnidadeGestora` - ID do município
- `:exercicio` - Ano do exercício

---

## Despesas de um Município Por Exercício e Por Função

`GET /despesas/:idUnidadeGestora/:exercicio/porFuncao`

**Parâmetros:**
- `:idUnidadeGestora` - ID do município
- `:exercicio` - Ano do exercício

---

## Despesas de um Município Por Exercício e Por Natureza

`GET /despesas/:idUnidadeGestora/:exercicio/porNatureza`

**Parâmetros:**
- `:idUnidadeGestora` - ID do município
- `:exercicio` - Ano do exercício

---

## Despesas de um Município

`GET /despesas/:idUnidadeGestora`

**Parâmetros:**
- `:idUnidadeGestora` - ID do município

---

## Despesas de um Órgão em um Exercício e Por Função

`GET /despesas/estado/:idUnidadeGestora/:exercicio/porFuncao`

**Parâmetros:**
- `:idUnidadeGestora` - ID do órgão estadual
- `:exercicio` - Ano do exercício

---

## Despesas de um Órgão em um Exercício e Por Natureza

`GET /despesas/estado/:idUnidadeGestora/:exercicio/porNatureza`

**Parâmetros:**
- `:idUnidadeGestora` - ID do órgão estadual
- `:exercicio` - Ano do exercício

---

## Despesas de um Órgão Por Exercício e Por Elemento

`GET /despesas/estado/:idUnidadeGestora/:exercicio/porElemento`

**Parâmetros:**
- `:idUnidadeGestora` - ID do órgão estadual
- `:exercicio` - Ano do exercício

---

## Lista de despesas de um Município Por Exercício e Por Função

`GET /despesas/:idUnidadeGestora/:exercicio/lista/porFuncao`

**Parâmetros:**
- `:idUnidadeGestora` - ID do município
- `:exercicio` - Ano do exercício

---

## Lista de despesas de um Município Por Exercício e Por Natureza

`GET /despesas/:idUnidadeGestora/:exercicio/lista/porNatureza`

**Parâmetros:**
- `:idUnidadeGestora` - ID do município
- `:exercicio` - Ano do exercício

---

## Lista de despesas de um Órgão Por Exercício e Por Função

`GET /despesas/estado/:idUnidadeGestora/:exercicio/lista/porFuncao`

**Parâmetros:**
- `:idUnidadeGestora` - ID do órgão estadual
- `:exercicio` - Ano do exercício

---

## Lista de despesas de um Órgão Por Exercício e Por Natureza

`GET /despesas/estado/:idUnidadeGestora/:exercicio/lista/porNatureza`

**Parâmetros:**
- `:idUnidadeGestora` - ID do órgão estadual
- `:exercicio` - Ano do exercício

---

## Lista de Despesas do Estado

`GET /despesas/estado/:idUnidadeGestora?`

**Parâmetros:**
- `:idUnidadeGestora` - ID da unidade gestora (opcional?)

---

## Maiores Despesas de um Município Por Exercício e Por Elemento

`GET /despesas/:idUnidadeGestora/:exercicio/maiores/porElemento`

**Parâmetros:**
- `:idUnidadeGestora` - ID do município
- `:exercicio` - Ano do exercício

---

## Maiores Despesas de um Órgão em um Exercício e Por Elemento

`GET /despesas/estado/:idUnidadeGestora/:exercicio/maiores/porElemento`

**Parâmetros:**
- `:idUnidadeGestora` - ID do órgão estadual
- `:exercicio` - Ano do exercício

---

## Total de Despesas dos Municípios do Estado

`GET /despesas/total`

Sem parâmetros. Retorna o total de despesas de todos os municípios.
