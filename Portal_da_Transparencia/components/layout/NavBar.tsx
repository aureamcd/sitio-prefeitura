"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useState,
  useRef,
  useEffect,
  KeyboardEvent,
  JSX,
  ReactElement,
} from "react";
import {
  Home,
  Folder,
  MessageSquare,
  Phone,
  X,
  ChevronDown,
  Users,
} from "lucide-react";

type MenuKey = "atividades" | "conselhos" | null;
type MenuItem = { href: string; label: string };
type FixedItem = { href: string; label: string; icon: ReactElement; external?: boolean };

interface NavbarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export default function Navbar({ mobileOpen, setMobileOpen }: NavbarProps): JSX.Element {
  const pathname = usePathname();
  const [openMenu, setOpenMenu] = useState<MenuKey>(null);

  const atividadesRefs = useRef<Array<HTMLAnchorElement | null>>([]);
  const conselhosRefs = useRef<Array<HTMLAnchorElement | null>>([]);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLUListElement | null>(null);
  const atividadesItems: MenuItem[] = [
    { href: "/atividades/saude", label: "Saúde" },
    { href: "/atividades/educacao", label: "Educação" },
  ];

  const conselhosItems: MenuItem[] = [
    { href: "/conselhos/saude", label: "Conselho de Saúde" },
    { href: "/conselhos/educacao", label: "Conselho do Fundeb / Educação" },
    { href: "/conselhos/assistencia", label: "Conselho de Assistência Social" },
  ];

  const fixedItems: FixedItem[] = [
    { href: "https://padremarcos.pi.gov.br/esic", label: "E-SIC", external: true, icon: <MessageSquare size={18} aria-hidden="true" /> },
    { href: "/ouvidoria", label: "Ouvidoria", icon: <MessageSquare size={18} aria-hidden="true" /> },
    { href: "/contato", label: "Contato", icon: <Phone size={18} aria-hidden="true" /> },
  ];

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  function closeMenus() { setOpenMenu(null); }

  function openMenuHover(menu: MenuKey) {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    setOpenMenu(menu);
  }

  function scheduleClose(delay = 200) {
    closeTimeoutRef.current = setTimeout(() => setOpenMenu(null), delay);
  }

