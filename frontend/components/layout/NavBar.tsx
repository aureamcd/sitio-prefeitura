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

  FileText,

  MessageSquare,

  Phone,

  X,

  ChevronDown,

} from "lucide-react";



type MenuKey = "atividades" | null;

type MenuItem = { href: string; label: string };

type FixedItem = { href: string; label: string; icon: ReactElement };



interface NavbarProps {

  mobileOpen: boolean;

  setMobileOpen: (open: boolean) => void;

}



export default function Navbar({ mobileOpen, setMobileOpen }: NavbarProps): JSX.Element {

  const pathname = usePathname();

  const [openMenu, setOpenMenu] = useState<MenuKey>(null);



  const atividadesRefs = useRef<Array<HTMLAnchorElement | null>>([]);

  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const buttonRef = useRef<HTMLButtonElement | null>(null);

  const menuRef = useRef<HTMLUListElement | null>(null);



  const atividadesItems: MenuItem[] = [

    { href: "/atividades/saude", label: "Saúde" },

    { href: "/atividades/educacao", label: "Educação" },

    { href: "/atividades/assistencia", label: "Assistência Social" },

    { href: "/atividades/demais", label: "Demais Programas" },

  ];



  const fixedItems: FixedItem[] = [

    { href: "/page", label: "Transparência", icon: <FileText size={18} aria-hidden="true" /> },

    { href: "/esic", label: "E-SIC", icon: <MessageSquare size={18} aria-hidden="true" /> },

    { href: "/ouvidoria", label: "Ouvidoria", icon: <MessageSquare size={18} aria-hidden="true" /> },

    { href: "/contato", label: "Contato", icon: <Phone size={18} aria-hidden="true" /> },

  ];



  const isActive = (href: string) =>

    href === "/" ? pathname === "/" : pathname.startsWith(href);



  function closeMenus() { setOpenMenu(null); }

  function openMenuHover() {

    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);

    setOpenMenu("atividades");

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



  const linkClass = (href: string) => `

    px-4 py-2.5 rounded-full flex items-center gap-2

    text-sm whitespace-nowrap transition-all duration-200 cursor-pointer

    hover:bg-blue-100 hover:text-blue-700

    focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2

    ${isActive(href) ? "bg-[#173572] text-white shadow-md" : "text-gray-700"}

  `;



  const mobileLinkClass = (href: string) => `

    flex items-center gap-3 px-4 py-3.5 rounded-xl text-base

    transition-all duration-200

    hover:bg-blue-50 hover:text-blue-700

    focus-visible:ring-2 focus-visible:ring-blue-500

    ${isActive(href) ? "bg-[#173572] text-white" : "text-gray-700"}

  `;



  return (

    <>

      {/* ── DESKTOP ── */}

      <nav aria-label="Menu principal">

        <div className="w-[90%] mx-auto">

          <ul role="menubar" className="hidden md:flex flex-wrap justify-center gap-1 py-3">



            <li role="none">

              <Link href="/" className={linkClass("/")}>

                <Home size={18} aria-hidden="true" />

                Início

              </Link>

            </li>



            <li role="none" className="relative" onMouseEnter={openMenuHover} onMouseLeave={() => scheduleClose()}>

              <button

                ref={buttonRef}

                aria-haspopup="true"

                aria-expanded={openMenu === "atividades"}

                aria-controls="menu-atividades"

                className={linkClass("/atividades")}

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

                  className="text-sm absolute left-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden"

                  onMouseEnter={cancelClose} onMouseLeave={() => scheduleClose()}>

                  {atividadesItems.map((item, i) => (

                    <li key={item.href} role="none">

                      <Link

                        href={item.href} role="menuitem"

                        ref={(el) => { atividadesRefs.current[i] = el; }}

                        className={`block px-5 py-3.5 transition-all duration-200

                          hover:text-[#173572] hover:bg-gradient-to-r hover:from-[#173572]/5 hover:to-[#173572]/10

                          hover:pl-7 border-l-4 border-transparent hover:border-[#173572]

                          focus:bg-[#173572]/5 focus:outline-none

                          focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#173572]

                          ${isActive(item.href) ? "text-[#173572] font-semibold bg-[#173572]/5 border-l-4 border-[#173572] pl-7" : "text-gray-700"}`}

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



            {fixedItems.map((item) => (

              <li key={item.href} role="none">

                <Link href={item.href} className={linkClass(item.href)}>

                  {item.icon}

                  {item.label}

                </Link>

              </li>

            ))}

          </ul>

        </div>

      </nav>



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

        {/* Cabeçalho do painel — azul, igual ao header */}

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



        {/* Itens de navegação */}

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

                hover:bg-[#173572]/10 hover:text-[#173572]

                focus-visible:ring-2 focus-visible:ring-[#173572]

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

                      className={`block px-3 py-2.5 rounded-lg text-sm transition-all duration-200

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

              <Link href={item.href} onClick={() => setMobileOpen(false)} className={mobileLinkClass(item.href)}>

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