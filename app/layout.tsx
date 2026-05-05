import "./globals.css";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next"

import Header from "@/components/layout/Header";
import SkipLink from "@/components/acessibilidade/SkipLink";
import Footer from "@/components/layout/Footer";
import VLibras from "@/components/acessibilidade/VLibras";
import SolicitaLai from "@/components/ui/SolicitaLai";
import KeyboardShortcuts from "@/components/acessibilidade/KeyboardShortcuts";

import type { Metadata, Viewport } from "next";
import type { ReactNode, JSX } from "react";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

/* =====================
   METADADOS DO SITE
   Ajustados para o Município (Critério PNTP de Identificação)
===================== */
export const metadata: Metadata = {
  title: {
    default: "Prefeitura de Padre Marcos - PI",
    template: "%s | Prefeitura de Padre Marcos - PI",
  },
  description:
    "Portal Oficial da Prefeitura Municipal de Padre Marcos (PI). Acesso a notícias, serviços, transparência pública e informações institucionais.",
  keywords: ["Prefeitura de Padre Marcos", "Padre Marcos PI", "Transparência Padre Marcos", "Portal do Cidadão"],
  authors: [{ name: "Prefeitura Municipal de Padre Marcos" }],
  openGraph: {
    title: "Portal da Transparência - Município de Padre Marcos",
    description: "Transparência ativa e acesso à informação pública municipal.",
    type: "website",
    locale: "pt_BR",
    siteName: "Portal da Transparência Padre Marcos",
  },
  robots: {
    index: true,
    follow: true,
  },
};

/* =====================
   VIEWPORT
===================== */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#173572", // Cor institucional
};

/* =====================
   ROOT LAYOUT
===================== */
type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({
  children,
}: RootLayoutProps): JSX.Element {
  return (
    <html lang="pt-BR" className="scroll-smooth">
      <body
        className={`${inter.variable} font-sans min-h-screen flex flex-col transition-colors duration-200`}
      >
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
          {/* Dica para a página inicial: Garanta que o primeiro título 
            da Home seja um <h1> para cumprir a semântica da cartilha.
          */}
          {children}
        </main>

        <SolicitaLai />
        <Footer />

        {/* Ferramentas de Inclusão */}
        <VLibras />

        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
