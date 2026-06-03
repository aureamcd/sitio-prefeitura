# Credores

## Lista de credores de um Órgão em um Exercício

`GET /credores/estado/:idUnidadeGestora/:exercicio/lista`

**Parâmetros:**
- `:idUnidadeGestora` - ID da unidade gestora (órgão estadual)
- `:exercicio` - Ano do exercício

---

## Lista de todos os Credores de um Município

`GET /credores/:idUnidadeGestora/:exercicio/lista`

**Parâmetros:**
- `:idUnidadeGestora` - ID da unidade gestora (município)
- `:exercicio` - Ano do exercício

---

## Maiores Credores de um Município

`GET /credores/:idUnidadeGestora/:exercicio`

**Parâmetros:**
- `:idUnidadeGestora` - ID do município
- `:exercicio` - Ano do exercício

---

## Maiores Credores de um Órgão

`GET /credores/estado/:idUnidadeGestora/:exercicio`

**Parâmetros:**
- `:idUnidadeGestora` - ID do órgão estadual
- `:exercicio` - Ano do exercício

---

## Quantidade de Credores de um Município

`GET /credores/:idUnidadeGestora/:exercicio/quantidade`

**Parâmetros:**
- `:idUnidadeGestora` - ID do município
- `:exercicio` - Ano do exercício

---

## Quantidade de Credores de um Órgão do Estado

`GET /credores/estado/:idUnidadeGestora/:exercicio/quantidade`

**Parâmetros:**
- `:idUnidadeGestora` - ID do órgão estadual
- `:exercicio` - Ano do exercício

---

## Tipos possíveis de Credores

`GET /credores/tipos`

Sem parâmetros. Retorna os tipos de credores disponíveis.
