"use client";

import ContentPage from "@/components/layout/ContentPage";

type Unidade = {
    nome: string;
    endereco: string;
    telefone: string;
    email: string;
    horario: string;
};

const unidades: Unidade[] = [
    {
        nome: "Sede da Prefeitura Municipal",
        endereco: "Rua Anfrísio Macedo, 150, Centro - CEP 64.680-000, Padre Marcos - PI",
        telefone: "(89) 98116-0296",
        email: "pmpadremarcos@gmail.com",
        horario: "Segunda a sexta, das 07h às 12h",
    },
    {
        nome: "Secretaria Municipal de Saúde",
        endereco: "Centro de Saúde, Centro, Padre Marcos - PI",
        telefone: "(89) 98116-0296",
        email: "saude@padremarcos.pi.gov.br",
        horario: "Segunda a sexta, das 07h às 12h",
    },
    {
        nome: "Secretaria Municipal de Educação",
        endereco: "Rua Anfrísio Macedo, Centro, Padre Marcos - PI",
        telefone: "(89) 98116-0296",
        email: "educacao@padremarcos.pi.gov.br",
        horario: "Segunda a sexta, das 07h às 12h",
    },
    {
        nome: "CRAS",
        endereco: "Rua Anfrísio Macedo, Centro, Padre Marcos - PI",
        telefone: "(89) 98116-0296",
        email: "assistenciasocial@padremarcos.pi.gov.br",
        horario: "Segunda a sexta, das 07h às 12h",
    },
];

export default function ContatosPage() {
    return (
        <ContentPage
            title="Contatos e Atendimento"
            breadcrumb={[
                { label: "Início", href: "/" },
                { label: "Contatos e Atendimento" },
            ]}
            responsavel="Secretaria Municipal de Administração"
            lastUpdate="30/04/2026"
        >

            {/* INTRODUÇÃO */}
            <section className="mb-10">
                <p className="text-gray-700 leading-relaxed">
                    Nesta seção são disponibilizadas as informações de contato e os horários
                    de atendimento das unidades administrativas da Prefeitura Municipal.
                </p>
            </section>

            {/* UNIDADES */}
            <h2 className="text-xl font-bold text-[#173572] mb-6">Unidades de Atendimento</h2>
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

                {unidades.map((u, idx) => (
                    <div
                        key={idx}
                        className="bg-white border rounded-lg p-4 shadow-sm"
                    >
                        <h3 className="font-semibold text-gray-900">
                            {u.nome}
                        </h3>

                        <div className="text-sm text-gray-600 mt-3 space-y-1">

                            <p>
                                <strong>Endereço:</strong><br />
                                {u.endereco}
                            </p>

                            <p>
                                <strong>Telefone:</strong><br />
                                {u.telefone}
                            </p>

                            <p>
                                <strong>E-mail:</strong><br />
                                <a href={`mailto:${u.email}`} className="text-blue-600 hover:underline">
                                    {u.email}
                                </a>
                            </p>

                            <p className="mt-2">
                                <strong>Horário de atendimento:</strong><br />
                                {u.horario}
                            </p>

                        </div>
                    </div>
                ))}

            </section>

            {/* OBSERVAÇÃO */}
            <section className="mt-10 bg-gray-50 border rounded-lg p-4">
                <p className="text-sm text-gray-600">
                    <strong>Observação:</strong> Os horários de atendimento podem sofrer alterações
                    conforme necessidade administrativa.
                </p>
            </section>

        </ContentPage>
    );
}
