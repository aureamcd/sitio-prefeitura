"use client";

import { useState, useEffect, JSX } from "react";
import Link from "next/link";
import Image from "next/image";
import { ExternalLink, UserCog } from "lucide-react";
import SearchBar from "./SearchBar";
import Navbar from "./NavBar";

const ContrastIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    width="20"
    height="20"
  >
    {/* Círculo externo */}
    <circle cx="12" cy="12" r="10" />
    {/* Metade preenchida (Direita) */}
    <path d="M12 2a10 10 0 0 1 0 20V2z" fill="currentColor" />
  </svg>
);

const UniversalAccessIcon = () => (
  <Image
    src="/acessibilidade.png"
    alt="Acessibilidade"
    width={22}
    height={22}
    className="object-contain bg-white rounded-full p-[2px]"
  />
);

// Tooltip acessível
function Tooltip({ text, id, children }: { text: string; id: string; children: JSX.Element; }) {
  return (
    <div className="relative group flex items-center">
      {children}
      {/* Adicionei 'hidden md:block' e 'pointer-events-none' para garantir que o balão não intercepte o toque */}
      <span
        id={id}
        role="tooltip"
        className="
        hidden md:block
        pointer-events-none
        absolute top-full mt-2 left-1/2 -translate-x-1/2
        opacity-0 md:group-hover:opacity-100
        transition-opacity duration-200
        bg-black text-white text-xs px-2 py-1 rounded
        whitespace-nowrap z-[110]
      "
      >
        {text}
      </span>
    </div>
  );
}

