import Link from "next/link";
import { Search } from "lucide-react";

import ContentPage from "@/components/layout/ContentPage";
import { searchPortal } from "@/lib/search";

import type { Metadata } from "next";
import type { SearchResult } from "@/lib/search";

export const metadata: Metadata = {
  title: "Busca",
  description: "Resultado de busca no portal da Prefeitura de Padre Marcos.",
};

type SearchPageProps = {
  searchParams: Promise<{
    q?: string | string[];
  }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const rawQuery = Array.isArray(params.q) ? params.q[0] : params.q;
  const query = (rawQuery ?? "").trim();
  const results: SearchResult[] = searchPortal(query);

  return (
    <ContentPage
      title="Busca"
      description="Resultados encontrados no portal."
      icon={<Search size={22} aria-hidden="true" />}
      breadcrumb={[
        { label: "Inicio", href: "/" },
        { label: "Busca" },
      ]}
      showSearch={false}
    >
      <form action="/busca" role="search" className="mb-6 flex flex-col gap-3 sm:flex-row">
        <label htmlFor="busca-page-input" className="sr-only">
          Pesquisar no portal
        </label>
        <input
          id="busca-page-input"
          name="q"
          type="search"
          defaultValue={query}
          placeholder="Digite sua busca"
          className="min-h-11 flex-1 rounded-md border border-gray-300 px-4 text-sm text-gray-900 outline-none transition focus:border-[#173572] focus:ring-2 focus:ring-[#173572]/20"
        />
        <button
          type="submit"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#173572] px-5 text-sm font-semibold text-white transition hover:bg-[#2563EB] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#173572] focus-visible:ring-offset-2"
        >
          <Search size={17} aria-hidden="true" />
          Buscar
        </button>
      </form>

      {!query && (
        <p className="text-sm text-gray-600">
          Digite uma palavra-chave para pesquisar nas paginas e servicos do portal.
        </p>
      )}

      {query && (
        <div aria-live="polite">
          <p className="mb-5 text-sm text-gray-600">
            {results.length === 0
              ? `Nenhum resultado encontrado para "${query}".`
              : `${results.length} resultado(s) encontrado(s) para "${query}".`}
          </p>

          {results.length > 0 && (
            <ul className="space-y-3 border-l-0 pl-0">
              {results.map((result) => {
                const isExternal = result.href.startsWith("http");

                return (
                  <li key={result.href} className="list-none before:content-none">
                    <Link
                      href={result.href}
                      target={isExternal ? "_blank" : undefined}
                      rel={isExternal ? "noopener noreferrer" : undefined}
                      className="block rounded-md border border-gray-200 bg-white p-4 no-underline transition hover:border-[#173572] hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#173572] focus-visible:ring-offset-2"
                    >
                      <span className="mb-1 block text-xs font-semibold uppercase text-[#173572]">
                        {result.category}
                      </span>
                      <strong className="block text-base text-gray-900">{result.title}</strong>
                      <span className="mt-1 block text-sm leading-relaxed text-gray-600">
                        {result.description}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </ContentPage>
  );
}
