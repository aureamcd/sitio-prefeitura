"use client";

import { FormEvent, JSX } from "react";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SearchBar(): JSX.Element {
  const router = useRouter();

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const query = String(formData.get("q") ?? "").trim();

    if (!query) return;

    router.push(`/busca?q=${encodeURIComponent(query)}`);
  }

  return (
    <form
      role="search"
      aria-label="Buscar no Portal da Transparência"
      onSubmit={handleSubmit}
      className="relative w-full border border-blue-300 rounded-full bg-white transition-all duration-200 focus-within:border-blue-500 focus-within:shadow-md"
    >
      {/* Label acessível (invisível para usuários comuns) */}
      <label htmlFor="search-input" className="sr-only">
        O que você procura? Digite aqui para pesquisar no portal.
      </label>

      {/* Input com cantos arredondados (Full) para um visual mais moderno */}
      <input
        id="search-input"
        name="q"
        type="search"
        placeholder="O que você procura?..."
        autoComplete="off"
        className="
          w-full px-5 py-2.5 pr-12
          rounded-full text-sm text-gray-900
          placeholder-gray-400
          bg-transparent
          focus:outline-none
          transition-all
        "
      />

      {/* Botão de Busca */}
      <button
        type="submit"
        aria-label="Executar busca"
        className="
          absolute right-1 top-1/2 -translate-y-1/2
          w-9 h-9 flex items-center justify-center
          text-gray-400
          hover:text-[#173572]
          hover:bg-gray-100
          rounded-full
          active:scale-90
          transition-all
          focus:outline-none
          focus-visible:ring-2 focus-visible:ring-blue-500
        "
      >
        <Search size={18} aria-hidden="true" />
      </button>
    </form>
  );
}