export default function Header(): JSX.Element {
  const [fontSize, setFontSize] = useState(16);
  const [contrast, setContrast] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const savedFontSize = localStorage.getItem("fontSize");
    const savedContrast = localStorage.getItem("highContrast");

    if (savedFontSize) {
      const size = parseInt(savedFontSize);
      setFontSize(size);
      document.documentElement.style.fontSize = `${size}px`;
    }

    if (savedContrast === "true") {
      setContrast(true);
      document.documentElement.classList.add("high-contrast");
    }
  }, []);

  function updateGlobalFont(size: number) {
    document.documentElement.style.fontSize = `${size}px`;
    localStorage.setItem("fontSize", String(size));
    setFontSize(size);
  }

  function increaseFont() {
    const next = Math.min(24, fontSize + 2);
    updateGlobalFont(next);
  }

  function decreaseFont() {
    const next = Math.max(12, fontSize - 2);
    updateGlobalFont(next);
  }

  function resetFont() {
    setFontSize(16);
    document.documentElement.style.fontSize = "16px";
    localStorage.setItem("fontSize", "16");
  }

  function toggleContrast() {
    const next = !contrast;
    setContrast(next);
    document.documentElement.classList.toggle("high-contrast", next);
    localStorage.setItem("highContrast", String(next));
  }

  return (
    <header className="w-full bg-white print:hidden">

      {/* 🔷 BARRA AZUL */}
      <div className="w-full bg-[#0B3D91] text-white">
        <div className="relative z-50 w-[90%] mx-auto flex flex-nowrap justify-end items-center py-2 gap-2 sm:gap-3 text-xs overflow-hidden">

          <Tooltip text="Aumentar fonte" id="tooltip-aumentar">
            <button
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                increaseFont();
              }}
              aria-label="Aumentar fonte"
              className="
                min-w-[22px] min-h-[22px]
                relative z-[100]
                flex items-center justify-center
                rounded hover:bg-white/10
                focus:ring-1 focus:ring-white
                touch-manipulation cursor-pointer
                active:scale-90 transition-transform text-xs
              "
            >
              A+
            </button>
          </Tooltip>

          <Tooltip text="Diminuir fonte" id="tooltip-diminuir">
            <button
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                decreaseFont();
              }}
              aria-label="Diminuir fonte"
              className="
                min-w-[22px] min-h-[22px]
                relative z-[100]
                flex items-center justify-center
                rounded hover:bg-white/10
                focus:ring-1 focus:ring-white
                touch-manipulation cursor-pointer
                active:scale-90 transition-transform text-xs
              "
            >
              A-
            </button>
          </Tooltip>

          <Tooltip text="Fonte padrão" id="tooltip-reset">
            <button
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                resetFont();
              }}
              aria-label="Fonte padrão"
              className="
                min-w-[22px] min-h-[22px]
                relative z-[100]
                flex items-center justify-center
                rounded hover:bg-white/10
                focus:ring-1 focus:ring-white
                touch-manipulation cursor-pointer
                active:scale-90 transition-transform text-xs
              "
            >
              A
            </button>
          </Tooltip>

          <div className="hidden sm:block w-px h-4 bg-white/40 mx-1" />

          <Tooltip text="Contraste" id="tooltip-contraste">
            <button
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                toggleContrast();
              }}
              aria-label="Alternar alto contraste"
              aria-pressed={contrast}
              className="
                min-w-[22px] min-h-[22px]
                relative z-[100]
                flex items-center justify-center
                rounded hover:bg-white/10
                focus:ring-1 focus:ring-white
                touch-manipulation cursor-pointer
                active:scale-90 transition-transform
              "
            >
              <ContrastIcon className={contrast ? "rotate-180 transition-transform" : "transition-transform"} />
            </button>
          </Tooltip>

          <div className="hidden sm:block w-px h-4 bg-white/40 mx-1" />

          <Tooltip text="Ir para página de acessibilidade" id="tooltip-acess">
            <Link
              href="/acessibilidade"
              className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-white/10 cursor-pointer active:scale-95 text-xs"
            >
              <UniversalAccessIcon />
              <span className="hidden sm:inline">Acessibilidade</span>
            </Link>
          </Tooltip>

          <div className="hidden sm:block w-px h-4 bg-white/40 mx-1" />

          <Tooltip text="Ir para Site da Prefeitura" id="tooltip-prefeitura">
            <a
              href="https://padremarcos.pi.gov.br"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Site da Prefeitura (abre em nova aba)"
              className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-white/10 cursor-pointer active:scale-95 text-xs"
            >
              <ExternalLink size={13} />
              <span className="hidden sm:inline">Site da Prefeitura</span>
              <span className="sr-only">(abre em nova aba)</span>
            </a>
          </Tooltip>

          <div className="hidden sm:block w-px h-4 bg-white/40 mx-1" />

          {/* Ícone Admin (discreto) */}
          <Tooltip text="Painel Administrativo" id="tooltip-admin">
            <Link
              href="/admin"
              aria-label="Painel Administrativo"
              className="flex items-center justify-center min-w-[22px] min-h-[22px]
                rounded hover:bg-white/10
                focus:ring-1 focus:ring-white
                touch-manipulation cursor-pointer
                active:scale-90 transition-transform
                opacity-60 hover:opacity-100"
            >
              <UserCog size={14} />
            </Link>
          </Tooltip>

        </div>

        {/* Faixa colorida */}
        <div className="w-full flex h-1.5">
          <div className="w-1/3 bg-[#F7C325]" />
          <div className="w-1/3 bg-[#E53935]" />
          <div className="w-1/3 bg-[#0052CC]" />
        </div>
      </div>

      {/* 🔷 LOGO + BUSCA + RADAR */}
      <div className="w-[90%] md:w-[70%] mx-auto py-7 flex flex-col md:flex-row md:items-center md:justify-between gap-4">

        {/* ESQUERDA: LOGO + NOME */}
        <Link
          href="/"
          className="flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-3"
        >
          <Image
            src="/logopm.png"
            alt="Prefeitura Municipal de Padre Marcos"
            width={60}
            height={56}
            style={{ width: "auto", height: "auto" }}
          />

          <div className="py-1 text-center sm:text-left">
            
            <h1
              className="text-xl md:text-2xl font-bold text-[#173572] leading-tight"
              style={{
                textShadow: `
            -1px -1px 0 #ffffff,
             1px -1px 0 #ffffff,
            -1px  1px 0 #ffffff,
             1px  1px 0 #ffffff,
            -2px -2px 0 #F7C325,
             2px -2px 0 #F7C325,
            -2px  2px 0 #F7C325,
             2px  2px 0 #F7C325
          `,
              }}
            >
              Portal da Transparência
            </h1>

            <p className="text-xs md:text-sm text-gray-600">
              Padre Marcos - PI
            </p>
          </div>
        </Link>

        {/* DIREITA: SEARCH + RADAR + MENU */}
        <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 w-full md:w-auto md:ml-auto">

          {/* SEARCH */}
          <div className="w-full md:w-64 lg:w-80">
            <SearchBar />
          </div>

          {/* RADAR + MENU MOBILE */}
          <div className="flex items-center justify-between md:justify-start gap-3 w-full md:w-auto">
            
            {/* RADAR */}
            <a
              href="https://radardatransparencia.atricon.org.br/"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gray-100 hover:bg-gray-200 border border-gray-200 px-2 py-1 rounded-lg shadow-sm transition-all flex-shrink-0"
            >
              <Image
                src="/LOGO RADAR.png"
                alt="Radar da Transparência"
                width={90}
                height={45}
                style={{ width: "auto", height: "40px" }}
              />
            </a>

            {/* SEPARADOR VERTICAL (só desktop) */}
            <div className="hidden md:block w-px h-8 bg-gray-300 mx-1" />

            {/* BOTÃO MENU MOBILE / DESKTOP (estilo pílula) */}
            <button
              type="button"
              aria-label="Abrir menu"
              aria-expanded={isMenuOpen}
              aria-controls="menu-mobile"
              onClick={() => setIsMenuOpen(true)}
              className="md:hidden flex items-center gap-2 px-4 py-2 rounded-full
                border border-[#173572]/20 bg-gray-50 text-[#173572] font-semibold
                hover:bg-[#173572]/10 transition-colors shadow-sm flex-shrink-0"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
              Menu
            </button>
          </div>
        </div>

      </div>

      {/* Linha (só no desktop) */}
      <div className="hidden md:block w-[80%] mx-auto h-[1.5px] bg-[#0B3D91]" />

      {/* Navbar */}
      <nav
        id="main-nav"
        tabIndex={-1}
        className="focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
      >
        <Navbar mobileOpen={isMenuOpen} setMobileOpen={setIsMenuOpen} />
      </nav>

     

    </header >
  );
}