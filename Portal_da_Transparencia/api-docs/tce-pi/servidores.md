# Servidores

## Lista de servidores de um Município por Exercício

`GET /servidores/:idUnidadeGestora/:exercicio/lista`

**Parâmetros:**
- `:idUnidadeGestora` - ID do município
- `:exercicio` - Ano do exercício

---

## Lista de servidores do TCE

`GET /servidores/tce/lista`

Sem parâmetros. Retorna a lista de servidores do Tribunal de Contas do Estado.

---

## Menor mês de registros de folhas de pagamento disponíveis

`GET /servidores/menorcompetencia`

Sem parâmetros. Retorna o menor mês/competência com registros de folhas de pagamento disponíveis (até três meses antes da data atual).

---

## Quantidade de servidores do TCE

`GET /servidores/tceqtd`

Sem parâmetros. Retorna a quantidade de servidores do TCE.

---

## Quantidade de servidores por Cargo do TCE

`GET /servidores/tce`

Sem parâmetros. Retorna a quantidade de servidores agrupados por cargo no TCE.

---

## Quantidade de servidores por Cargo em um Municipio

`GET /servidores/:idUnidadeGestora/:quantidade`

**Parâmetros:**
- `:idUnidadeGestora` - ID do município
- `:quantidade` - Quantidade (parâmetro adicional)

---

## Quantidade de servidores de um Município

`GET /servidores/:idUnidadeGestora/quantidade`

**Parâmetros:**
- `:idUnidadeGestora` - ID do município