  function cancelClose() {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
  }

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 768) { setMobileOpen(false); closeMenus(); }
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setMobileOpen]);

  useEffect(() => {
    function handleEscape(e: Event) {
      if ((e as unknown as KeyboardEvent).key === "Escape") {
        if (mobileOpen) { setMobileOpen(false); }
        else { closeMenus(); buttonRef.current?.focus(); }
      }
    }
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (menuRef.current && !menuRef.current.contains(target) && !buttonRef.current?.contains(target))
        closeMenus();
    }
    document.addEventListener("keydown", handleEscape);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [mobileOpen, setMobileOpen]);

  // CSS Padronizado
  const linkClass = (href: string) => `
    px-3 py-1.5 rounded-full flex items-center gap-1.5
    text-sm whitespace-nowrap transition-all duration-200 cursor-pointer
    hover:bg-blue-50 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
    ${isActive(href) ? "bg-[#173572] text-white shadow-sm font-medium" : "text-gray-600 hover:text-[#173572]"}
  `;

  const navBtnCls = (prefix: string) => `
    px-3 py-1.5 rounded-full flex items-center gap-1.5
    text-sm whitespace-nowrap transition-all duration-200 cursor-pointer
    hover:bg-blue-50 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
    ${pathname.startsWith(prefix)
      ? "bg-[#173572] text-white shadow-sm font-medium"
      : "text-gray-600 hover:text-[#173572]"}
  `;

  const dropItemCls = (href: string) => `
    flex items-center justify-between gap-2
    px-5 py-3.5 text-sm transition-all duration-200
    border-l-4 cursor-pointer whitespace-nowrap
    ${isActive(href)
      ? "text-[#173572] font-semibold bg-gradient-to-r from-[#173572]/5 to-[#173572]/10 border-[#173572] pl-7"
      : "text-gray-700 border-transparent hover:text-[#173572] hover:bg-gradient-to-r hover:from-[#173572]/5 hover:to-[#173572]/10 hover:border-[#173572] hover:pl-7"}
    focus-visible:ring-2 focus-visible:ring-[#173572] focus:outline-none
  `;

  const mobileLinkClass = (href: string) => `
    flex items-center gap-3 px-4 py-3.5 rounded-xl text-base
    transition-all duration-200 hover:bg-blue-50 hover:text-blue-700
    focus-visible:ring-2 focus-visible:ring-blue-500
    ${isActive(href) ? "bg-[#173572] text-white" : "text-gray-700"}
  `;

  return (
    <>
      {/* ── DESKTOP ── */}
      <nav aria-label="Menu principal" className="relative z-40">
        <div className="w-[90%] mx-auto">
          <ul role="menubar" className="hidden md:flex flex-wrap justify-center gap-1 py-3">

            <li role="none">
              <Link href="/" className={linkClass("/")}>
                <Home size={18} aria-hidden="true" />
                Início
              </Link>
            </li>

            <li role="none" className="relative" onMouseEnter={() => openMenuHover("atividades")} onMouseLeave={() => scheduleClose()}>
              <button
                ref={buttonRef}
                aria-haspopup="true"
                aria-expanded={openMenu === "atividades"}
                aria-controls="menu-atividades"
                className={navBtnCls("/atividades")}
                onClick={() => openMenu === "atividades" ? closeMenus() : setOpenMenu("atividades")}
                onKeyDown={(e: KeyboardEvent<HTMLButtonElement>) => {
                  if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
                    e.preventDefault();
                    setOpenMenu("atividades");
                    setTimeout(() => atividadesRefs.current[0]?.focus(), 0);
                  }
                }}
              >
                <Folder size={18} aria-hidden="true" />
                Atividades Finalísticas
                <ChevronDown aria-hidden="true"
                  className={`w-4 h-4 transition-transform duration-200 ${openMenu === "atividades" ? "rotate-180" : ""}`} />
              </button>

              {openMenu === "atividades" && (
                <ul ref={menuRef} id="menu-atividades" role="menu"
                  className="absolute left-0 mt-2 min-w-[210px] bg-white border border-gray-100 rounded-2xl shadow-lg py-2 z-50 overflow-hidden"
                  onMouseEnter={cancelClose} onMouseLeave={() => scheduleClose()}>
                  {atividadesItems.map((item, i) => (
                    <li key={item.href} role="none">
                      <Link
                        href={item.href} role="menuitem"
                        ref={(el) => { atividadesRefs.current[i] = el; }}
                        className={dropItemCls(item.href)}
                        onKeyDown={(e: KeyboardEvent<HTMLAnchorElement>) => {
                          if (e.key === "ArrowDown") { e.preventDefault(); atividadesRefs.current[i + 1]?.focus(); }
                          if (e.key === "ArrowUp") { e.preventDefault(); i === 0 ? buttonRef.current?.focus() : atividadesRefs.current[i - 1]?.focus(); }
                          if (e.key === "Escape") { closeMenus(); buttonRef.current?.focus(); }
                        }}
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>

            <li role="none" className="relative" onMouseEnter={() => openMenuHover("conselhos")} onMouseLeave={() => scheduleClose()}>
              <button
                aria-haspopup="true"
                aria-expanded={openMenu === "conselhos"}
                aria-controls="menu-conselhos"
                className={navBtnCls("/conselhos")}
                onClick={() => openMenu === "conselhos" ? closeMenus() : setOpenMenu("conselhos")}
                onKeyDown={(e: KeyboardEvent<HTMLButtonElement>) => {
                  if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
                    e.preventDefault();
                    setOpenMenu("conselhos");
                    setTimeout(() => conselhosRefs.current[0]?.focus(), 0);
                  }
                }}
              >
                <Users size={18} aria-hidden="true" />
                Conselhos Municipais
                <ChevronDown aria-hidden="true"
                  className={`w-4 h-4 transition-transform duration-200 ${openMenu === "conselhos" ? "rotate-180" : ""}`} />
              </button>

              {openMenu === "conselhos" && (
                <ul id="menu-conselhos" role="menu"
                  className="absolute left-0 mt-2 min-w-[280px] bg-white border border-gray-100 rounded-2xl shadow-lg py-2 z-50 overflow-hidden"
                  onMouseEnter={cancelClose} onMouseLeave={() => scheduleClose()}>
                  {conselhosItems.map((item, i) => (
                    <li key={item.href} role="none">
                      <Link
                        href={item.href} role="menuitem"
                        ref={(el) => { conselhosRefs.current[i] = el; }}
                        className={dropItemCls(item.href)}
                        onKeyDown={(e: KeyboardEvent<HTMLAnchorElement>) => {
                          if (e.key === "ArrowDown") { e.preventDefault(); conselhosRefs.current[i + 1]?.focus(); }
                          if (e.key === "ArrowUp") { e.preventDefault(); i === 0 ? buttonRef.current?.focus() : conselhosRefs.current[i - 1]?.focus(); }
                          if (e.key === "Escape") { closeMenus(); buttonRef.current?.focus(); }
                        }}
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>

            {fixedItems.map((item) => (
              <li key={item.href} role="none">
                {item.external ? (
                  <a href={item.href} target="_blank" rel="noopener noreferrer" className={linkClass(item.href)}>
                    {item.icon}
                    {item.label}
                  </a>
                ) : (
                  <Link href={item.href} className={linkClass(item.href)}>
                    {item.icon}
                    {item.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* overlay escurecimento */}
      {openMenu && (
        <div
          className="hidden md:block fixed inset-0 z-30 bg-black/15 transition-opacity duration-200"
          aria-hidden="true"
          onClick={closeMenus}
        />
      )}

      {/* ── MOBILE: overlay ── */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)} aria-hidden="true" />
      )}

      {/* ── MOBILE: painel lateral ── */}
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
          <span className="text-sm font-semibold text-white">Portal da Transparência</span>
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
          <li>
            <Link href="/" onClick={() => setMobileOpen(false)} className={mobileLinkClass("/")}>
              <Home size={18} aria-hidden="true" />
              Início
            </Link>
          </li>

          {/* Atividades — acordeão */}
          <li>
            <button
              aria-expanded={openMenu === "atividades"}
              onClick={() => setOpenMenu(openMenu === "atividades" ? null : "atividades")}
              className={`w-full flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl
                text-base transition-all duration-200
                hover:bg-[#173572]/10 hover:text-[#173572] focus-visible:ring-2 focus-visible:ring-[#173572]
                ${pathname.startsWith("/atividades") ? "bg-[#173572]/10 text-[#173572]" : "text-gray-700"}`}
            >
              <span className="flex items-center gap-3">
                <Folder size={18} aria-hidden="true" />
                Atividades Finalísticas
              </span>
              <ChevronDown aria-hidden="true"
                className={`w-4 h-4 transition-transform duration-200 flex-shrink-0 ${openMenu === "atividades" ? "rotate-180" : ""}`} />
            </button>

            {openMenu === "atividades" && (
              <ul className="mt-1 ml-4 flex flex-col gap-0.5 border-l-2 border-[#173572]/20 pl-3">
                {atividadesItems.map((item) => (
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

          {/* Conselhos — acordeão */}
          <li>
            <button
              aria-expanded={openMenu === "conselhos"}
              onClick={() => setOpenMenu(openMenu === "conselhos" ? null : "conselhos")}
              className={`w-full flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl
                text-base transition-all duration-200
                hover:bg-[#173572]/10 hover:text-[#173572] focus-visible:ring-2 focus-visible:ring-[#173572]
                ${pathname.startsWith("/conselhos") ? "bg-[#173572]/10 text-[#173572]" : "text-gray-700"}`}
            >
              <span className="flex items-center gap-3">
                <Users size={18} aria-hidden="true" />
                Conselhos Municipais
              </span>
              <ChevronDown aria-hidden="true"
                className={`w-4 h-4 transition-transform duration-200 flex-shrink-0 ${openMenu === "conselhos" ? "rotate-180" : ""}`} />
            </button>

            {openMenu === "conselhos" && (
              <ul className="mt-1 ml-4 flex flex-col gap-0.5 border-l-2 border-[#173572]/20 pl-3">
                {conselhosItems.map((item) => (
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

          {fixedItems.map((item) => (
            <li key={item.href}>
              {item.external ? (
                <a href={item.href} target="_blank" rel="noopener noreferrer" onClick={() => setMobileOpen(false)} className={mobileLinkClass(item.href)}>
                  {item.icon}
                  {item.label}
                </a>
              ) : (
                <Link href={item.href} onClick={() => setMobileOpen(false)} className={mobileLinkClass(item.href)}>
                  {item.icon}
                  {item.label}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </div>     

    </>    
  );  
}