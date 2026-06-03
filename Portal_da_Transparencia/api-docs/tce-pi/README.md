# API Portal da Cidadania - TCE-PI

**Base URL:** `https://sistemas.tce.pi.gov.br/api/portaldacidadania`

Documentação extraída de: https://sistemas.tce.pi.gov.br/api/portaldacidadania/docs/

## Categorias de APIs

| Categoria | Descrição |
|-----------|-----------|
| [Credores](./credores.md) | Consulta de credores por município e órgão |
| [Despesas](./despesas.md) | Consulta de despesas por município, órgão, exercício |
| [Documentos](./documentos.md) | Consulta de documentos digitalizados |
| [Licitações](./licitacoes.md) | Consulta de licitações por município e data |
| [Órgãos](./orgaos.md) | Consulta de órgãos do Estado do Piauí |
| [Prefeituras](./prefeituras.md) | Consulta de municípios e gestores |
| [Receitas](./receitas.md) | Consulta de receitas por município e órgão |
| [Servidores](./servidores.md) | Consulta de servidores por município e cargo |

## Padrão de Parâmetros

- `:idUnidadeGestor` - Código da unidade gestora (município ou órgão)
- `:exercicio` - Ano do exercício (ex: 2024, 2025, 2026)
- `:esfera` - Esfera (M = Municipal, E = Estadual)
- `:data` - Data no formato DD/MM/AAAA
- `:nome` - Nome para filtro

## Observações

- Todas as APIs são públicas (GET)
- Retorno em formato JSON
- Dados do Tribunal de Contas do Estado do Piauí (TCE-PI)
