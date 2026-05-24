"use client";

import Link from "next/link";
import Image from "next/image";
import { JSX } from "react";
import {
  MapPin, Phone, Mail, Building2, TrendingUp, DollarSign,
  Gavel, Users, FileBarChart, HardHat, Handshake, Info,
  MessageSquare, HelpCircle, ShieldCheck, Scale, LibraryBig
} from "lucide-react";

export default function TransparencyFooter(): JSX.Element {
  const linkListClass = "space-y-2 text-xs text-gray-200";
  const colHeadClass = "font-bold text-[#FFE066] text-sm mb-4 border-b border-white/20 pb-1 uppercase tracking-wider";

  return (
    <footer
      aria-labelledby="footer-title"
      className="bg-[#173572] text-white"
    >
      <h2 id="footer-title" className="sr-only">
        Rodapé institucional do Portal da Transparência
      </h2>

      {/* Faixa Brasil */}
      <div className="flex h-[3px]">
        <div className="flex-1 bg-[#009c3b]" />
        <div className="flex-1 bg-[#ffdf00]" />
        <div className="flex-1 bg-[#cc0000]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-10 grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_1fr] gap-8 items-start">

        {/* 1️⃣ DADOS INSTITUCIONAIS com logo como ícone */}
        <div className="space-y-3">
          {/* Logo + título lado a lado */}
          <div className="flex items-center border-b border-white/20 mb-4">
            <Image
              src="/2.svg"
              alt="Brasão do Município de Padre Marcos"
              width={70}
              height={70}
              className="w-[70px] h-[70px] object-contain shrink-0 
    [filter:drop-shadow(1.5px_0_0_white)_drop-shadow(-1.5px_0_0_white)_drop-shadow(0_1.5px_0_white)_drop-shadow(0_-1.5px_0_white)]"            />
            <h3 className="font-bold text-[#FFE066] text-sm uppercase tracking-wider leading-tight">
              Prefeitura Municipal de<br />Padre Marcos
            </h3>
          </div>

          <ul className="space-y-2 text-xs text-gray-200">
            <li className="flex items-start gap-2">
              <Building2 size={14} className="text-white/60 mt-0.5 shrink-0" />
              <span>CNPJ: 06.553.788/0001-40</span>
            </li>
            <li className="flex items-start gap-2">
              <MapPin size={14} className="text-white/60 mt-0.5 shrink-0" />
              <span>Rua Anfrísio Macedo, nº 150 – Centro<br />Padre Marcos - PI</span>
            </li>
            <li className="flex items-start gap-2">
              <Phone size={14} className="text-white/60 mt-0.5 shrink-0" />
              <span>Seg a Sex, 8h às 12h<br />(89) 98116-0296</span>
            </li>
            <li>
              <a
                href="mailto:prefeitura@padremarcos.pi.gov.br"
                className="flex items-center gap-2 text-[#FFE066] hover:underline underline-offset-2 font-medium"
              >
                <Mail size={14} />
                prefeitura@padremarcos.pi.gov.br
              </a>
            </li>
          </ul>
        </div>

        {/* 2️⃣ TRANSPARÊNCIA */}
        <nav aria-labelledby="footer-transparencia">
          <h3 id="footer-transparencia" className={colHeadClass}>
            Transparência
          </h3>
          <ul className={linkListClass}>
            {[
              { href: "/", label: "Portal", icon: TrendingUp },
              { href: "/receitas", label: "Receitas", icon: DollarSign },
              { href: "/despesas", label: "Despesas", icon: DollarSign },
              { href: "/licitacoes", label: "Licitações e Contratos", icon: Gavel },
              { href: "/rh", label: "Recursos Humanos", icon: Users },
              { href: "/relatorios", label: "Relatórios e Contas", icon: FileBarChart },
              { href: "/obras", label: "Obras", icon: HardHat },
              { href: "/convenios", label: "Convênios", icon: Handshake },
            ].map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="flex items-center gap-2 hover:text-white hover:pl-1 transition-all">
                  <item.icon size={14} className="text-white/60" />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* 3️⃣ ACESSO À INFORMAÇÃO */}
        <nav aria-labelledby="footer-lai">
          <h3 id="footer-lai" className={colHeadClass}>
            Acesso à Informação
          </h3>
          <ul className={linkListClass}>
            {[
              { href: "/lai", label: "Lei de Acesso à Informação", icon: LibraryBig },
              { href: "/esic", label: "e-SIC (Solicitar LAI)", icon: MessageSquare },
              { href: "/ouvidoria", label: "Ouvidoria", icon: Mail },
              { href: "/servicos", label: "Carta de Serviços", icon: Info },
              { href: "/faq", label: "Perguntas Frequentes", icon: HelpCircle },
            ].map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="flex items-center gap-2 hover:text-white hover:pl-1 transition-all">
                  <item.icon size={14} className="text-white/60" />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* 4️⃣ PRIVACIDADE */}
        <div>
          <h3 className={colHeadClass}>
            Privacidade e LGPD
          </h3>
          <ul className="space-y-4 text-xs text-gray-200">
            <li>
              <Link href="/privacidade" className="flex items-center gap-2 hover:text-white transition-colors">
                <ShieldCheck size={14} className="text-white/60" />
                Política de Privacidade
              </Link>
            </li>
            <li className="pt-3 space-y-2 border-t border-white/10">
              <div className="flex items-center gap-2">
                <Scale size={14} className="text-white/60" />
                <p className="font-bold text-white text-xs">DPO — Encarregado de Dados:</p>
              </div>
              <p className="text-gray-300 pl-5">Lorena Barros</p>
              <a
                href="mailto:lgpd@padremarcos.pi.gov.br"
                className="flex items-center gap-2 text-[#FFE066] hover:underline font-medium pl-5"
              >
                <Mail size={13} />
                lgpd@padremarcos.pi.gov.br
              </a>
            </li>
          </ul>

          {/* Radar PNTP */}
          <div className="mt-6 flex items-center gap-3 border-t border-white/10 pt-4">
            <Image
              src="/LOGO RADAR.png"
              alt="Logo do Radar da Transparência Pública"
              width={36}
              height={36}
              className="rounded opacity-75"
            />
            <p className="text-[11px] text-gray-400 leading-snug">
              Portal avaliado pelo Radar da<br />Transparência Pública – PNTP.
            </p>
          </div>
        </div>
      </div>

      {/* SUB-FOOTER */}
      <div className="bg-[#122a5a] py-4 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-[10px] text-gray-400 gap-3">
          <p className="uppercase tracking-tight text-center md:text-left">
            Responsável: <span className="text-gray-300">Prefeitura Municipal de Padre Marcos (institucional)</span>
          </p>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
            <p>Atualização: <strong className="text-gray-200">10/12/2025</strong></p>
            <p>Fonte: <strong className="text-gray-200">Sistema Contábil Municipal</strong></p>
            <p className="hidden md:block">Frequência: diária</p>
          </div>
        </div>
      </div>
    </footer>
  );
}