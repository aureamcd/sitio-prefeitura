"use client";

import Link from "next/link";
import ContentPage from "@/components/layout/ContentPage";
import { secretariasOrgaos } from "@/lib/institucional/secretariasOrgaos";

type Item = {
    nome: string;
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
        { nome: "Gabinete do Prefeito", responsavel: "Em atualização" },
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
            lastUpdate="30/04/2026"
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
                        <Link href="/info-institucional/competencias" className="hover:underline">
                            Competências e atribuições
                        </Link>
                    </li>
                    <li>
                        <Link href="/info-institucional/gestao" className="hover:underline">
                            Gestão e responsáveis
                        </Link>
                    </li>
                </ul>
            </section>

            {/* BASE LEGAL */}
            <section className="mb-10">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">
                    Base Legal da Estrutura Administrativa
                </h2>

                <p className="text-gray-700">
                    A organização administrativa do Poder Executivo Municipal está definida pela legislação vigente.
                </p>

                <p className="text-gray-700 mt-2">
                    Lei Municipal nº XXX/XXXX.
                </p>
            </section>

            {/* ORGANOGRAMA */}
            <section className="mb-12">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Organograma da Administração Municipal
                </h2>

                <figure className="bg-gray-50 border rounded-lg p-6 text-center">
                    <img
                        src="/organograma.png"
                        alt="Organograma da Prefeitura Municipal com hierarquia administrativa"
                        className="mx-auto max-w-full h-auto mb-4"
                    />

                    <figcaption className="text-left text-sm text-gray-600 mb-6 border-l-4 border-blue-200 pl-4">
                        <strong>Descrição do Organograma:</strong> O Poder Executivo é liderado pelo Prefeito Municipal.
                        Abaixo estão o Gabinete do Prefeito e os Órgãos Centrais (Controladoria e Procuradoria).
                        Em seguida, a estrutura se divide nas Secretarias Municipais e nos Órgãos Administrativos Vinculados,
                        conforme detalhado nas seções abaixo.
                    </figcaption>

                    <div>
                        <a
                            href="/arquivos/organograma.pdf"
                            className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
                        >
                            Baixar organograma (PDF)
                        </a>
                    </div>
                </figure>
            </section>

            {/* HIERARQUIA PRINCIPAL */}
            <section className="mb-12 text-center">
                <div className="inline-block bg-blue-50 border rounded-xl px-8 py-6">
                    <h2 className="text-lg font-semibold text-gray-900">
                        Prefeito(a)
                    </h2>

                    <p className="text-sm text-gray-600">
                        Em atualização
                    </p>
                </div>
            </section>

            {/* ÓRGÃOS CENTRAIS */}
            <section className="mb-12">
                <h2 className="text-xl font-semibold mb-4">
                    Órgãos Vinculados ao Gabinete
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {orgaosCentrais.map((orgao, idx) => (
                        <div key={idx} className="bg-white border rounded-lg p-4 shadow-sm">
                            <h3 className="font-semibold">{orgao.nome}</h3>
                            <p className="text-sm text-gray-600">
                                Responsável: {orgao.responsavel}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* SECRETARIAS */}
            <section className="mb-12">
                <h2 className="text-xl font-semibold mb-4">
                    Secretarias Municipais
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {secretarias.map(([slug, sec], idx) => (
                        <div
                            key={idx}
                            className="bg-white border rounded-lg p-4 shadow-sm border-l-4 border-blue-500"
                        >
                            <h3 className="font-semibold">{sec.nome}</h3>

                            <p className="text-sm text-gray-600 mt-1">
                                {sec.cargo}: {sec.responsavel || "Em atualização"}
                            </p>

                            <Link
                                href={`/info-institucional/secretarias-orgaos/${slug}`}
                                className="text-blue-600 text-sm mt-3 inline-block hover:underline"
                            >
                                Acessar →
                            </Link>
                        </div>
                    ))}
                </div>
            </section>

            {/* ÓRGÃOS */}
            <section className="mb-12">
                <h2 className="text-xl font-semibold mb-4">
                    Órgãos Municipais
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {orgaos.map(([slug, org], idx) => (
                        <div
                            key={idx}
                            className="bg-white border rounded-lg p-4 shadow-sm border-l-4 border-green-500"
                        >
                            <h3 className="font-semibold">{org.nome}</h3>

                            <p className="text-sm text-gray-600 mt-1">
                                {org.cargo}: {org.responsavel || "Em atualização"}
                            </p>

                            <Link
                                href={`/info-institucional/secretarias-orgaos/${slug}`}
                                className="text-green-600 text-sm mt-3 inline-block hover:underline"
                            >
                                Acessar →
                            </Link>
                        </div>
                    ))}
                </div>
            </section>

            {/* OBSERVAÇÃO */}
            <section className="mb-10 bg-gray-50 border rounded-lg p-4">
                <p className="text-sm text-gray-600">
                    <strong>Observação:</strong> A estrutura organizacional pode sofrer alterações conforme legislação vigente.
                </p>
            </section>

        </ContentPage>
    );
}
