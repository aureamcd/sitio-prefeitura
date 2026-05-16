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
  Truck
} from "lucide-react";
import { secretariasOrgaos } from "@/lib/institucional/secretariasOrgaos";
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
  const [expandedSlugs, setExpandedSlugs] = useState<string[]>([]);

  /* ======================
     DADOS DINÂMICOS
  ====================== */

  const lista = Object.entries(secretariasOrgaos as Record<string, Item>);

  const secretarias = lista.filter(([_, item]) => item.tipo === "secretaria");

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
      lastUpdate="2026-05-15"
    >

      {/* 1. INTRODUÇÃO */}
      <div className="mb-10">
        <div className="bg-[#173572] text-white p-5 rounded-2xl shadow-sm mb-6 flex items-start sm:items-center gap-4 border-l-4 border-blue-400">
          <Info size={28} className="shrink-0 text-blue-200 mt-0.5 sm:mt-0" />
          <p className="font-medium text-[15px] sm:text-base leading-relaxed">
            Unidades administrativas e hierarquia da Prefeitura Municipal de Padre Marcos - PI.
          </p>
        </div>
        <p className="text-gray-600 leading-relaxed max-w-4xl">
          A estrutura organizacional apresenta a hierarquia das unidades administrativas, incluindo o Gabinete do Prefeito e suas Secretarias Municipais, garantindo a eficiência da gestão pública.
        </p>

        <div className="mt-4 bg-white border border-gray-200 rounded-2xl p-6 max-w-xl shadow-sm mx-auto">
          <div className="flex items-start gap-3 text-[#173572]">
            <MapPin size={20} className="text-blue-500 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-black">Sede Administrativa da Prefeitura</p>
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

        <div className="mt-8 flex flex-wrap gap-8 justify-center">
          <Link href="/competencias" className="group flex items-center gap-2 text-sm font-bold text-[#173572] hover:text-[#0f2847] transition-colors relative pb-1">
            <ShieldCheck size={18} className="text-blue-500" />
            <span>Ver Competências e atribuições completas</span>
            <span className="absolute bottom-0 left-7 right-0 h-0.5 bg-blue-400 scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
            <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </Link>
          <Link href="/gestao" className="group flex items-center gap-2 text-sm font-bold text-[#173572] hover:text-[#0f2847] transition-colors relative pb-1">
            <Users size={18} className="text-blue-500" />
            <span>Ver Gestão e responsáveis completos</span>
            <span className="absolute bottom-0 left-7 right-0 h-0.5 bg-blue-400 scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
            <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </Link>
        </div>
      </div>

      {/* 2. BASE LEGAL */}
      <div className="mb-12">
        <div className="bg-linear-to-br from-white to-blue-50/40 border border-blue-100 rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="max-w-xl">
              <h2 className="text-lg font-bold text-[#173572] mb-2 flex items-center gap-2">
                <FileText size={20} /> Base Legal da Estrutura
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                A estrutura administrativa do Poder Executivo Municipal está organizada conforme a Lei Municipal nº XXX/2025, que dispõe sobre a organização administrativa da Prefeitura Municipal de Padre Marcos.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Link
                href="/legislacao/lei-estrutura-administrativa.pdf"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#173572] text-white rounded-xl text-sm font-bold hover:bg-[#0f2847] transition-all shadow-md hover:shadow-lg"
              >
                Lei em PDF
              </Link>
              <Link
                href="/legislacao/estrutura-administrativa"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-blue-100 text-[#173572] rounded-xl text-sm font-bold hover:bg-blue-50 transition-all"
              >
                Versão HTML
              </Link>
            </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl relative z-10 mb-10">
            {/* Prefeita */}
            <div className="bg-white border border-gray-100 rounded-[2.5rem] p-6 shadow-lg hover:shadow-xl transition-all group flex items-center gap-5">
              <div className="relative shrink-0">
                <div className="w-20 h-20 rounded-full bg-linear-to-tr from-[#173572] to-blue-500 p-1 shadow-md group-hover:rotate-6 transition-transform">
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden border-2 border-white">
                    <div className="w-full h-full bg-gray-50 flex items-center justify-center text-gray-300">
                      <Users size={32} strokeWidth={1} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-left">
                <p className="text-[10px] uppercase font-black tracking-[0.2em] text-blue-500 mb-0.5">{portalData.gestao.prefeita.cargo}</p>
                <h3 className="text-lg font-black text-[#173572] leading-tight">{portalData.gestao.prefeita.nome}</h3>
              </div>
            </div>

            {/* Vice-Prefeito */}
            <div className="bg-white border border-gray-100 rounded-[2.5rem] p-6 shadow-lg hover:shadow-xl transition-all group flex items-center gap-5">
              <div className="relative shrink-0">
                <div className="w-20 h-20 rounded-full bg-linear-to-tr from-blue-400 to-blue-600 p-1 shadow-md group-hover:-rotate-6 transition-transform">
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden border-2 border-white">
                    <div className="w-full h-full bg-gray-50 flex items-center justify-center text-gray-300">
                      <Users size={32} strokeWidth={1} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-left">
                <p className="text-[10px] uppercase font-black tracking-[0.2em] text-blue-500 mb-0.5">{portalData.gestao.vice_prefeito.cargo}</p>
                <h3 className="text-lg font-black text-[#173572] leading-tight">{portalData.gestao.vice_prefeito.nome}</h3>
              </div>
            </div>
          </div>

          {/* Nível 2: Gabinete (Compacto) */}
          <div className="relative w-full flex flex-col items-center mb-16">
            <div className="w-px h-1 bg-linear-to-b from-blue-200 to-[#173572]/20 mb-20" />
            <div className="bg-white border-2 border-blue-50 rounded-[2rem] p-5 shadow-lg hover:shadow-xl transition-all group max-w-xl flex items-center gap-5 relative overflow-hidden mb-10">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-[#173572]"></div>
              <div className="relative shrink-0">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center overflow-hidden border border-white shadow-sm group-hover:scale-105 transition-transform">
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-300">
                    <Building2 size={28} strokeWidth={1} />
                  </div>
                </div>
              </div>
              <div className="flex-1 text-left ">
                <p className="text-[10px] uppercase font-black tracking-[0.2em] text-blue-500">Assessoria Direta</p>
                <h3 className="text-base font-black text-[#173572]">Gabinete do Prefeito</h3>
                <p className="text-[13px] font-bold text-gray-500 mt-0.5">{(portalData.gestao as any).gabinete?.nome || "Em atualização"}</p>
              </div>
            </div>
          </div>

          {/* Nível 3: Secretarias (Grid Visual Lateral) */}
          <div className="w-full pt-12 mt-10">
            <p className="text-center text-[10px] font-black text-gray-400 uppercase tracking-[0.6em] mb-10">Corpo de Secretarias Municipais</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {secretarias.map(([_, sec], idx) => (
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

        <div className="columns-1 md:columns-2 gap-8 space-y-8">
          {secretarias.map(([slug, sec], idx) => {
            const isOpen = expandedSlugs.includes(slug);

            const toggleExpand = () => {
              setExpandedSlugs(prev =>
                prev.includes(slug)
                  ? prev.filter(s => s !== slug)
                  : [...prev, slug]
              );
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
                <div className={`p-6 ${!isOpen ? 'min-h-[180px] flex flex-col justify-between' : ''}`}>
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

                  <h3 className="font-bold text-gray-900 leading-tight text-lg mb-2 group-hover:text-[#173572] transition-colors">
                    {sec.nome}
                  </h3>

                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                      <Users size={14} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{sec.cargo}</p>
                      <p className="text-sm font-bold text-gray-700">{sec.responsavel || "Em atualização"}</p>
                    </div>
                  </div>
                </div>

                {/* Conteúdo Expandido */}
                <div className={`px-6 overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[1200px] pb-12 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="space-y-6 pt-2 border-t border-gray-100">

                    {/* Competências */}
                    <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4">
                      <h4 className="text-xs font-black text-[#173572] uppercase tracking-wider mb-3 flex items-center gap-2">
                        <ShieldCheck size={14} /> Competências
                      </h4>
                      {sec.competencias?.length ? (
                        <ul className="space-y-2">
                          {sec.competencias.slice(0, 5).map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-gray-600 leading-relaxed">
                              <span className="w-1 h-1 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                              {item}
                            </li>
                          ))}
                          {sec.competencias.length > 5 && (
                            <li className="text-[10px] text-blue-600 font-bold italic pt-1">Ver mais competências na versão completa...</li>
                          )}
                        </ul>
                      ) : (
                        <p className="text-xs text-gray-500 italic">Informações em atualização no sistema.</p>
                      )}
                    </div>

                    {/* Contatos */}
                    <div className="space-y-3 px-1">
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

                    {/* Link para Página Completa */}
                    <div className="pt-6 mt-4 border-t border-gray-100 flex justify-center">
                      <Link
                        href={`/secretarias/${slug}`}
                        onClick={(e) => e.stopPropagation()}
                        className="group/link flex items-center gap-2 text-xs font-black text-[#173572] hover:text-blue-600 transition-colors relative pb-1"
                      >
                        <span>ACESSAR PÁGINA COMPLETA DA SECRETARIA</span>
                        <ArrowRight size={14} className="group-hover/link:translate-x-1 transition-transform" />
                        <span className="absolute bottom-0 left-0 w-full h-0.5 bg-yellow-400 scale-x-0 group-hover/link:scale-x-100 transition-transform origin-left"></span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. RODAPÉ INFORMATIVO */}
      <div className="bg-gray-50 border border-gray-100 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6">
        <div className="bg-white p-4 rounded-2xl shadow-sm text-amber-500">
          <Info size={32} />
        </div>
        <div className="flex-1 text-center sm:text-left">
          <p className="text-gray-900 font-bold mb-1">Informações em constante atualização</p>
          <p className="text-sm text-gray-600 leading-relaxed">
            A estrutura organizacional é definida por lei e pode sofrer alterações. Para dúvidas específicas sobre as atribuições de cada unidade, consulte a <Link href="/competencias" className="text-blue-600 font-bold relative inline-block group/link transition-colors"><span>Lei de Estrutura Administrativa</span><span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-400 scale-x-0 group-hover/link:scale-x-100 transition-transform origin-left"></span></Link>.
          </p>
        </div>
      </div>


    </ContentPage>
  );
}
