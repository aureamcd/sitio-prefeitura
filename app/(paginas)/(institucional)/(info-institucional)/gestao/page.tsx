"use client";

import Link from "next/link";
import ContentPage from "@/components/layout/ContentPage";
import { secretariasOrgaos } from "@/lib/institucional/secretariasOrgaos";

type Item = {
    nome: string;
    tipo: "secretaria" | "orgao";
    responsavel?: string;
    cargo?: string;
};

export default function GestaoPage() {

    /* ======================
       DADOS DINÂMICOS
    ====================== */

    const lista = Object.entries(secretariasOrgaos as Record<string, Item>);

    const secretarias = lista.filter(([_, item]) => item.tipo === "secretaria");
    const orgaos = lista.filter(([_, item]) => item.tipo === "orgao");

    const chefiaExecutiva = [
        { cargo: "Prefeito", nome: "Em atualização" },
        { cargo: "Vice-Prefeito", nome: "Em atualização" },
    ];

    const orgaosCentrais = [
        { cargo: "Chefe de Gabinete", nome: "Em atualização" },
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
            lastUpdate="30/04/2026"
        >

            {/* INTRODUÇÃO */}
            <section className="mb-10">
                <p className="text-gray-700 leading-relaxed">
                    Nesta seção são apresentados os responsáveis pelas unidades administrativas
                    da Prefeitura Municipal.
                </p>

                <p className="text-sm mt-3">
                    Consulte também:
                </p>

                <ul className="list-disc ml-5 text-blue-600">
                    <li>
                        <Link href="/info-institucional/estrutura-organizacional" className="hover:underline">
                            Estrutura Organizacional
                        </Link>
                    </li>
                    <li>
                        <Link href="/info-institucional/competencias" className="hover:underline">
                            Competências e atribuições
                        </Link>
                    </li>
                </ul>
            </section>

            {/* CHEFIA EXECUTIVA */}
            <section className="mb-12">
                <h2 className="text-xl font-semibold mb-4">
                    Chefia do Poder Executivo
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {chefiaExecutiva.map((item, idx) => (
                        <div key={idx} className="bg-white border rounded-lg p-4 shadow-sm">
                            <h3 className="font-semibold">{item.cargo}</h3>
                            <p className="text-sm text-gray-600 mt-1">{item.nome}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ÓRGÃOS CENTRAIS */}
            <section className="mb-12">
                <h2 className="text-xl font-semibold mb-4">
                    Órgãos Vinculados ao Gabinete
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {orgaosCentrais.map((item, idx) => (
                        <div key={idx} className="bg-white border rounded-lg p-4 shadow-sm">
                            <h3 className="font-semibold">{item.cargo}</h3>
                            <p className="text-sm text-gray-600 mt-1">{item.nome}</p>
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
                    {secretarias.map(([_, sec], idx) => (
                        <div
                            key={idx}
                            className="bg-white border rounded-lg p-4 shadow-sm border-l-4 border-blue-500"
                        >
                            <h3 className="font-semibold">{sec.nome}</h3>

                            <p className="text-sm text-gray-600 mt-1">
                                {sec.cargo || "Secretário"}: {sec.responsavel || "Em atualização"}
                            </p>
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
                    {orgaos.map(([_, org], idx) => (
                        <div
                            key={idx}
                            className="bg-white border rounded-lg p-4 shadow-sm border-l-4 border-green-500"
                        >
                            <h3 className="font-semibold">{org.nome}</h3>

                            <p className="text-sm text-gray-600 mt-1">
                                {org.cargo || "Responsável"}: {org.responsavel || "Em atualização"}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* OBSERVAÇÃO */}
            <section className="mb-10 bg-gray-50 border rounded-lg p-4">
                <p className="text-sm text-gray-500 italic">
                    <strong>Aviso:</strong> As informações desta seção estão em processo de atualização pela administração municipal para garantir a máxima transparência e precisão dos dados.
                </p>
            </section>

        </ContentPage>
    );
}
