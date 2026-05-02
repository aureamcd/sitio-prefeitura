"use client";

import ContentPage from "@/components/layout/ContentPage";
import Link from "next/link";
import {
    Globe,
    BookOpen,
    Briefcase,
    Search,
    ArrowRight
} from "lucide-react";

const categoriasServicos = [
    {
        titulo: "Carta de Serviços",
        descricao: "Guia completo com todos os serviços oferecidos, documentos necessários e prazos.",
        href: "/servicos/carta",
        Icon: BookOpen,
        color: "bg-blue-600",
    },
    {
        titulo: "Serviços Online",
        descricao: "Acesse sistemas e resolva suas demandas sem sair de casa.",
        href: "/servicos/online",
        Icon: Globe,
        color: "bg-green-600",
    },
    {
        titulo: "Concursos e Seletivos",
        descricao: "Acompanhe editais de concursos públicos e processos seletivos simplificados.",
        href: "/servicos/concursos-e-processos",
        Icon: Briefcase,
        color: "bg-amber-600",
    },
];

export default function TodosServicosPage() {
    return (
        <ContentPage
            title="Central de Serviços ao Cidadão"
            description="Encontre aqui todos os canais de atendimento e serviços digitais da Prefeitura Municipal."
            breadcrumb={[
                { label: "Início", href: "/" },
                { label: "Serviços" },
            ]}
            lastUpdate="30/04/2026"
            responsavel="Prefeitura Municipal"
            showSearch={false}
        >

            <section className="mb-12">
                <p className="text-gray-700 leading-relaxed text-lg">
                    Bem-vindo à Central de Serviços. Nosso objetivo é facilitar o seu acesso às informações e
                    atendimentos da administração pública municipal. Escolha uma categoria abaixo para continuar.
                </p>
            </section>

            <div className="grid gap-6 md:grid-cols-3">
                {categoriasServicos.map((cat) => (
                    <Link
                        key={cat.titulo}
                        href={cat.href}
                        className="group relative bg-white border border-gray-200 rounded-3xl p-8 shadow-sm hover:shadow-xl hover:border-transparent transition-all overflow-hidden"
                    >
                        {/* Background Decorativo */}
                        <div className={`absolute top-0 right-0 w-24 h-24 ${cat.color} opacity-[0.03] rounded-bl-full transition-all group-hover:opacity-[0.08] group-hover:scale-150`} />

                        <div className={`w-14 h-14 ${cat.color} text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                            <cat.Icon size={28} />
                        </div>

                        <h2 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-700 transition-colors">
                            {cat.titulo}
                        </h2>

                        <p className="text-gray-600 text-sm leading-relaxed mb-6">
                            {cat.descricao}
                        </p>

                        <div className="flex items-center gap-2 text-sm font-bold text-gray-400 group-hover:text-blue-600 transition-colors mt-auto">
                            Acessar agora
                            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </div>
                    </Link>
                ))}
            </div>

            <section className="mt-16 bg-gray-50 border border-dashed border-gray-300 rounded-3xl p-8 text-center">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Ainda tem dúvidas?</h3>
                <p className="text-gray-600 mb-6">
                    Nossa equipe está pronta para ajudar você por meio dos canais oficiais.
                </p>
                <Link
                    href="/info-institucional/contatos-atendimento"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-gray-300 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-100 transition-all shadow-sm"
                >
                    Ver contatos e horários
                </Link>
            </section>

        </ContentPage>
    );
}
