"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect, KeyboardEvent, JSX, ReactElement } from "react";
import {
  Home, Folder, FileText, MessageSquare, X, ChevronDown, ChevronRight, Scale,
} from "lucide-react";

// ── tipos ──────────────────────────────────────────────────────────────────────
type RootKey = "prefeitura" | "servicos" | null;
type SubKey = "institucional" | "publicacoes" | null;
type MenuItem = { href: string; label: string };
type FixedItem = { href: string; label: string; icon: ReactElement; target?: string; rel?: string; ariaLabel?: string };

interface NavbarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

// ── dados ──────────────────────────────────────────────────────────────────────
const institucionalItems: MenuItem[] = [
  { href: "/estrutura-organizacional", label: "Estrutura Organizacional" },
  { href: "/competencias", label: "Competências" },
  { href: "/gestao", label: "Gestão" },
  { href: "/contatos-atendimento", label: "Contatos e Atendimento" },
  { href: "/FAQ", label: "FAQ" },
];



const publicacoesItems: MenuItem[] = [
  { href: "/atas-reunioes", label: "Atas de Reuniões" },
  { href: "/editais", label: "Editais" },
  { href: "/avisos-comunicados", label: "Avisos / Comunicados" },
  { href: "/diversas", label: "Publicações Diversas" },
];

const servicosItems = [
  { href: "/todos-servicos", label: "Todos os Serviços" },
  { href: "/servicos-online", label: "Serviços Online" },
  { href: "/carta-servicos", label: "Carta de Serviços" },
  { href: "/concursos-e-processos", label: "Concursos e Processos Seletivos" },
];


const fixedItems: FixedItem[] = [
  { href: "/acesso-informacao", label: "Acesso à Informação", icon: <FileText size={18} aria-hidden="true" /> },
  { href: "/leis-normas", label: "Leis e Normas", icon: <Scale size={18} aria-hidden="true" /> },
  { href: "/ouvidoria", label: "Ouvidoria", icon: <MessageSquare size={18} aria-hidden="true" /> },
];

const prefeituraCategories = [
  { key: "institucional" as SubKey, label: "Informações Institucionais", items: institucionalItems },
  { key: "publicacoes" as SubKey, label: "Publicações Oficiais", items: publicacoesItems },
];

