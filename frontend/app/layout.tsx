import "./globals.css";
import { Inter } from "next/font/google";

import Header from "../components/layout/Header";
import SkipLink from "../components/acessibilidade/SkipLink";
import Footer from "../components/layout/Footer";
import VLibras from "../components/acessibilidade/VLibras";
import SolicitaLai from "../components/ui/SolicitaLai";
import KeyboardShortcuts from "../components/acessibilidade/KeyboardShortcuts";

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
    default: "Portal da Transparência | Prefeitura de Padre Marcos",
    template: "%s | Portal da Transparência",
  },
  description:
    "Acesso oficial a dados, contas públicas e informações do Município de Padre Marcos (PI), em conformidade com a Lei de Acesso à Informação.",
  keywords: ["transparência", "Padre Marcos", "Piauí", "gestão pública", "dados abertos", "LAI"],
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
      </body>
    </html>
  );
}