"use client";

import { useState, useEffect, ReactNode, useRef } from "react";
import {
  ArrowUp,
  Printer,
  FileDown,
  Link2,
  Search,
} from "lucide-react";

type Props = {
  contentRef: React.RefObject<HTMLDivElement | null>;
  buttonClassName?: string;
  children?: ReactNode;
};

export default function PageActions({ contentRef, buttonClassName, children }: Props) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [toast, setToast] = useState("");
  const [showTopBtn, setShowTopBtn] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setShowTopBtn(window.scrollY > 300);
    }
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const [matchCount, setMatchCount] = useState(0);
  const [currentMatch, setCurrentMatch] = useState(0);
  const marksRef = useRef<HTMLElement[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!contentRef.current) return;
    const container = contentRef.current;

    // limpa highlights antigos
    const marks = container.querySelectorAll("mark");
    marks.forEach((mark) => {
      const parent = mark.parentNode;
      if (parent) {
        parent.replaceChild(
          document.createTextNode(mark.textContent || ""),
          mark
        );
        parent.normalize();
      }
    });

    marksRef.current = [];
    setMatchCount(0);
    setCurrentMatch(0);

    if (!debouncedSearch) return;

    function escapeRegex(text: string) {
      return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }

    const regex = new RegExp(`(${escapeRegex(debouncedSearch)})`, "gi");

    const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_TEXT
    );

    const nodes: Text[] = [];
    let node;
    while ((node = walker.nextNode())) {
      nodes.push(node as Text);
    }

    nodes.forEach((textNode) => {
      if (!textNode.parentElement) return;

      const parts = textNode.nodeValue?.split(regex);
      if (!parts || parts.length === 1) return;

      const fragment = document.createDocumentFragment();

      parts.forEach((part) => {
        if (part.toLowerCase() === debouncedSearch.toLowerCase()) {
          const mark = document.createElement("mark");
          mark.className = "bg-yellow-300 px-1 rounded focus:outline-none focus:ring-2 focus:ring-[#173572] focus:ring-offset-1";
          mark.textContent = part;
          fragment.appendChild(mark);
        } else {
          fragment.appendChild(document.createTextNode(part));
        }
      });

      textNode.parentElement.replaceChild(fragment, textNode);
    });

    const allMarks = Array.from(container.querySelectorAll("mark"));
    marksRef.current = allMarks;
    setMatchCount(allMarks.length);

    if (allMarks.length > 0) {
      allMarks.forEach((m, idx) => {
        m.id = `search-match-${idx}`;
        m.tabIndex = -1;
      });
      allMarks[0].scrollIntoView({ behavior: "smooth", block: "center" });
      allMarks[0].focus({ preventScroll: true });
    }
  }, [debouncedSearch, contentRef]);

  function nextMatch() {
    if (matchCount === 0) return;
    const nextIdx = (currentMatch + 1) % matchCount;
    setCurrentMatch(nextIdx);
    const m = marksRef.current[nextIdx];
    if (m) {
      m.scrollIntoView({ behavior: "smooth", block: "center" });
      m.focus({ preventScroll: true });
    }
  }

  function showToast(message: string) {
    setToast(message);
    setTimeout(() => setToast(""), 2500);
  }

  // 🔹 Scroll topo
  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // 🔹 Print (nativo do navegador)
  function handlePrint() {
    document.body.classList.add("pdf-mode");
    setTimeout(() => {
      window.print();
      document.body.classList.remove("pdf-mode");
    }, 100);
  }

  // 🔹 PDF Real (jspdf + html2canvas)
  async function handlePdf() {
    if (!contentRef.current) return;

    showToast("Gerando PDF...");

    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      const element = contentRef.current;

      // 🔥 ativa modo seguro
      document.body.classList.add("pdf-mode");

      await new Promise((r) => setTimeout(r, 100)); // garante repaint

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",

        ignoreElements: (el) => {
          // Esconde UI de ações, breadcrumb e botões de navegação do PDF
          if (el.tagName === "NAV") {
            const label = el.getAttribute("aria-label");
            if (label === "Ações da página" || label === "Localização na página") return true;
          }
          if (el.tagName === "BUTTON" && el.getAttribute("aria-label") === "Voltar ao topo") return true;

          const style = window.getComputedStyle(el);
          return (
            style.color.includes("lab") ||
            style.backgroundColor.includes("lab") ||
            style.borderColor.includes("lab")
          );
        }
      });

      // 🔥 remove modo seguro
      document.body.classList.remove("pdf-mode");

      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF("p", "mm", "a4");

      const margin = 15; // 15mm de borda em todos os lados
      const pdfWidth = pdf.internal.pageSize.getWidth() - margin * 2;
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      const canvasHeightInMm = (canvas.height * pdfWidth) / canvas.width;
      const usableHeight = pageHeight - margin * 2;
      
      let heightLeft = canvasHeightInMm;
      let position = margin;

      // Desenha a primeira página
      pdf.addImage(imgData, "PNG", margin, position, pdfWidth, canvasHeightInMm);
      heightLeft -= usableHeight;

      // Se ainda houver conteúdo, fatia em novas páginas
      while (heightLeft > 0) {
        position -= usableHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", margin, position, pdfWidth, canvasHeightInMm);
        heightLeft -= usableHeight;
      }

      pdf.save("documento.pdf");

      showToast("PDF gerado!");
    } catch (err) {
      console.error(err);

      // garante que remove mesmo com erro
      document.body.classList.remove("pdf-mode");

      showToast("Erro ao gerar PDF.");
    }
  }

  // 🔹 Copiar link
  function copyLink() {
    const url = window.location.href;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url)
        .then(() => showToast("Link copiado!"))
        .catch(() => showToast("Erro ao copiar o link."));
      return;
    }

    try {
      const textArea = document.createElement("textarea");
      textArea.value = url;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      const successful = document.execCommand("copy");
      document.body.removeChild(textArea);

      if (successful) {
        showToast("Link copiado!");
      } else {
        showToast("Não foi possível copiar.");
      }
    } catch (err) {
      showToast("Erro ao tentar copiar.");
    }
  }

  return (
    <>
      {/* Busca */}
      <div className="flex items-center gap-2 flex-1 min-w-[200px]">
        <div className="flex items-center gap-2 border border-[#d1d5db] rounded-md px-2.5 bg-white w-full max-w-[260px] focus-within:ring-2 focus-within:ring-[#173572] focus-within:border-[#173572] transition-colors">
          <Search size={14} className="text-[#9ca3af] shrink-0" aria-hidden="true" />
          <label htmlFor="search-input" className="sr-only">
            Buscar dentro da página
          </label>
          <input
            id="search-input"
            type="text"
            placeholder="Buscar na página..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                nextMatch();
              }
            }}
            className="border-none outline-none text-[13px] py-1.5 text-[#374151] bg-transparent w-full"
          />
          {matchCount > 0 && (
            <span className="text-[11px] text-gray-500 shrink-0 whitespace-nowrap select-none" aria-hidden="true">
              {currentMatch + 1}/{matchCount}
            </span>
          )}
        </div>
      </div>

      {/* ARIA-LIVE ANNOUNCER PARA LEITORES DE TELA (Busca) */}
      <div aria-live="assertive" className="sr-only">
        {debouncedSearch
          ? matchCount > 0
            ? `${matchCount} resultados encontrados para "${debouncedSearch}". Exibindo resultado ${currentMatch + 1} de ${matchCount}. Pressione Enter para ir ao próximo.`
            : `Nenhum resultado encontrado para "${debouncedSearch}".`
          : ""}
      </div>

      {/* Ações */}
      <div className="flex gap-1.5 items-center">
        <button
          type="button"
          onClick={copyLink}
          className={buttonClassName || "flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 border rounded hover:bg-gray-100"}
          aria-label="Copiar link"
        >
          <Link2 size={13} aria-hidden="true" />
          <span className="hidden sm:inline">Copiar link</span>
        </button>

        <button
          type="button"
          onClick={handlePrint}
          className={buttonClassName || "flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 border rounded hover:bg-gray-100"}
          aria-label="Imprimir página"
        >
          <Printer size={13} aria-hidden="true" />
          <span className="hidden sm:inline">Imprimir</span>
        </button>

        <button
          type="button"
          onClick={handlePdf}
          className={buttonClassName || "flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 border rounded hover:bg-gray-100"}
          aria-label="Baixar PDF"
        >
          <FileDown size={13} aria-hidden="true" />
          <span className="hidden sm:inline">PDF</span>
        </button>

        {children && (
          <>
            <span className="w-px h-5 bg-[#e5e7eb] mx-0.5"></span>
            {children}
          </>
        )}
      </div>

      {/* Botão topo */}
      <button
        type="button"
        onClick={scrollToTop}
        className={`fixed bottom-6 right-6 bg-[#173572] text-white p-3 rounded-full shadow-lg hover:bg-[#0f2847] z-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#173572] transition-all duration-300 ${showTopBtn ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-4 pointer-events-none"
          }`}
        aria-label="Voltar ao topo"
        aria-controls="page-content"
        aria-hidden={!showTopBtn}
        tabIndex={showTopBtn ? 0 : -1}
      >
        <ArrowUp size={18} />
      </button>

      {/* Toast */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-20 left-6 bg-gray-900 text-white px-4 py-2.5 rounded shadow-lg text-sm z-50 transition-opacity duration-300"
        >
          {toast}
        </div>
      )}
    </>
  );
}