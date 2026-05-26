"use client";

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
            <li key={index} className="flex items-center gap-1">
              {!isLast ? (
                <>
                  <a
                    href={item.href ?? '/'}
                    className="text-blue-700 underline hover:text-blue-900 focus:outline-2 focus:outline-blue-700 flex items-center gap-1"
                  >
                    {isFirst && (
                      <Home className="w-4 h-4" aria-hidden="true" />
                    )}
                    <span>{item.label}</span>
                  </a>
                  <span aria-hidden="true">{">"}</span>
                </>
              ) : (
                <span
                  aria-current="page"
                  className="font-semibold text-gray-800 flex items-center gap-1"
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