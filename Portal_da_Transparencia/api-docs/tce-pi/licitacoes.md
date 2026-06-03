# Licitações

## Licitações de um Município

`GET /licitacoes/:idUnidadeGestora`

**Parâmetros:**
- `:idUnidadeGestora` - ID do município

---

## Licitações de uma data específica

`GET /licitacoes/:idUnidadeGestora/:esfera/:data`

**Parâmetros:**
- `:idUnidadeGestora` - ID da unidade gestora
- `:esfera` - Esfera (M = Municipal, E = Estadual)
- `:data` - Data no formato DD/MM/AAAA

---

## Licitações do Estado

`GET /licitacoes/estado`

Sem parâmetros. Retorna licitações estaduais.
