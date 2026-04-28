"use client";

import { useEffect, useRef, useState, ReactNode, JSX} from "react";
import Breadcrumb from "../ui/Breadcrumb";
import PageActions from "../ui/PageActions";

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
  children: ReactNode;
  lastUpdate?: string;
  responsavel?: string;
};

/* =========================
   COMPONENTE
========================= */
export default function ContentPage({
  title,
  breadcrumb,
  description,
  children,
  lastUpdate,
  responsavel,
}: ContentPageProps): JSX.Element {
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const [lineWidth, setLineWidth] = useState<number>(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  /* =========================
     ACESSIBILIDADE: REDUCED MOTION
  ========================= */
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);

    const handler = (e: MediaQueryListEvent) =>
      setPrefersReducedMotion(e.matches);

    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  /* =========================
     LINHA DINÂMICA DO TÍTULO
  ========================= */
  useEffect(() => {
    const updateLineWidth = () => {
      if (titleRef.current) {
        const width = titleRef.current.offsetWidth;
        setLineWidth(width * 0.4);
      }
    };

    updateLineWidth();
    window.addEventListener("resize", updateLineWidth);

    return () => window.removeEventListener("resize", updateLineWidth);
  }, [title]);

  return (
    <div className="bg-gray-100 min-h-dvh relative z-0">
      <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8 sm:py-10">

        {/* 🔹 Breadcrumb */}
        {breadcrumb && (
          <nav aria-label="Localização na página" className="mb-4">
            <Breadcrumb items={breadcrumb} />
          </nav>
        )}

        {/* 🔹 HEADER DA PÁGINA */}
        <header className="mb-8 sm:mb-10 flex flex-col items-center text-center">
          <h1
            id="page-title"
            ref={titleRef}
            className="text-[clamp(1.75rem,5vw,2.5rem)] font-bold text-gray-900 tracking-tight leading-tight"
          >
            {title}
          </h1>

          {/* Linha decorativa */}
          <div
            className={`mt-3 h-1 rounded-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 ${
              prefersReducedMotion ? "" : "transition-all duration-300"
            }`}
            style={{ width: `${lineWidth}px` }}
            aria-hidden="true"
          />

          {description && (
            <p
              id="page-description"
              className="mt-4 text-gray-700 max-w-2xl text-base sm:text-lg leading-relaxed"
            >
              {description}
            </p>
          )}
        </header>

        {/* 🔹 CONTEÚDO PRINCIPAL (SEM <main>!) */}
        <section
          aria-labelledby="page-title"
          {...(description
            ? { "aria-describedby": "page-description" }
            : {})}
          className="
            bg-white rounded-lg shadow-sm border border-gray-200
            p-5 sm:p-8
          "
        >
          <PageActions content={""}/>
          
          {children}

          {/* 🔹 METADADOS */}
          {(responsavel || lastUpdate) && (
            <footer
              className="mt-10 pt-6 border-t border-gray-200 text-sm text-gray-600"
              aria-label="Metadados da página"
            >
              <dl className="space-y-1">

                {responsavel && (
                  <div className="flex flex-wrap gap-x-2">
                    <dt className="font-semibold text-gray-800">
                      Responsável pela informação:
                    </dt>
                    <dd>{responsavel}</dd>
                  </div>
                )}

                {lastUpdate && (
                  <div className="flex flex-wrap gap-x-2">
                    <dt className="font-semibold text-gray-800">
                      Última atualização:
                    </dt>
                    <dd>
                      <time dateTime={lastUpdate}>
                        {lastUpdate}
                      </time>
                    </dd>
                  </div>
                )}

              </dl>
            </footer>
          )}
        </section>

      </div>
    </div>
  );
}