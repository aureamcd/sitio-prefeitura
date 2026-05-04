"use client";

import Link from "next/link";
import ContentPage from "@/components/layout/ContentPage";
import { secretariasOrgaos } from "@/lib/institucional/secretariasOrgaos";
import portalData from "@/lib/data/portal.json";

type Item = {
    nome: string;
    slug: string;
    tipo: "secretaria" | "orgao";
    responsavel?: string;
    cargo?: string;
    email?: string;
};

export default function GestaoPage() {

    /* ======================
       DADOS DINÂMICOS
    ====================== */

    const lista = Object.entries(secretariasOrgaos as Record<string, Item>);

    const secretarias = lista.filter(([_, item]) => item.tipo === "secretaria");
    const orgaos = lista.filter(([_, item]) => item.tipo === "orgao");

    const chefiaExecutiva = [
        { 
            cargo: portalData.gestao.prefeita.cargo, 
            nome: portalData.gestao.prefeita.nome,
            detalhes: [
                { label: "Ocupação", value: portalData.gestao.prefeita.ocupacao },
                { label: "Escolaridade", value: portalData.gestao.prefeita.escolaridade },
                { label: "Naturalidade", value: portalData.gestao.prefeita.naturalidade }
            ]
        },
        { 
            cargo: portalData.gestao.vice_prefeito.cargo, 
            nome: portalData.gestao.vice_prefeito.nome,
            detalhes: [
                { label: "Ocupação", value: portalData.gestao.vice_prefeito.ocupacao },
                { label: "Escolaridade", value: portalData.gestao.vice_prefeito.escolaridade },
                { label: "Naturalidade", value: portalData.gestao.vice_prefeito.naturalidade }
            ]
        },
    ];

    const orgaosCentrais = [
        { 
            cargo: (portalData.gestao as any).gabinete?.cargo || "Chefe de Gabinete", 
            nome: (portalData.gestao as any).gabinete?.nome || "Em atualização" 
        },
        { cargo: "Controlador Geral do Município", nome: "Em atualização" },
        { cargo: "Procurador Geral do Município", nome: "Em atualização" },
    ];

    return (
        <ContentPage
            title="Gestão Municipal"
            breadcrumb={[
                { label: "Início", href: "/" },
                { label: "Gestão" },
            ]}
            responsavel="Secretaria Municipal de Administração"
            lastUpdate="2026-05-04"
        >

            {/* INTRODUÇÃO */}
            <section className="mb-10">
                <p className="text-gray-700 leading-relaxed">
                    Nesta seção são apresentados os responsáveis pelas unidades administrativas
                    da Prefeitura Municipal de Padre Marcos - PI.
                </p>

                <p className="text-sm mt-3">
                    Consulte também:
                </p>

                <ul className="list-disc ml-5 text-blue-600">
                    <li>
                        <Link href="/estrutura-organizacional" className="hover:underline">
                            Estrutura Organizacional
                        </Link>
                    </li>
                    <li>
                        <Link href="/competencias" className="hover:underline">
                            Competências e atribuições
                        </Link>
                    </li>
                </ul>
            </section>

            {/* CHEFIA EXECUTIVA */}
            <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    Chefia do Poder Executivo
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {chefiaExecutiva.map((item, idx) => (
                        <div key={idx} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex flex-col gap-4">
                                <div>
                                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full mb-2 uppercase tracking-wider">
                                        {item.cargo}
                                    </span>
                                    <h3 className="text-xl font-bold text-gray-900">{item.nome}</h3>
                                </div>
                                
                                <div className="grid grid-cols-1 gap-2 border-t pt-4">
                                    {item.detalhes.map((det, dIdx) => (
                                        <div key={dIdx} className="flex justify-between text-sm">
                                            <span className="text-gray-500">{det.label}:</span>
                                            <span className="font-medium text-gray-900">{det.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* SECRETARIAS */}
            <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    Secretarias Municipais
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {secretarias.map(([_, sec], idx) => (
                        <div
                            key={idx}
                            className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm border-l-4 border-blue-600 hover:shadow-md transition-all flex flex-col justify-between"
                        >
                            <div className="space-y-3">
                                <h3 className="font-bold text-gray-900 leading-tight">{sec.nome}</h3>

                                <div className="space-y-2">
                                    <p className="text-sm text-gray-600">
                                        <span className="font-semibold text-gray-900">{sec.cargo || "Secretário"}:</span><br/>
                                        {sec.responsavel || "Em atualização"}
                                    </p>
                                    {sec.email && (
                                        <p className="text-xs text-blue-600 truncate">
                                            {sec.email}
                                        </p>
                                    )}
                                </div>
                            </div>
                            
                            <Link 
                                href={`/secretarias/${sec.slug}`}
                                className="text-blue-600 text-xs font-bold mt-4 flex items-center gap-1 hover:underline"
                            >
                                Ver perfil completo →
                            </Link>
                        </div>
                    ))}
                </div>
            </section>

            {/* ÓRGÃOS CENTRAIS */}
            <section className="mb-12">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                    Órgãos Vinculados ao Gabinete
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Gabinete (Sem página própria ainda) */}
                    <div className="bg-white border rounded-2xl p-6 shadow-sm border-l-4 border-amber-500">
                        <h3 className="font-bold text-gray-900">{(portalData.gestao as any).gabinete?.cargo || "Chefe de Gabinete"}</h3>
                        <p className="text-sm text-gray-600 mt-1">{(portalData.gestao as any).gabinete?.nome || "Em atualização"}</p>
                    </div>

                    {/* Outros Órgãos */}
                    {orgaos.map(([slug, item], idx) => (
                        <Link 
                            key={idx} 
                            href={`/secretarias/${slug}`}
                            className="bg-white border rounded-2xl p-6 shadow-sm border-l-4 border-gray-400 hover:shadow-md hover:border-blue-500 transition-all group"
                        >
                            <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{item.cargo}</h3>
                            <p className="text-sm text-gray-600 mt-1">{item.nome}</p>
                            <span className="text-[10px] font-bold text-blue-600 uppercase mt-3 block">Ver detalhes →</span>
                        </Link>
                    ))}
                </div>
            </section>

            {/* OBSERVAÇÃO */}
            <section className="mb-10 bg-blue-50 border border-blue-100 rounded-2xl p-6">
                <p className="text-sm text-blue-800 leading-relaxed">
                    <strong>Transparência:</strong> As informações apresentadas nesta página são atualizadas periodicamente de acordo com as nomeações e alterações na estrutura administrativa do município.
                </p>
            </section>

        </ContentPage>
    );
}
