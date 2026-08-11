"use client";

import {
  useEffect,
  useRef,
  useState,
  ReactNode,
  JSX,
} from "react";

import Breadcrumb from "../ui/Breadcrumb";
import PageActions from "../ui/PageActions";
import { formatDateLongBR, toISODateBR } from "@/lib/utils/date";

/* =========================
   TIPOS
========================= */
type BreadcrumbItem = {
  label: string;
  href?: string;
};

type ContentPageProps = {
  title: string;
  breadcrumb?: BreadcrumbItem[];
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
  lastUpdate?: string;
  responsible?: string;
  showSearch?: boolean;
  hideStripe?: boolean;
};

/* =========================
   HELPERS
========================= */
function formatDate(dateStr: string): string {
  return formatDateLongBR(dateStr, dateStr || "-");
}

/* =========================
   COMPONENTE
========================= */
export default function ContentPage({
  title,
  breadcrumb,
  description,
  icon,
  children,
  lastUpdate,
  responsible,
  showSearch = true,
  hideStripe = false,
}: ContentPageProps): JSX.Element {
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    contentRef.current?.focus();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return (
    <div className="bg-gray-100 min-h-dvh relative z-0">
      <div
        ref={contentRef}
        tabIndex={-1}
        className="w-[98%] max-w-[1400px] mx-auto px-4 py-8 sm:px-6 lg:px-8 sm:py-10 focus:outline-none"
      >

        {breadcrumb && (
          <nav aria-label="Localização na página" className="mb-10">
            <Breadcrumb items={breadcrumb} />
          </nav>
        )}

        {(title || description || icon) && (
          <div className="mb-8 flex flex-col items-center text-center">

            {/* Ícone decorativo */}
            {icon && (
              <div aria-hidden="true" className="mb-3.5 w-10 h-10 rounded-[10px] bg-[#e8edf7] flex items-center justify-center text-[#173572]">
                {icon}
              </div>
            )}

            {title && (
              <h1
                id="page-title"
                ref={titleRef}
                className="text-[26px] font-bold text-gray-900 tracking-[-0.02em] leading-[1.2] mb-2.5"
              >
                {title}
              </h1>
            )}

            {!hideStripe && title && (
              <div
                role="presentation"
                className={`mb-3.5 h-[3px] w-9 rounded-full bg-[#173572] ${prefersReducedMotion ? "" : "transition-all duration-300"
                  }`}
                aria-hidden="true"
              />
            )}

            {description && (
              <p
                id="page-description"
                className="text-[#4b5563] max-w-[560px] text-base sm:text-lg leading-relaxed m-0"
              >
                {description}
              </p>
            )}
          </div>
        )}

        <div
          id="page-content"
          className="bg-white rounded-[12px] shadow-sm border border-[#e5e7eb] py-6 px-5 sm:py-9 sm:px-10"
        >
          {/* Barra superior: ações + badge */}
          <nav aria-label="Ações da página" className="flex items-center justify-between gap-3 flex-wrap mb-6 pb-4 border-b border-[#e5e7eb]">
            <PageActions
              contentRef={contentRef}
              showSearch={showSearch}
              buttonClassName="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border border-[#173572] text-[#173572] bg-white hover:bg-[#173572] hover:text-white transition-colors duration-150"
            >
              <span
                className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1.5 rounded-md bg-[#e8edf7] border border-[#e8edf7] text-[#173572] select-none cursor-default"
                aria-label="Selo de boas práticas de acessibilidade"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M9 11l3 3L22 4" stroke="#173572" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="#173572" strokeWidth="2" strokeLinecap="round" />
                </svg>
                Boas práticas de acessibilidade
              </span>
            </PageActions>
          </nav>

          <section aria-labelledby="page-title" {...(description && { "aria-describedby": "page-description" })}>
            <div className="prose max-w-none text-gray-800 prose-headings:text-[#173572] prose-a:text-[#173572] [&_ul]:border-l-4 [&_ul]:border-[#173572]/20 [&_ul]:pl-5 [&_ul]:py-1 [&_ul]:my-4 [&_ul]:list-none [&_li]:relative [&_li]:before:content-['•'] [&_li]:before:absolute [&_li]:before:-left-4 [&_li]:before:text-[#173572]">
              {children}
            </div>

            {(lastUpdate || responsible) && (
              <footer
                className="mt-10 pt-5 border-t border-gray-100 flex flex-wrap gap-x-6 gap-y-1"
                aria-label="Metadados da página"
              >
                {lastUpdate && (
                  <p className="text-xs text-gray-500">
                    <span className="font-medium text-gray-600">Última atualização:</span>{" "}
                    <time dateTime={toISODateBR(lastUpdate)}>{formatDate(lastUpdate)}</time>
                  </p>
                )}
                {responsible && (
                  <p className="text-xs text-gray-500">
                    <span className="font-medium text-gray-600">Responsável:</span>{" "}
                    {responsible}
                  </p>
                )}
              </footer>
            )}
          </section>
        </div>

      </div>
    </div>
  );
}