"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import Header from "@/components/layout/Header";
import SkipLink from "@/components/acessibilidade/SkipLink";
import Footer from "@/components/layout/Footer";
import VLibras from "@/components/acessibilidade/VLibras";
import SolicitaLai from "@/components/ui/SolicitaLai";
import KeyboardShortcuts from "@/components/acessibilidade/KeyboardShortcuts";

/**
 * Shell condicional do layout.
 * Rotas /admin renderizam apenas children (admin tem layout próprio).
 * Rotas públicas renderizam Header/Footer/VLibras.
 */
export default function LayoutShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      {/* Camada de acessibilidade prioritária */}
      <KeyboardShortcuts />
      <SkipLink />

      {/* Estrutura Principal */}
      <Header />

      <main
        id="main-content"
        tabIndex={-1}
        aria-label="Conteúdo principal"
        className="
          flex-grow
          focus:outline-none
          focus-visible:ring-4 focus-visible:ring-blue-500 focus-visible:ring-offset-2
        "
      >
        {children}
      </main>

      <SolicitaLai />
      <Footer />

      {/* Ferramentas de Inclusão */}
      <VLibras />
    </>
  );
}
