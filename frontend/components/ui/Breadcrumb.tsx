"use client";

import Link from "next/link";
import { Home } from "lucide-react";
import type { JSX } from "react";

/* =========================
   TIPOS
========================= */
type BreadcrumbItem = {
  label: string;
  href?: string;
};

type BreadcrumbProps = {
  items: BreadcrumbItem[];
};

/* =========================
   COMPONENTE
========================= */
export default function Breadcrumb({ items }: BreadcrumbProps): JSX.Element {
  return (
    <nav
      aria-label="Caminho de navegação"
      className="mb-6 text-sm text-gray-600"
    >
      <ol className="flex flex-wrap items-center gap-1">

        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const isFirst = index === 0;

          return (
            <li
              key={item.href ?? item.label}
              className="flex items-center gap-1"
            >
              {!isLast ? (
                <>
                  <Link
                    href={item.href ?? "#"}
                    className="
                      flex items-center gap-1
                      text-blue-700
                      hover:text-blue-900
                      underline
                      transition-colors
                      focus:outline-none
                      focus-visible:ring-2
                      focus-visible:ring-blue-700
                      focus-visible:ring-offset-2
                      rounded
                    "
                  >
                    {isFirst && (
                      <Home className="w-4 h-4" aria-hidden="true" />
                    )}
                    <span>{item.label}</span>
                  </Link>

                  {/* Separador */}
                  <span
                    aria-hidden="true"
                    className="mx-1 text-gray-400"
                  >
                    /
                  </span>
                </>
              ) : (
                <span
                  aria-current="page"
                  className="
                    flex items-center gap-1
                    font-semibold text-gray-800
                  "
                >
                  {isFirst && (
                    <Home className="w-4 h-4" aria-hidden="true" />
                  )}
                  <span>{item.label}</span>
                </span>
              )}
            </li>
          );
        })}

      </ol>
    </nav>
  );
}