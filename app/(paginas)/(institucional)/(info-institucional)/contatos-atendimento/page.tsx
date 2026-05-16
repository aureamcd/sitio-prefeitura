"use client";

import ContentPage from "@/components/layout/ContentPage";
import portalData from "@/lib/data/portal.json";

type Unidade = {
    nome: string;
    endereco: string;
    telefone: string;
    email: string;
    horario: string;
};

export default function ContatosPage() {
    
    // Unidade Sede
    const sede: Unidade = {
        nome: "Sede da Prefeitura Municipal",
        endereco: "Rua Anfrísio Macedo, 150, Centro - CEP 64.680-000, Padre Marcos - PI",
        telefone: portalData.gestao.prefeita.telefone,
        email: portalData.gestao.prefeita.email,
        horario: "Segunda a sexta, das 08h às 12h",
    };

    // Mapeando secretarias do JSON
    const secretarias: Unidade[] = portalData.secretarias.map(s => ({
        nome: s.nome,
        endereco: s.nome === "Secretaria Municipal de Saúde" ? "Centro de Saúde, Centro, Padre Marcos - PI" : "Rua Anfrísio Macedo, Centro, Padre Marcos - PI",
        telefone: s.telefone,
        email: s.email,
        horario: "Segunda a sexta, das 08h às 12h",
    }));

    const todasUnidades = [sede, ...secretarias];

    return (
        <ContentPage
            title="Contatos e Atendimento"
            breadcrumb={[
                { label: "Início", href: "/" },
                { label: "Contatos e Atendimento" },
            ]}
            lastUpdate="2026-05-04"
        >

            {/* INTRODUÇÃO */}
            <section className="mb-10">
                <p className="text-gray-700 leading-relaxed">
                    Nesta seção são disponibilizadas as informações de contato e os horários
                    de atendimento das unidades administrativas da Prefeitura Municipal de Padre Marcos - PI.
                </p>
            </section>

            {/* UNIDADES */}
            <h2 className="text-2xl font-bold text-[#173572] mb-6 border-b pb-2">Unidades de Atendimento</h2>
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

                {todasUnidades.map((u, idx) => (
                    <div
                        key={idx}
                        className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col"
                    >
                        <h3 className="font-bold text-gray-900 leading-tight mb-4 min-h-[3rem] flex items-center">
                            {u.nome}
                        </h3>

                        <div className="text-sm text-gray-600 space-y-3 flex-grow">

                            <div className="flex gap-2">
                                <span className="font-semibold text-gray-900 shrink-0">Endereço:</span>
                                <span>{u.endereco}</span>
                            </div>

                            <div className="flex gap-2">
                                <span className="font-semibold text-gray-900 shrink-0">Telefone:</span>
                                <span>{u.telefone}</span>
                            </div>

                            <div className="flex gap-2">
                                <span className="font-semibold text-gray-900 shrink-0">E-mail:</span>
                                <a href={`mailto:${u.email}`} className="text-blue-600 hover:underline break-all">
                                    {u.email}
                                </a>
                            </div>

                            <div className="mt-4 pt-4 border-t">
                                <span className="font-semibold text-gray-900">Horário:</span><br />
                                <span className="text-xs uppercase tracking-wider">{u.horario}</span>
                            </div>

                        </div>
                    </div>
                ))}

            </section>

            {/* OBSERVAÇÃO */}
            <section className="mt-12 bg-blue-50 border border-blue-100 rounded-2xl p-6">
                <p className="text-sm text-blue-800">
                    <strong>Observação:</strong> Os horários de atendimento podem sofrer alterações
                    conforme necessidade administrativa ou feriados municipais/estaduais.
                </p>
            </section>

        </ContentPage>
    );
}
