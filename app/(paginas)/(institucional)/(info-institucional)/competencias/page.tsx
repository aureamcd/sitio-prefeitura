"use client";

import Link from "next/link";
import ContentPage from "@/components/layout/ContentPage";
import { secretariasOrgaos } from "@/lib/institucional/secretariasOrgaos";

type Item = {
    nome: string;
    tipo: "secretaria" | "orgao";
    competencias?: string[];
};

export default function CompetenciasPage() {

    /* ======================
       DADOS DINÂMICOS
    ====================== */

    const lista = Object.entries(secretariasOrgaos as Record<string, Item>);

    const secretarias = lista.filter(([_, item]) => item.tipo === "secretaria");
    const orgaos = lista.filter(([_, item]) => item.tipo === "orgao");

    return (
        <ContentPage
            title="Competências e Atribuições"
            breadcrumb={[
                { label: "Início", href: "/" },
                { label: "Competências" },
            ]}
            lastUpdate="2026-05-04"
        >

            {/* INTRODUÇÃO */}
            <section className="mb-10">
                <p className="text-gray-700 leading-relaxed">
                    Nesta seção são apresentadas as competências e atribuições das unidades administrativas
                    da Prefeitura Municipal, conforme definido na legislação vigente.
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
                        <Link href="/gestao" className="hover:underline">
                            Gestão e responsáveis
                        </Link>
                    </li>
                </ul>
            </section>

            {/* BASE LEGAL */}
            <section className="mb-10">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">
                    Base Legal
                </h2>

                <p className="text-gray-700">
                    As competências das unidades administrativas estão estabelecidas na legislação municipal vigente,
                    especialmente na lei que dispõe sobre a estrutura administrativa do Poder Executivo.
                </p>

                <p className="text-gray-700 mt-2">
                    Lei Municipal nº XXX/XXXX.
                </p>
            </section>

            {/* SECRETARIAS */}
            <section className="mb-12">
                <h2 className="text-xl font-semibold mb-4">
                    Secretarias Municipais
                </h2>

                <div className="space-y-4">
                    {secretarias.map(([_, sec], idx) => (
                        <div
                            key={idx}
                            className="bg-white border rounded-lg p-4 shadow-sm"
                        >
                            <h3 className="font-semibold">
                                {sec.nome}
                            </h3>

                            <div className="text-sm text-gray-600 mt-2 space-y-1">
                                {sec.competencias && sec.competencias.length > 0 ? (
                                    <ul className="list-disc pl-5">
                                        {sec.competencias.map((c, i) => (
                                            <li key={i}>{c}</li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p>Competências em atualização.</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ÓRGÃOS */}
            <section className="mb-12">
                <h2 className="text-xl font-semibold mb-4">
                    Órgãos Municipais
                </h2>

                <div className="space-y-4">
                    {orgaos.map(([_, org], idx) => (
                        <div
                            key={idx}
                            className="bg-white border rounded-lg p-4 shadow-sm"
                        >
                            <h3 className="font-semibold">
                                {org.nome}
                            </h3>

                            <div className="text-sm text-gray-600 mt-2 space-y-1">
                                {org.competencias && org.competencias.length > 0 ? (
                                    <ul className="list-disc pl-5">
                                        {org.competencias.map((c, i) => (
                                            <li key={i}>{c}</li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p>Competências em atualização.</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* OBSERVAÇÃO */}
            <section className="mb-10 bg-gray-50 border rounded-lg p-4">
                <p className="text-sm text-gray-600">
                    <strong>Observação:</strong> As competências podem ser atualizadas conforme alterações na legislação municipal.
                </p>
            </section>

        </ContentPage>
    );
}
