"use client";

import Link from "next/link";
import ContentPage from "@/components/layout/ContentPage";
import { secretariasOrgaos } from "@/lib/institucional/secretariasOrgaos";
import portalData from "@/lib/data/portal.json";

type Item = {
    nome: string;
    slug: string;
    tipo: "secretaria" | "orgao";
    responsavel: string;
    cargo: string;
};

export default function EstruturaOrganizacionalPage() {

    /* ======================
       DADOS DINÂMICOS
    ====================== */

    const lista = Object.entries(secretariasOrgaos as Record<string, Item>);

    const secretarias = lista.filter(([_, item]) => item.tipo === "secretaria");
    const orgaos = lista.filter(([_, item]) => item.tipo === "orgao");

    const orgaosCentrais: { nome: string; responsavel: string }[] = [
        { nome: "Gabinete do Prefeito", responsavel: (portalData.gestao as any).gabinete?.nome || "Em atualização" },
        { nome: "Controladoria Geral do Município", responsavel: "Em atualização" },
        { nome: "Procuradoria Geral do Município", responsavel: "Em atualização" },
    ];

    return (
        <ContentPage
            title="Estrutura Organizacional"
            breadcrumb={[
                { label: "Início", href: "/" },
                { label: "Estrutura Organizacional" },
            ]}
            responsavel="Secretaria Municipal de Administração"
            lastUpdate="2026-05-04"
        >

            {/* INTRODUÇÃO */}
            <section className="mb-10">
                <p className="text-gray-700 leading-relaxed">
                    A estrutura organizacional da Prefeitura Municipal apresenta a hierarquia das unidades administrativas,
                    incluindo o Gabinete do Prefeito, Secretarias Municipais e demais órgãos.
                </p>

                <p className="text-sm mt-3">
                    Para mais informações, consulte também:
                </p>

                <ul className="list-disc ml-5 text-blue-600">
                    <li>
                        <Link href="/competencias" className="hover:underline">
                            Competências e atribuições
                        </Link>
                    </li>
                    <li>
                        <Link href="/gestao" className="hover:underline">
                            Gestão e responsáveis
                        </Link>
                    </li>
                </ul>
            </section>

            {/* ORGANOGRAMA */}
            <section className="mb-12">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                    Organograma da Administração Municipal
                </h2>

                <div className="bg-white border rounded-3xl p-8 shadow-sm">
                    <div className="flex flex-col items-center gap-8">
                        
                        {/* Nível 1: Prefeita e Vice */}
                        <div className="flex flex-col sm:flex-row gap-4 items-center">
                            <div className="bg-blue-600 text-white px-8 py-4 rounded-2xl shadow-lg text-center min-w-[200px]">
                                <p className="text-xs uppercase font-bold opacity-80">{portalData.gestao.prefeita.cargo}</p>
                                <h3 className="text-lg font-bold">{portalData.gestao.prefeita.nome}</h3>
                            </div>
                            <div className="hidden sm:block w-8 h-px bg-gray-300" />
                            <div className="bg-blue-500 text-white px-8 py-4 rounded-2xl shadow-lg text-center min-w-[200px]">
                                <p className="text-xs uppercase font-bold opacity-80">{portalData.gestao.vice_prefeito.cargo}</p>
                                <h3 className="text-lg font-bold">{portalData.gestao.vice_prefeito.nome}</h3>
                            </div>
                        </div>

                        <div className="w-px h-8 bg-gray-300" />

                        {/* Nível 2: Gabinete */}
                        <div className="bg-amber-500 text-white px-8 py-4 rounded-2xl shadow-lg text-center min-w-[200px]">
                            <p className="text-xs uppercase font-bold opacity-80">Gabinete do Prefeito</p>
                            <h3 className="text-lg font-bold">{(portalData.gestao as any).gabinete?.nome || "Em atualização"}</h3>
                        </div>

                        <div className="w-px h-8 bg-gray-300" />

                        {/* Nível 3: Secretarias (Resumo) */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full">
                            {secretarias.slice(0, 8).map(([_, sec], idx) => (
                                <div key={idx} className="bg-gray-50 border border-gray-200 p-3 rounded-xl text-center text-xs font-medium text-gray-600">
                                    {sec.nome.replace("Secretaria Municipal de ", "")}
                                </div>
                            ))}
                        </div>
                    </div>

                    <figcaption className="text-sm text-gray-600 mt-8 border-l-4 border-blue-200 pl-4">
                        <strong>Descrição do Organograma:</strong> O Poder Executivo é liderado pelo Prefeito Municipal.
                        Abaixo estão o Gabinete do Prefeito e os Órgãos Centrais.
                        Em seguida, a estrutura se divide nas Secretarias Municipais.
                    </figcaption>
                </div>
            </section>

            {/* ÓRGÃOS CENTRAIS */}
            <section className="mb-12">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                    Órgãos Vinculados ao Gabinete
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {orgaosCentrais.map((orgao, idx) => (
                        <div key={idx} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
                            <h3 className="font-bold text-gray-900 mb-2">{orgao.nome}</h3>
                            <p className="text-sm text-gray-600">
                                <span className="font-semibold">Responsável:</span><br/>
                                {orgao.responsavel}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* SECRETARIAS */}
            <section className="mb-12">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                    Secretarias Municipais
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {secretarias.map(([slug, sec], idx) => (
                        <div
                            key={idx}
                            className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm border-l-4 border-blue-600 hover:shadow-md transition-all flex flex-col justify-between"
                        >
                            <div>
                                <h3 className="font-bold text-gray-900 leading-tight mb-2">{sec.nome}</h3>
                                <p className="text-sm text-gray-600">
                                    <span className="font-semibold text-gray-700">{sec.cargo}:</span> {sec.responsavel || "Em atualização"}
                                </p>
                            </div>

                            <Link
                                href={`/secretarias/${slug}`}
                                className="text-blue-600 text-sm font-bold mt-4 flex items-center gap-1 hover:gap-2 transition-all"
                            >
                                Ver detalhes →
                            </Link>
                        </div>
                    ))}
                </div>
            </section>

            {/* OBSERVAÇÃO */}
            <section className="mb-10 bg-gray-50 border border-gray-200 rounded-2xl p-6">
                <p className="text-sm text-gray-600 italic">
                    <strong>Observação:</strong> A estrutura organizacional é definida pela Lei Municipal vigente e pode sofrer alterações conforme decretos de reorganização administrativa.
                </p>
            </section>

        </ContentPage>
    );
}
