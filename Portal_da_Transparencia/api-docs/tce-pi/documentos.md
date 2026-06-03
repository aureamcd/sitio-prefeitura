# Documentos

## Documentos de um Município

`GET /documentos/:idUnidadeGestora`

**Parâmetros:**
- `:idUnidadeGestora` - ID do município

---

## Documentos Digitalizados pelo TCE de um Município

`GET /documentos/:idUnidadeGestora/digitalizados`

**Parâmetros:**
- `:idUnidadeGestora` - ID do município

---

## Documentos Estaduais

`GET /documentos/estado`

Sem parâmetros. Retorna documentos estaduais.

---

## Quantidade total de documentos de um Município

`GET /documentos/:idUnidadeGestora/quantidadeTotal`

**Parâmetros:**
- `:idUnidadeGestora` - ID do município

---

## Quantidade total de documentos estaduais

`GET /documentos/estado/quantidadeTotal`

Sem parâmetros. Retorna a quantidade total de documentos estaduais.