// ══════════════════════════════════════════════════════════════════════════════
export default function Navbar({ mobileOpen, setMobileOpen }: NavbarProps): JSX.Element {
  const pathname = usePathname();

  // qual dropdown raiz está aberto (prefeitura ou servicos)
  const [openRoot, setOpenRoot] = useState<RootKey>(null);
  // qual flyout de sub-categoria está aberto (dentro de prefeitura)
  const [openSub, setOpenSub] = useState<SubKey>(null);

  // timer único para fechar tudo
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prefBtnRef = useRef<HTMLButtonElement | null>(null);
  const svcBtnRef = useRef<HTMLButtonElement | null>(null);

  function clearTimer() { if (closeTimer.current) clearTimeout(closeTimer.current); }
  function keepAlive() { clearTimer(); }

  function scheduleClose(ms = 250) {
    clearTimer();
    closeTimer.current = setTimeout(() => {
      setOpenRoot(null);
      setOpenSub(null);
    }, ms);
  }

  function openMenu(key: RootKey) {
    clearTimer();
    if (openRoot !== key) setOpenSub(null); // reseta sub ao trocar de menu
    setOpenRoot(key);
  }

  function closeAll() { clearTimer(); setOpenRoot(null); setOpenSub(null); }

  // ── efeitos ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    function onResize() {
      if (window.innerWidth >= 768) { setMobileOpen(false); closeAll(); }
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [setMobileOpen]);

  useEffect(() => {
    function onKey(e: Event) {
      if ((e as unknown as KeyboardEvent).key !== "Escape") return;
      if (mobileOpen) setMobileOpen(false);
      else closeAll();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileOpen, setMobileOpen]);

  // mobile
  const [mobileRoot, setMobileRoot] = useState<"prefeitura" | "servicos" | null>(null);
  const [mobileSub, setMobileSub] = useState<SubKey>(null);

  // ── estilos ─────────────────────────────────────────────────────────────────
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const navLinkCls = (href: string) => `
    px-4 py-2.5 rounded-full flex items-center gap-2
    text-sm whitespace-nowrap transition-all duration-200 cursor-pointer
    hover:bg-blue-100 hover:text-blue-700
    focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
    ${isActive(href) ? "bg-[#173572] text-white shadow-md font-medium" : "text-gray-700"}
  `;

  const navBtnCls = (prefix: string, _key: RootKey) => `
    px-4 py-2.5 rounded-full flex items-center gap-2
    text-sm whitespace-nowrap transition-all duration-200 cursor-pointer
    hover:bg-blue-100 hover:text-blue-700
    focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
    ${pathname.startsWith(prefix)
      ? "bg-[#173572] text-white shadow-md font-medium"
      : "text-gray-700"}
  `;

  const mobileLinkCls = (href: string) => `
    flex items-center gap-3 px-4 py-3.5 rounded-xl text-base
    transition-all duration-200 hover:bg-blue-100 hover:text-blue-700
    focus-visible:ring-2 focus-visible:ring-blue-500
    ${isActive(href) ? "bg-[#173572] text-white font-medium" : "text-gray-700"}
  `;

  const dropItemCls = (href: string) => `
    block px-5 py-3 text-sm transition-all duration-200 cursor-pointer whitespace-nowrap
    hover:bg-blue-100 hover:text-blue-700 rounded-lg mx-2 my-1
    focus-visible:ring-2 focus-visible:ring-blue-500 focus:outline-none
    ${isActive(href)
      ? "text-blue-700 font-semibold bg-blue-50"
      : "text-gray-700"}
  `;

  // ════════════════════════════════════════════════════════════════════════════
  return (
    <>
      {/* overlay */}
      {openRoot && (
        <div
          className="fixed inset-0 z-30 bg-black/35 transition-opacity duration-200"
          aria-hidden="true"
          onClick={closeAll}
        />
      )}

      {/* ── DESKTOP NAV ─────────────────────────────────────────────────────── */}
      <nav id="main-nav" tabIndex={-1} aria-label="Menu principal" className="relative z-40 focus:outline-none">
        <div className="w-[90%] mx-auto">
          <ul role="menubar" className="hidden md:flex flex-wrap justify-center gap-1 py-3">

            {/* Início */}
            <li role="none">
              <Link href="/" className={navLinkCls("/")}>
                <Home size={18} aria-hidden="true" />
                Início
              </Link>
            </li>

            {/* ── A Prefeitura ── */}
            <li
              role="none"
              className="relative"
              onMouseEnter={() => openMenu("prefeitura")}
              onMouseLeave={() => scheduleClose()}
            >
              <button
                ref={prefBtnRef}
                aria-haspopup="true"
                aria-expanded={openRoot === "prefeitura"}
                aria-controls="dropdown-prefeitura"
                className={navBtnCls("/prefeitura", "prefeitura")}
                onClick={() => openRoot === "prefeitura" ? closeAll() : openMenu("prefeitura")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openMenu("prefeitura");
                  }
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    if (openRoot !== "prefeitura") openMenu("prefeitura");
                    setTimeout(() => {
                      const first = document.querySelector('#dropdown-prefeitura [role="menuitem"]') as HTMLElement;
                      first?.focus();
                    }, 50);
                  }
                  if (e.key === "Escape") {
                    closeAll();
                  }
                }}
              >
                <Folder size={18} aria-hidden="true" />
                A Prefeitura
                <ChevronDown
                  aria-hidden="true"
                  className={`w-4 h-4 transition-transform duration-200 ${openRoot === "prefeitura" ? "rotate-180" : ""}`}
                />
              </button>

              {/* DROPDOWN PREFEITURA — nível 1 com flyout */}
              {openRoot === "prefeitura" && (
                <div
                  id="dropdown-prefeitura"
                  role="menu"
                  onMouseEnter={keepAlive}
                  onMouseLeave={() => scheduleClose()}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                      const isSubMenuOpen = !!openSub;
                      if (!isSubMenuOpen) {
                         e.preventDefault();
                         const items = Array.from(document.querySelectorAll('#dropdown-prefeitura > div > button[role="menuitem"]')) as HTMLElement[];
                         const idx = items.indexOf(document.activeElement as HTMLElement);
                         if (idx !== -1) {
                           if (e.key === "ArrowDown") (items[idx + 1] || items[0])?.focus();
                           else (items[idx - 1] || items[items.length - 1])?.focus();
                         }
                      }
                    }
                    if (e.key === "Escape") {
                      closeAll();
                      prefBtnRef.current?.focus();
                    }
                  }}
                  className="absolute left-0 top-full mt-2 z-50
                    bg-white border border-gray-100 rounded-2xl shadow-lg py-2 w-64"
                >
                  {prefeituraCategories.map((cat) => (
                    <div
                      key={cat.key}
                      className="relative"
                      onMouseEnter={() => { keepAlive(); setOpenSub(cat.key); }}
                      onMouseLeave={() => scheduleClose()}
                    >
                      <button
                        role="menuitem"
                        aria-haspopup="true"
                        aria-expanded={openSub === cat.key}
                        onClick={() => setOpenSub(openSub === cat.key ? null : cat.key)}
                        onKeyDown={(e) => {
                          if (e.key === "ArrowRight" || e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setOpenSub(cat.key);
                            setTimeout(() => {
                              const subFirst = document.querySelector(`#submenu-${cat.key} [role="menuitem"]`) as HTMLElement;
                              subFirst?.focus();
                            }, 50);
                          }
                        }}
                        className={`
                          w-full flex items-center justify-between gap-2
                          px-5 py-3.5 text-sm transition-all duration-200 select-none cursor-pointer
                          border-l-4 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500
                          ${openSub === cat.key
                            ? "text-[#173572] font-semibold bg-gradient-to-r from-[#173572]/5 to-[#173572]/10 border-[#173572] pl-7"
                            : "text-gray-700 border-transparent hover:text-[#173572] hover:bg-gradient-to-r hover:from-[#173572]/5 hover:to-[#173572]/10 hover:border-[#173572] hover:pl-7"}
                        `}
                      >
                        <span className="whitespace-nowrap">{cat.label}</span>
                        <ChevronRight size={14} aria-hidden="true" className="opacity-40 flex-shrink-0" />
                      </button>

                      {/* FLYOUT nível 2 */}
                      {openSub === cat.key && (
                        <div
                          id={`submenu-${cat.key}`}
                          role="menu"
                          onMouseEnter={keepAlive}
                          onMouseLeave={() => scheduleClose()}
                          onKeyDown={(e) => {
                            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                              e.preventDefault();
                              const items = Array.from(document.querySelectorAll(`#submenu-${cat.key} [role="menuitem"]`)) as HTMLElement[];
                              const idx = items.indexOf(document.activeElement as HTMLElement);
                              if (idx !== -1) {
                                if (e.key === "ArrowDown") (items[idx + 1] || items[0])?.focus();
                                else (items[idx - 1] || items[items.length - 1])?.focus();
                              }
                            }
                            if (e.key === "ArrowLeft" || e.key === "Escape") {
                              e.preventDefault();
                              setOpenSub(null);
                              // Retorna foco para o botão que abriu o submenu
                              const parentBtn = document.activeElement?.closest('.relative')?.querySelector('button[role="menuitem"]') as HTMLElement;
                              parentBtn?.focus();
                            }
                          }}
                          className="absolute left-full top-0 ml-1 z-50
                            bg-white border border-gray-100 rounded-2xl shadow-lg py-2 min-w-[220px]"
                        >
                          {cat.items.map((item) => (
                            <Link
                              key={item.href}
                              href={item.href}
                              role="menuitem"
                              onClick={closeAll}
                              className={dropItemCls(item.href)}
                            >
                              {item.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </li>

            {/* ── Serviços ── */}
            <li
              role="none"
              className="relative"
              onMouseEnter={() => openMenu("servicos")}
              onMouseLeave={() => scheduleClose()}
            >
              <button
                ref={svcBtnRef}
                aria-haspopup="true"
                aria-expanded={openRoot === "servicos"}
                aria-controls="dropdown-servicos"
                className={navBtnCls("/servicos", "servicos")}
                onClick={() => openRoot === "servicos" ? closeAll() : openMenu("servicos")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openMenu("servicos");
                  }
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    if (openRoot !== "servicos") openMenu("servicos");
                    setTimeout(() => {
                      const first = document.querySelector('#dropdown-servicos [role="menuitem"]') as HTMLElement;
                      first?.focus();
                    }, 50);
                  }
                  if (e.key === "Escape") {
                    closeAll();
                  }
                }}
              >
                <FileText size={18} aria-hidden="true" />
                Serviços
                <ChevronDown
                  aria-hidden="true"
                  className={`w-4 h-4 transition-transform duration-200 ${openRoot === "servicos" ? "rotate-180" : ""}`}
                />
              </button>

              {/* DROPDOWN SERVIÇOS — flat, sem flyout */}
              {openRoot === "servicos" && (
                <div
                  id="dropdown-servicos"
                  role="menu"
                  onMouseEnter={keepAlive}
                  onMouseLeave={() => scheduleClose()}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                      e.preventDefault();
                      const items = Array.from(document.querySelectorAll('#dropdown-servicos [role="menuitem"]')) as HTMLElement[];
                      const idx = items.indexOf(document.activeElement as HTMLElement);
                      if (e.key === "ArrowDown") {
                        (items[idx + 1] || items[0])?.focus();
                      } else {
                        (items[idx - 1] || items[items.length - 1])?.focus();
                      }
                    }
                    if (e.key === "Escape") {
                      closeAll();
                      svcBtnRef.current?.focus();
                    }
                  }}
                  className="absolute left-0 top-full mt-2 z-50
                    bg-white border border-gray-100 rounded-2xl shadow-lg py-2 min-w-[210px]"
                >
                  {servicosItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      role="menuitem"
                      onClick={closeAll}
                      className={dropItemCls(item.href)}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </li>

            {/* Itens fixos */}
            {fixedItems.map((item) => (
              <li key={item.href} role="none">
                <Link href={item.href} target={item.target} rel={item.rel} aria-label={item.ariaLabel} className={navLinkCls(item.href)}>
                  {item.icon}
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* ── MOBILE: overlay ─────────────────────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── MOBILE: painel ──────────────────────────────────────────────────── */}
      <div
        id="menu-mobile"
        role="dialog"
        aria-modal="true"
        aria-label="Menu de navegação"
        className={`
          md:hidden fixed top-0 right-0 h-full w-72 max-w-[85vw] z-50
          bg-white shadow-2xl
          transform transition-transform duration-300 ease-in-out
          ${mobileOpen ? "translate-x-0" : "translate-x-full"}
        `}
      >
        <div className="flex items-center justify-between px-4 py-4 bg-[#173572]">
          <span className="text-sm font-semibold text-white">Prefeitura Municipal</span>
          <button
            aria-label="Fechar menu"
            onClick={() => setMobileOpen(false)}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10
                       focus-visible:ring-2 focus-visible:ring-white transition-colors"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <ul className="flex flex-col gap-1 p-4 overflow-y-auto h-[calc(100%-60px)]">

          {/* Início */}
          <li>
            <Link href="/" onClick={() => setMobileOpen(false)} className={mobileLinkCls("/")}>
              <Home size={18} aria-hidden="true" />
              Início
            </Link>
          </li>

          {/* A Prefeitura */}
          <li>
            <button
              aria-expanded={mobileRoot === "prefeitura"}
              onClick={() => { setMobileRoot(mobileRoot === "prefeitura" ? null : "prefeitura"); setMobileSub(null); }}
              className={`w-full flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl
                text-base transition-all duration-200
                hover:bg-[#173572]/10 hover:text-[#173572] focus-visible:ring-2 focus-visible:ring-[#173572]
                ${pathname.startsWith("/prefeitura") ? "bg-[#173572]/10 text-[#173572]" : "text-gray-700"}`}
            >
              <span className="flex items-center gap-3">
                <Folder size={18} aria-hidden="true" />
                A Prefeitura
              </span>
              <ChevronDown
                aria-hidden="true"
                className={`w-4 h-4 transition-transform duration-200 flex-shrink-0 ${mobileRoot === "prefeitura" ? "rotate-180" : ""}`}
              />
            </button>

            {mobileRoot === "prefeitura" && (
              <div className="mt-1 ml-4 border-l-2 border-[#173572]/20 pl-3 flex flex-col gap-2 pb-1">
                {prefeituraCategories.map((cat) => (
                  <div key={cat.key}>
                    <button
                      aria-expanded={mobileSub === cat.key}
                      onClick={() => setMobileSub(mobileSub === cat.key ? null : cat.key)}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg
                        text-sm font-semibold text-[#173572] hover:bg-[#173572]/8 transition"
                    >
                      {cat.label}
                      <ChevronRight
                        size={13}
                        aria-hidden="true"
                        className={`transition-transform duration-200 ${mobileSub === cat.key ? "rotate-90" : ""}`}
                      />
                    </button>

                    {mobileSub === cat.key && (
                      <ul className="mt-1 flex flex-col gap-0.5">
                        {cat.items.map((item) => (
                          <li key={item.href}>
                            <Link
                              href={item.href}
                              onClick={() => setMobileOpen(false)}
                              className={`block px-4 py-2.5 rounded-lg text-sm transition-all duration-150
                                hover:bg-[#173572]/10 hover:text-[#173572]
                                ${isActive(item.href) ? "text-[#173572] font-medium" : "text-gray-600"}`}
                            >
                              {item.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}
          </li>

          {/* Serviços */}
          <li>
            <button
              aria-expanded={mobileRoot === "servicos"}
              onClick={() => setMobileRoot(mobileRoot === "servicos" ? null : "servicos")}
              className={`w-full flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl
                text-base transition-all duration-200
                hover:bg-[#173572]/10 hover:text-[#173572] focus-visible:ring-2 focus-visible:ring-[#173572]
                ${pathname.startsWith("/servicos") ? "bg-[#173572]/10 text-[#173572]" : "text-gray-700"}`}
            >
              <span className="flex items-center gap-3">
                <FileText size={18} aria-hidden="true" />
                Serviços
              </span>
              <ChevronDown
                aria-hidden="true"
                className={`w-4 h-4 transition-transform duration-200 flex-shrink-0 ${mobileRoot === "servicos" ? "rotate-180" : ""}`}
              />
            </button>

            {mobileRoot === "servicos" && (
              <ul className="mt-1 ml-4 border-l-2 border-[#173572]/20 pl-3 flex flex-col gap-0.5">
                {servicosItems.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`block px-3 py-2.5 rounded-lg text-sm transition-all duration-150
                        hover:bg-[#173572]/10 hover:text-[#173572]
                        ${isActive(item.href) ? "text-[#173572] font-medium" : "text-gray-600"}`}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </li>

          {/* Itens fixos */}
          {fixedItems.map((item) => (
            <li key={item.href}>
              <Link href={item.href} target={item.target} rel={item.rel} aria-label={item.ariaLabel} onClick={() => setMobileOpen(false)} className={mobileLinkCls(item.href)}>
                {item.icon}
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}