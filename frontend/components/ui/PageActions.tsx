"use client";

import { useState } from "react";
import {
  ArrowUp,
  Printer,
  FileDown,
  Link2,
  Search,
} from "lucide-react";

export default function PageActions({ content }: { content: string }) {
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");

  // 🔹 Toast simples (gov.br usa feedback leve)
  function showToast(message: string) {
    setToast(message);
    setTimeout(() => setToast(""), 2000);
  }

  // 🔹 Voltar ao topo
  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // 🔹 Print
  function handlePrint() {
    window.print();
  }

  // 🔹 PDF (usa print)
  function handlePDF() {
    window.print();
  }

  // 🔹 Copiar link
  function copyLink() {
    navigator.clipboard.writeText(window.location.href);
    showToast("Link copiado!");
  }

  // 🔹 Highlight de busca
  function highlight(text: string) {
    if (!search) return text;

    const regex = new RegExp(`(${search})`, "gi");

    return text.split(regex).map((part, i) =>
      part.toLowerCase() === search.toLowerCase() ? (
        <mark key={i} className="bg-yellow-300 px-1 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  }

  return (
    <>
      {/* 🔹 Barra de ações */}
      <div className="flex flex-wrap gap-2 mb-4 items-center justify-between">

        {/* 🔎 Busca */}
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <Search size={16} />
          <input
            type="text"
            placeholder="Buscar na página..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border px-3 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#173572]"
            aria-label="Buscar dentro da página"
          />
        </div>

        {/* 🔹 Ações */}
        <div className="flex gap-2">

          <button
            onClick={copyLink}
            aria-label="Copiar link da página"
            className="flex items-center gap-1 px-3 py-2 border rounded hover:bg-gray-100 transition"
          >
            <Link2 size={16} />
            <span className="hidden sm:inline">Copiar link</span>
          </button>

          <button
            onClick={handlePrint}
            aria-label="Imprimir página"
            className="flex items-center gap-1 px-3 py-2 border rounded hover:bg-gray-100 transition"
          >
            <Printer size={16} />
            <span className="hidden sm:inline">Imprimir</span>
          </button>

          <button
            onClick={handlePDF}
            aria-label="Salvar como PDF"
            className="flex items-center gap-1 px-3 py-2 border rounded hover:bg-gray-100 transition"
          >
            <FileDown size={16} />
            <span className="hidden sm:inline">PDF</span>
          </button>

        </div>
      </div>

      {/* 🔹 Conteúdo com highlight */}
      <div className="prose max-w-none">
        {highlight(content)}
      </div>

      {/* 🔹 Botão flutuante */}
      <button
        onClick={scrollToTop}
        className="fixed bottom-6 right-6 bg-[#173572] text-white p-3 rounded-full shadow-lg hover:bg-[#0f2847] transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#173572]"
        aria-label="Voltar ao topo"
      >
        <ArrowUp size={18} />
      </button>

      {/* 🔹 Toast */}
      {toast && (
        <div className="fixed bottom-20 right-6 bg-black text-white px-4 py-2 rounded shadow-lg text-sm">
          {toast}
        </div>
      )}
    </>
  );
}