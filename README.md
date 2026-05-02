# Sitio Prefeitura

Aplicacao Next.js do portal.

## Rodar

```bash
npm run dev
```

Abra `http://localhost:3000`.

## Busca

A busca fica dentro do proprio Next, com a logica em `lib`:

- `lib/search/index.ts`: modulo da busca, com os itens pesquisaveis e a funcao `searchPortal`.
- `app/api/search/route.ts`: rota `GET /api/search?q=termo`, usando o modulo de `lib/search`.
- `app/(paginas)/(portal)/busca/page.tsx`: pagina de resultados (`/busca`).
- `components/layout/SearchBar.tsx`: campo de busca usado no layout.

## Rotas

As paginas principais usam Route Groups do App Router. As pastas com parenteses organizam o codigo, mas nao entram na URL:

- `app/(paginas)/page.tsx`: pagina inicial (`/`).
- `app/(paginas)/(portal)/`: paginas gerais do portal, como `/busca`.
- `app/(paginas)/(institucional)/(info-institucional)/info-institucional/`: paginas de `/info-institucional/...`.
- `app/(paginas)/(institucional)/(servicos)/servicos/`: paginas de `/servicos/...`, organizadas por grupos como `(carta de serviços)`, `(serviços online)` e `(todos os serviços)`.
- `app/(paginas)/(institucional)/`: outras paginas institucionais, como `/acessibilidade` e `/fale-conosco`.
- `app/(paginas)/(transparencia)/(publicacoes)/publicacoes/`: paginas de `/publicacoes/...`.
- `app/(paginas)/(transparencia)/`: outras paginas de transparencia, como `/acesso-informacao`, `/esic`, `/ouvidoria` e `/leis-normas`.
- `app/api/search/route.ts`: API interna da busca (`/api/search`).
