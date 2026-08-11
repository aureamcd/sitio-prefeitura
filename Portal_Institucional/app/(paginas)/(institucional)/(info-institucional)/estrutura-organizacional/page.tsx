"use client";

import { useState } from "react";
import ContentPage from "@/components/layout/ContentPage";
import {
  Users,
  MapPin,
  Mail,
  Phone,
  Clock,
  ChevronDown,
  FileText,
  LayoutDashboard,
  Info,
  ShieldCheck,
  Building2,
  ArrowRight,
  HeartPulse,
  GraduationCap,
  HandHeart,
  Settings,
  Banknote,
  Sprout,
  HardHat,
  Trophy,
  TreePine,
  Truck,
  Scale
} from "lucide-react";
import portalData from "@/lib/data/portal.json";
import Link from "next/link";

type Item = {
  nome: string;
  slug: string;
  tipo?: string;
  responsavel: string;
  cargo: string;
  email?: string;
  telefone?: string;
  horario?: string;
  endereco?: string;
  competencias?: string[];
};

export default function EstruturaOrganizacionalPage() {
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);
  const [gabineteOpen, setGabineteOpen] = useState(false);
  const [controladoriaOpen, setControladoriaOpen] = useState(false);
  const [procuradoriaOpen, setProcuradoriaOpen] = useState(false);

  /* ======================
     DADOS DINÂMICOS
  ====================== */

  const secretarias = portalData.secretarias.filter((item) => item.tipo === "secretaria");
  const controladoria = portalData.orgaos.find((item) => item.slug === "controladoria");
  const procuradoria = portalData.orgaos.find((item) => item.slug === "procuradoria");

  const getSecretariaIcon = (nome: string) => {
    const n = nome.toLowerCase();
    if (n.includes("saúde")) return <HeartPulse size={20} />;
    if (n.includes("educação")) return <GraduationCap size={20} />;
    if (n.includes("assistência") || n.includes("social")) return <HandHeart size={20} />;
    if (n.includes("administração") || n.includes("planejamento")) return <Settings size={20} />;
    if (n.includes("finanças") || n.includes("fazenda")) return <Banknote size={20} />;
    if (n.includes("agricultura")) return <Sprout size={20} />;
    if (n.includes("obras") || n.includes("infraestrutura")) return <HardHat size={20} />;
    if (n.includes("cultura") || n.includes("esporte") || n.includes("lazer")) return <Trophy size={20} />;
    if (n.includes("meio ambiente")) return <TreePine size={20} />;
    if (n.includes("transporte")) return <Truck size={20} />;
    if (n.includes("governo") || n.includes("gabinete")) return <Building2 size={20} />;
    return <Building2 size={20} />;
  };

  const getSecretariaIconLarge = (nome: string) => {
    const n = nome.toLowerCase();
    if (n.includes("saúde")) return <HeartPulse size={24} />;
    if (n.includes("educação")) return <GraduationCap size={24} />;
    if (n.includes("assistência") || n.includes("social")) return <HandHeart size={24} />;
    if (n.includes("administração") || n.includes("planejamento")) return <Settings size={24} />;
    if (n.includes("finanças") || n.includes("fazenda")) return <Banknote size={24} />;
    if (n.includes("agricultura")) return <Sprout size={24} />;
    if (n.includes("obras") || n.includes("infraestrutura")) return <HardHat size={24} />;
    if (n.includes("cultura") || n.includes("esporte") || n.includes("lazer")) return <Trophy size={24} />;
    if (n.includes("meio ambiente")) return <TreePine size={24} />;
    if (n.includes("transporte")) return <Truck size={24} />;
    if (n.includes("governo") || n.includes("gabinete")) return <Building2 size={24} />;
    return <Building2 size={24} />;
  };

  return (
    <ContentPage
      title="Estrutura Organizacional"
      breadcrumb={[
        { label: "Início", href: "/" },
        { label: "Estrutura Organizacional" },
      ]}
      lastUpdate="2026-06-04"
    >

      {/* 1. INTRODUÇÃO */}
      <div className="mb-10">
        <div className="bg-[#173572] text-white p-5 rounded-2xl shadow-sm mb-6 flex items-start sm:items-center gap-4 border-l-4 border-blue-400">
          <Info size={28} className="shrink-0 text-blue-200 mt-0.5 sm:mt-0" />
          <p className="font-medium text-[15px] sm:text-base leading-relaxed">
            Unidades administrativas e hierarquia da Prefeitura Municipal de Padre Marcos - PI.
          </p>
        </div>
        {/* Caixa Laranja de Destaque PNTP */}
        <div className="bg-amber-50/50 border border-amber-100 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-8 max-w-4xl shadow-sm">
          <div className="bg-white p-4 rounded-2xl shadow-sm text-amber-500 shrink-0">
            <Info size={32} />
          </div>
          <div className="flex-1 text-left">
            <h3 className="text-amber-900 font-bold mb-2 text-lg">Base Legal da Estrutura Organizacional</h3>
            <p className="text-sm text-amber-800 leading-relaxed mb-4">
              A estrutura administrativa e organizacional da Prefeitura Municipal de Padre Marcos é definida por lei e detalha as unidades subordinadas ao Poder Executivo.
              Para consultar a estrutura completa e as atribuições/competências detalhadas de cada secretaria ou departamento, acesse a legislação vigente:
            </p>
            <a 
              href="https://pub-dc316bdb1d204c4fa9d36b369c385b97.r2.dev/leis/2025/Lei%20Complementar%20720-2025%20-%20nova%20estrutura%20administrativa%20PADRE%20MARCOS.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 px-5 rounded-xl transition-all shadow-md hover:shadow-lg text-sm"
            >
              <FileText size={18} />
              Baixar a íntegra da Lei Complementar Nº 720/2025
            </a>
          </div>
        </div>

        <div className="mt-4 bg-white border border-gray-200 rounded-2xl p-6 max-w-xl shadow-sm mx-auto">
          <div className="flex items-start gap-3 text-[#173572]">
            <MapPin size={20} className="text-blue-500 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-black">Sede Administrative da Prefeitura</p>
              <p className="text-gray-600 mt-1 leading-relaxed">
                Rua Anfrísio Macedo, nº 150, Centro,<br />
                Padre Marcos - PI, CEP: 64.608-000
              </p>
              <div className="mt-2 space-y-1">
                <p className="text-gray-600 flex items-center gap-2">
                  <Phone size={14} className="text-blue-400" /> Telefone: (89) 98116-0296
                </p>
                <p className="text-gray-600 flex items-center gap-2">
                  <Mail size={14} className="text-blue-400" /> E-mail: pmpadremarcos@gmail.com
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 text-[#173572] mt-4">
            <Clock size={20} className="text-blue-500 shrink-0 mt-0.5" />
            <p className="text-sm">
              <strong className="font-black">Horário de expediente administrativo:</strong><br />
              Segunda a sexta-feira, das 8h às 12h.
            </p>
          </div>
        </div>

      </div>



      {/* 3. ORGANOGRAMA VISUAL (COMPACTO & PREMIUM) */}
      <div className="mb-20 px-4">
        <h2 className="text-xl font-black text-[#173572] mb-12 flex items-center gap-3 justify-center">
          <LayoutDashboard size={24} /> Estrutura Hierárquica
        </h2>

        <div className="relative flex flex-col items-center">

          {/* Nível 1: Cúpula Executiva (Compacta) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl relative z-10 mb-10">
            {/* Prefeita */}
            <div className="bg-white border border-gray-100 rounded-[2.5rem] p-6 shadow-lg hover:shadow-xl transition-all group flex items-start gap-5">
              <div className="relative group shrink-0">
                <div className="w-20 h-20 rounded-full bg-linear-to-tr from-[#173572] to-blue-500 p-1 shadow-md group-hover:rotate-6 transition-transform">
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden border-2 border-white">
                    <img
                      src="/imagens_est.org/williane.webp"
                      alt={portalData.gestao.prefeita.nome}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
              <div className="text-left">
                <p className="text-[10px] uppercase font-black tracking-[0.2em] text-blue-500 mb-0.5">{portalData.gestao.prefeita.cargo}</p>
                <h3 className="text-lg font-black text-[#484b52] leading-tight mb-2">{portalData.gestao.prefeita.nome}</h3>
                <div className="text-[11px] text-gray-500 space-y-1 border-t border-gray-100 pt-2">
                  <p><span className="font-bold text-gray-700">Naturalidade:</span> {portalData.gestao.prefeita.naturalidade}</p>
                  <p><span className="font-bold text-gray-700">Email:</span> {portalData.gestao.prefeita.email}</p>
                  <p><span className="font-bold text-gray-700">Telefone:</span> {portalData.gestao.prefeita.telefone}</p>
                </div>
              </div>
            </div>

            {/* Vice-Prefeito */}
            <div className="bg-white border border-gray-100 rounded-[2.5rem] p-6 shadow-lg hover:shadow-xl transition-all group flex items-start gap-5">
              <div className="relative group shrink-0">
                <div className="w-20 h-20 rounded-full bg-linear-to-tr from-blue-400 to-blue-600 p-1 shadow-md group-hover:-rotate-6 transition-transform">
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden border-2 border-white">
                    <img
                      src="/imagens_est.org/adao.jpg"
                      alt={portalData.gestao.vice_prefeito.nome}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
              <div className="text-left">
                <p className="text-[10px] uppercase font-black tracking-[0.2em] text-blue-500 mb-0.5">{portalData.gestao.vice_prefeito.cargo}</p>
                <h3 className="text-lg font-black text-[#173572] leading-tight mb-2">{portalData.gestao.vice_prefeito.nome}</h3>
                <div className="text-[11px] text-gray-500 space-y-1 border-t border-gray-100 pt-2">
                  <p><span className="font-bold text-gray-700">Naturalidade:</span> {portalData.gestao.vice_prefeito.naturalidade}</p>
                  <p><span className="font-bold text-gray-700">Email:</span> {portalData.gestao.vice_prefeito.email}</p>
                  <p><span className="font-bold text-gray-700">Telefone:</span> {portalData.gestao.vice_prefeito.telefone}</p>

                </div>
              </div>
            </div>
          </div>

          {/* Nível 2: Gabinete do Prefeito */}
          <div className="relative w-full flex flex-col items-center mb-10">
            <div className="w-px h-12 bg-blue-200/60 mb-6" />

            <div
              onClick={() => setGabineteOpen(!gabineteOpen)}
              className={`w-full max-w-md bg-white border-2 rounded-[2rem] p-5 shadow-lg hover:shadow-xl transition-all duration-300 group relative overflow-hidden cursor-pointer ${gabineteOpen ? "border-[#173572] ring-4 ring-blue-50/50" : "border-blue-50"
                }`}
            >
              <div className="absolute top-0 left-0 w-1.5 h-full bg-[#173572]"></div>
              <div className="flex items-center gap-5">
                <div className="relative shrink-0">
                  <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center overflow-hidden border border-white shadow-sm group-hover:scale-105 transition-transform">
                    <img
                      src="/imagens_est.org/valdinar.jpg"
                      alt={(portalData.gestao as any).gabinete?.nome}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <div className="flex-1 text-left">
                  <p className="text-[10px] uppercase font-black tracking-[0.2em] text-blue-500">Assessoria Direta</p>
                  <h3 className="text-base font-black text-[#173572]">Gabinete da Prefeita</h3>
                </div>
                <div className="shrink-0 text-gray-400 group-hover:text-[#173572] transition-colors p-2">
                  <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${gabineteOpen ? "rotate-180 text-[#173572]" : ""}`} />
                </div>
              </div>

              {/* Conteúdo do Accordion */}
              <div className={`transition-all duration-300 overflow-hidden ${gabineteOpen ? "max-h-[1200px] opacity-100 mt-5 pt-5 border-t border-gray-100 animate-fadeIn" : "max-h-0 opacity-0"
                }`}>
                {/* Chefe de Gabinete */}
                <div className="flex items-center gap-4 bg-gray-50/80 p-4 rounded-2xl mb-4">
                  <div className="text-left">
                    <p className="text-[9px] uppercase font-black tracking-wider text-gray-400">Responsável</p>
                    <p className="text-sm font-black text-[#173572]">{(portalData.gestao as any).gabinete?.nome || "Valdinar Silva"}</p>
                    <p className="text-xs text-gray-500">{(portalData.gestao as any).gabinete?.cargo || "Chefe de Gabinete"}</p>
                  </div>
                </div>

                {/* Competências */}
                <div className="text-left">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2.5">O que o Gabinete faz:</p>
                  <ul className="space-y-2 text-xs text-gray-600 font-medium list-none pl-0 m-0">
                    <li className="flex items-start gap-2.5">
                      <span>Assessoria e assistência direta ao Chefe do Executivo nas relações político-administrativas e sociais;</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span>Coordenação e controle de audiências oficiais, representação social, agendas de compromissos e solenidades;</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span>Processamento de expedientes, correspondências oficiais e triagem de demandas populares direcionadas à gestão;</span>
                    </li>
                  </ul>
                </div>

                {/* Endereço e Contatos */}
                <div className="mt-5 pt-4 border-t border-gray-100 space-y-3 text-left">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Contato e Endereço:</p>
                  <div className="flex gap-3">
                    <MapPin size={16} className="text-gray-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Rua Anfrísio Macedo, nº 150, Centro, Padre Marcos - PI, CEP: 64.608-000
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail size={16} className="text-gray-400 shrink-0" />
                    <p className="text-xs text-blue-600 font-medium truncate">{portalData.gestao.gabinete.email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone size={16} className="text-gray-400 shrink-0" />
                    <p className="text-xs text-gray-600 font-medium">{portalData.gestao.gabinete.telefone}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock size={16} className="text-gray-400 shrink-0" />
                    <p className="text-xs text-gray-600">Segunda a sexta-feira, das 8h às 12h</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Nível 3: Órgãos de Assessoria e Controle Técnico */}
          <div className="relative w-full flex flex-col items-center mb-16">
            <div className="w-px h-12 bg-blue-200/60 mb-6" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full max-w-3xl relative z-10 px-2 items-start">

              {/* Card 1: Controladoria Geral */}
              <div
                onClick={() => {
                  setControladoriaOpen(!controladoriaOpen);
                  setProcuradoriaOpen(false);
                }}
                className={`bg-white border-2 rounded-[2rem] shadow-lg hover:shadow-xl transition-all duration-300 relative cursor-pointer group overflow-hidden ${controladoriaOpen ? "border-[#173572] ring-4 ring-blue-50/50" : "border-amber-100"
                  }`}
              >
                <div className="absolute top-0 left-0 w-1.5 h-full bg-[#173572] rounded-l-[2rem]" />
                <div className="p-5">
                  <div className="flex justify-between items-start gap-4 mb-4">
                    <div className="p-3 rounded-2xl bg-amber-50 text-[#d97706] transition-transform group-hover:scale-105 duration-300">
                      <ShieldCheck size={28} />
                    </div>
                    <span className={`p-2 rounded-full transition-all shrink-0 ${controladoriaOpen ? 'bg-blue-50 text-[#173572] rotate-180' : 'bg-gray-50 text-gray-400'}`}>
                      <ChevronDown size={20} />
                    </span>
                  </div>
                  <h3 className="font-black text-gray-900 leading-tight text-base mb-2 group-hover:text-[#173572] transition-colors">
                    Controladoria Geral do Município
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 shrink-0">
                      <Users size={14} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Controlador Geral</p>
                      <p className="text-sm font-bold text-gray-700">{controladoria?.responsavel || "Em atualização"}</p>
                    </div>
                  </div>
                </div>

                <div
                  id="controladoria-content"
                  className={`overflow-hidden transition-all duration-500 ease-in-out ${controladoriaOpen ? 'max-h-[800px] opacity-100 px-5 pb-6 border-t border-gray-100 pt-5 mt-5' : 'max-h-0 opacity-0 pointer-events-none'
                    }`}
                >
                  <div className="space-y-6 pt-1">
                    {/* Competências */}
                    <div className="bg-amber-50/30 border border-amber-100 rounded-2xl p-4 text-left">
                      <h4 className="text-xs font-black text-[#d97706] uppercase tracking-wider mb-3 flex items-center gap-2">
                        <ShieldCheck size={14} /> Competências e Atribuições
                      </h4>
                      <ul className="space-y-2 list-none pl-0 m-0">
                        {(controladoria?.competencias || []).map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-gray-600 leading-relaxed">
                            <span className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Contatos */}
                    <div className="space-y-3 px-1 text-left">
                      {controladoria?.endereco && (
                        <div className="flex gap-3">
                          <MapPin size={16} className="text-gray-400 shrink-0" />
                          <p className="text-xs text-gray-600 leading-relaxed">{controladoria.endereco}</p>
                        </div>
                      )}
                      {controladoria?.email && (
                        <div className="flex items-center gap-3">
                          <Mail size={16} className="text-gray-400 shrink-0" />
                          <p className="text-xs text-blue-600 font-medium truncate">{controladoria.email}</p>
                        </div>
                      )}
                      {controladoria?.telefone && (
                        <div className="flex items-center gap-3">
                          <Phone size={16} className="text-gray-400 shrink-0" />
                          <p className="text-xs text-gray-600 font-medium">{controladoria.telefone}</p>
                        </div>
                      )}
                      {controladoria?.horario && (
                        <div className="flex items-center gap-3">
                          <Clock size={16} className="text-gray-400 shrink-0" />
                          <p className="text-xs text-gray-600">{controladoria.horario}</p>
                        </div>
                      )}
                    </div>

                    {/* Link para Página Completa */}
                    <div className="pt-4 border-t border-gray-100 flex justify-center">
                      <Link
                        href="/ouvidoria"
                        onClick={(e) => e.stopPropagation()}
                        className="group/link flex items-center gap-2 text-xs font-black text-[#173572] hover:text-blue-600 transition-colors relative pb-1"
                      >
                        <span>ACESSAR OUVIDORIA MUNICIPAL</span>
                        <ArrowRight size={14} className="group-hover/link:translate-x-1 transition-transform" />
                        <span className="absolute bottom-0 left-0 w-full h-0.5 bg-yellow-400 scale-x-0 group-hover/link:scale-x-100 transition-transform origin-left" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Procuradoria Geral */}
              <div
                onClick={() => {
                  setProcuradoriaOpen(!procuradoriaOpen);
                  setControladoriaOpen(false);
                }}
                className={`bg-white border-2 rounded-[2rem] shadow-lg hover:shadow-xl transition-all duration-300 relative cursor-pointer group overflow-hidden ${procuradoriaOpen ? "border-[#173572] ring-4 ring-blue-50/50" : "border-purple-100"
                  }`}
              >
                <div className="absolute top-0 left-0 w-1.5 h-full bg-[#173572] rounded-l-[2rem]" />
                <div className="p-5">
                  <div className="flex justify-between items-start gap-4 mb-4">
                    <div className="p-3 rounded-2xl bg-purple-50 text-purple-600 transition-transform group-hover:scale-105 duration-300">
                      <Scale size={28} />
                    </div>
                    <span className={`p-2 rounded-full transition-all shrink-0 ${procuradoriaOpen ? 'bg-blue-50 text-[#173572] rotate-180' : 'bg-gray-50 text-gray-400'}`}>
                      <ChevronDown size={20} />
                    </span>
                  </div>
                  <h3 className="font-black text-gray-900 leading-tight text-base mb-2 group-hover:text-[#173572] transition-colors">
                    Procuradoria Geral do Município
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 shrink-0">
                      <Users size={14} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Procurador Geral</p>
                      <p className="text-sm font-bold text-gray-700">{procuradoria?.responsavel || "Em atualização"}</p>
                    </div>
                  </div>
                </div>

                <div
                  id="procuradoria-content"
                  className={`overflow-hidden transition-all duration-500 ease-in-out ${procuradoriaOpen ? 'max-h-[800px] opacity-100 px-5 pb-6 border-t border-gray-100 pt-5 mt-5' : 'max-h-0 opacity-0 pointer-events-none'
                    }`}
                >
                  <div className="space-y-6 pt-1">
                    {/* Competências */}
                    <div className="bg-purple-50/30 border border-purple-100 rounded-2xl p-4 text-left">
                      <h4 className="text-xs font-black text-purple-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Scale size={14} /> Competências e Atribuições
                      </h4>
                      <ul className="space-y-2 list-none pl-0 m-0">
                        {(procuradoria?.competencias || []).map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-gray-600 leading-relaxed">
                            <span className="w-1 h-1 rounded-full bg-purple-400 mt-1.5 shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Contatos */}
                    <div className="space-y-3 px-1 text-left">
                      {procuradoria?.endereco && (
                        <div className="flex gap-3">
                          <MapPin size={16} className="text-gray-400 shrink-0" />
                          <p className="text-xs text-gray-600 leading-relaxed">{procuradoria.endereco}</p>
                        </div>
                      )}
                      {procuradoria?.email && (
                        <div className="flex items-center gap-3">
                          <Mail size={16} className="text-gray-400 shrink-0" />
                          <p className="text-xs text-blue-600 font-medium truncate">{procuradoria.email}</p>
                        </div>
                      )}
                      {procuradoria?.telefone && (
                        <div className="flex items-center gap-3">
                          <Phone size={16} className="text-gray-400 shrink-0" />
                          <p className="text-xs text-gray-600 font-medium">{procuradoria.telefone}</p>
                        </div>
                      )}
                      {procuradoria?.horario && (
                        <div className="flex items-center gap-3">
                          <Clock size={16} className="text-gray-400 shrink-0" />
                          <p className="text-xs text-gray-600">{procuradoria.horario}</p>
                        </div>
                      )}
                    </div>

                    {/* Link para Página Completa */}
                    <div className="pt-4 border-t border-gray-100 flex justify-center">
                      <span className="text-[10px] text-gray-400 font-bold italic">
                        Informações adicionais em homologação institucional
                      </span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Nível 4: Corpo de Secretarias grid */}
          <div className="w-full pt-12 mt-10">
            <div className="flex flex-col items-center mb-10">
              <p className="text-center text-[15px] font-black text-[#173572] uppercase tracking-[0.4em] mb-3">Corpo de Secretarias Municipais</p>
              <div className="w-12 h-1 bg-[#173572]/20 rounded-full relative overflow-hidden">
                <div className="absolute left-0 top-0 h-full w-1/2 bg-blue-500 rounded-full"></div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 items-start">
              {secretarias.map((sec, idx) => (
                <div key={idx} className="bg-white border border-gray-50 p-4 rounded-2xl flex items-center gap-4 hover:border-blue-100 hover:shadow-md transition-all group">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center shrink-0 group-hover:bg-[#173572] group-hover:text-white transition-colors">
                    {getSecretariaIcon(sec.nome)}
                  </div>
                  <h4 className="text-[11px] font-black text-[#173572] uppercase leading-tight tracking-wide text-left">
                    {sec.nome.replace("Secretaria Municipal de ", "")}
                  </h4>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* 4. SECRETARIAS (CARDS DETALHADOS - 2 POR FILA) */}
      <div className="mb-10 mt-10">
        <h2 className="text-xl font-black text-[#173572] mb-10 flex items-center gap-3 px-2">
          <Building2 size={24} /> Estrutura Administrativa Detalhada
        </h2>

        <div className="space-y-8">
          {secretarias.map((sec, idx) => {
            const isOpen = expandedSlug === sec.slug;

            const toggleExpand = () => {
              setExpandedSlug(isOpen ? null : sec.slug);
            };

            return (
              <div
                key={idx}
                onClick={toggleExpand}
                className={`
                  break-inside-avoid mb-8 group bg-white border rounded-4xl transition-all duration-300 overflow-hidden cursor-pointer
                  ${isOpen ? 'border-[#173572] shadow-xl ring-4 ring-blue-50/50' : 'border-gray-100 shadow-sm hover:border-blue-200 hover:shadow-md'}
                `}
              >
                {/* Header do Card */}
                <div className={`p-6 ${!isOpen ? 'min-h-[180px]' : ''}`}>
                  <div className="flex justify-between items-start gap-4 mb-4">
                    <div className={`p-3 rounded-2xl ${isOpen ? 'bg-[#173572] text-white' : 'bg-blue-50 text-[#173572]'} transition-colors`}>
                      {getSecretariaIconLarge(sec.nome)}
                    </div>
                    <button
                      aria-expanded={isOpen}
                      aria-label={
                        isOpen
                          ? `Fechar detalhes da ${sec.nome}`
                          : `Abrir detalhes da ${sec.nome}`
                      }
                      className={`p-2 rounded-full transition-all ${isOpen ? 'bg-blue-50 text-[#173572] rotate-180' : 'bg-gray-50 text-gray-400 hover:bg-blue-50 hover:text-[#173572]'}`}
                    >
                      <ChevronDown size={20} />
                    </button>
                  </div>

                  <h3 className="font-bold text-gray-900 leading-tight text-lg mb-2 group-hover:text-[#173572] transition-colors text-left">
                    {sec.nome}
                  </h3>

                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                      <Users size={14} />
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{sec.cargo}</p>
                      <p className="text-sm font-bold text-gray-700">{sec.responsavel || "Em atualização"}</p>
                    </div>
                  </div>
                </div>

                {/* Conteúdo Expandido */}
                <div className={`px-6 overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[1200px] pb-12 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="space-y-6 pt-2 border-t border-gray-100">

                    {/* Contatos */}
                    <div className="space-y-3 px-1 text-left">
                      {sec.endereco && (
                        <div className="flex gap-3">
                          <MapPin size={16} className="text-gray-400 shrink-0" />
                          <p className="text-xs text-gray-600 leading-relaxed">{sec.endereco}</p>
                        </div>
                      )}
                      {sec.email && (
                        <div className="flex items-center gap-3">
                          <Mail size={16} className="text-gray-400 shrink-0" />
                          <p className="text-xs text-blue-600 font-medium truncate">{sec.email}</p>
                        </div>
                      )}
                      {sec.telefone && (
                        <div className="flex items-center gap-3">
                          <Phone size={16} className="text-gray-400 shrink-0" />
                          <p className="text-xs text-gray-600 font-medium">{sec.telefone}</p>
                        </div>
                      )}
                      {sec.horario && (
                        <div className="flex items-center gap-3">
                          <Clock size={16} className="text-gray-400 shrink-0" />
                          <p className="text-xs text-gray-600">{sec.horario}</p>
                        </div>
                      )}
                    </div>

                    {/* Competências */}
                    {sec.competencias && sec.competencias.length > 0 && (
                      <div className="bg-blue-50/30 border border-blue-100 rounded-2xl p-4 text-left">
                        <h4 className="text-xs font-black text-[#173572] uppercase tracking-wider mb-3 flex items-center gap-2">
                          <FileText size={14} />
                          Competências e Atribuições
                        </h4>

                        <ul className="space-y-2 list-none pl-0 m-0">
                          {sec.competencias.map((item, i) => (
                            <li
                              key={i}
                              className="flex items-start gap-2 text-xs text-gray-600 leading-relaxed"
                            >
                              <span className="w-1 h-1 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}


                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>



    </ContentPage>
  );
}
