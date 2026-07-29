"use client";

import { useState, useMemo } from "react";
import ContentPage from "@/components/layout/ContentPage";
import {
    ExternalLink,
    Globe,
    Receipt,
    FileCheck,
    Landmark,
    IdCard,
    Banknote,
    HeartPulse,
    Building2,
    User,
    LucideIcon,
    Search
} from "lucide-react";

/* =========================
   TIPOS E DADOS
========================= */
type ServicoOnline = {
    nome: string;
    descricao: string;
    link: string;
    Icon: LucideIcon;
    categoria: string;
};

const servicosOnline: ServicoOnline[] = [
    // TRIBUTÁRIOS E EMPRESAS
    {
        nome: "Emissão de Nota Fiscal Eletrônica",
        descricao: "Emissão e consulta de notas fiscais eletrônicas de serviço (NFS-e).",
        link: "https://picontreina2.dcfiorilli.com.br:8447/issweb/home",
        Icon: Receipt,
        categoria: "Tributário e Empresas",
    },
    {
        nome: "Portal do Contribuinte",
        descricao: "Acesso a débitos, guias de pagamento e serviços fiscais diversos.",
        link: "http://picontreina2.dcfiorilli.com.br:8084/issweb/home.jsf",
        Icon: Landmark,
        categoria: "Tributário e Empresas",
    },
    {
        nome: "Certidão Negativa",
        descricao: "Emissão de Certidões Negativas de Débitos (CND) municipais.",
        link: "http://picontreina2.dcfiorilli.com.br:8084/servicosweb/home.jsf",
        Icon: FileCheck,
        categoria: "Tributário e Empresas",
    },

    // SERVIDOR PÚBLICO
    {
        nome: "Portal do Servidor",
        descricao: "Acesso a informações funcionais e documentos do servidor.",
        link: "https://picontreina2.dcfiorilli.com.br:8447/sipweb/",
        Icon: IdCard,
        categoria: "Servidor Público",
    },
    {
        nome: "Contracheque Online",
        descricao: "Consulta e emissão de holerites e comprovantes de rendimentos.",
        link: "https://picontreina2.dcfiorilli.com.br:8447/sipweb/",
        Icon: Banknote,
        categoria: "Servidor Público",
    },

    // SAÚDE E OUTROS
    {
        nome: "e-SUS Saúde",
        descricao: "Prontuário eletrônico e gestão da atenção básica de saúde.",
        link: "https://esus.padremarcos.pi.gov.br/",
        Icon: HeartPulse,
        categoria: "Saúde",
    },
];

// Agrupamento por categoria
const categorias = Array.from(new Set(servicosOnline.map(s => s.categoria)));

/* =========================
   PÁGINA
========================= */
export default function ServicosOnlinePage() {
    const [busca, setBusca] = useState("");

    const servicosFiltrados = useMemo(() => {
        const termo = busca.toLowerCase();
        if (!termo) return servicosOnline;
        return servicosOnline.filter(
            (s) =>
                s.nome.toLowerCase().includes(termo) ||
                s.descricao.toLowerCase().includes(termo)
        );
    }, [busca]);

    // Recalcula as categorias apenas com os serviços que restaram após o filtro
    const categoriasFiltradas = Array.from(new Set(servicosFiltrados.map(s => s.categoria)));

    return (
        <ContentPage
            title="Serviços Online"
            description="Acesse os serviços públicos digitais e serviços municipais online. Um canal de atendimento eletrônico para resolver suas demandas sem sair de casa."
            breadcrumb={[
                { label: "Início", href: "/" },
                { label: "Serviços", href: "/servicos/todos" },
                { label: "Serviços Online" },
            ]}
            lastUpdate="2026-05-04"
            showSearch={false}
        >

            {/* INTRO */}
            <section className="mb-10 space-y-4">
                <p className="text-gray-700 leading-relaxed">
                    Nesta seção, o cidadão pode acessar <strong>serviços públicos digitais</strong> e resolver demandas de forma rápida através do nosso <strong>atendimento eletrônico</strong>. O objetivo é proporcionar mais agilidade, comodidade e transparência.
                </p>

                <p className="text-gray-700 leading-relaxed">
                    A oferta de <strong>serviços municipais online</strong> permite que diversas solicitações, emissões de guias e consultas sejam realizadas sem a necessidade de comparecimento presencial à sede da Prefeitura.
                </p>
            </section>

            {/* BARRA DE BUSCA */}
            <section className="mb-8 max-w-xl">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#173572]/30 focus:border-[#173572] transition shadow-sm"
                        placeholder="Buscar por serviço ou palavra-chave..."
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                    />
                </div>
            </section>

            {/* LISTA AGRUPADA POR CATEGORIA */}
            <div className="space-y-12">
                {categoriasFiltradas.length === 0 && (
                    <div className="text-center py-16 bg-gray-50 rounded-2xl border border-gray-100">
                        <p className="text-gray-500 font-medium text-lg">Nenhum serviço encontrado para "{busca}"</p>
                    </div>
                )}
                {categoriasFiltradas.map((cat) => (
                    <section key={cat} aria-labelledby={`categoria-${cat.replace(/\s+/g, '-').toLowerCase()}`}>
                        <div className="flex items-center gap-3 mb-6 border-l-4 border-[#173572] pl-4">
                            <h2 id={`categoria-${cat.replace(/\s+/g, '-').toLowerCase()}`} className="text-xl font-bold text-gray-900 uppercase tracking-tight">
                                {cat}
                            </h2>
                        </div>

                        <div className="grid gap-6 sm:grid-cols-2">
                            {servicosFiltrados
                                .filter((s) => s.categoria === cat)
                                .map((servico, index) => (
                                    <div
                                        key={index}
                                        className="group border border-gray-200 rounded-2xl p-6 bg-white shadow-sm hover:shadow-md hover:border-blue-200 transition-all flex flex-col justify-between"
                                    >
                                        <div>
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="p-3 bg-blue-50 rounded-xl text-[#173572] group-hover:bg-[#173572] group-hover:text-white transition-colors">
                                                    <servico.Icon size={24} />
                                                </div>
                                                <Globe size={16} className="text-gray-300" />
                                            </div>

                                            <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#173572] transition-colors mb-2">
                                                {servico.nome}
                                            </h3>

                                            <p className="text-sm text-gray-600 leading-relaxed">
                                                {servico.descricao}
                                            </p>
                                        </div>

                                        <div className="mt-6">
                                            <a
                                                href={servico.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex w-full items-center justify-center gap-2 px-4 py-2.5 bg-[#173572] text-white rounded-xl text-sm font-semibold hover:bg-[#0f2847] shadow-sm hover:shadow transition-all active:scale-[0.98]"
                                                aria-label={`Acessar ${servico.nome} (abre em nova aba)`}
                                            >
                                                Acessar serviço
                                                <ExternalLink size={16} />
                                            </a>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </section>
                ))}
            </div>

            {/* OBSERVAÇÃO NÍVEL OURO */}
            <section className="mt-16 p-6 bg-blue-50 border border-blue-100 rounded-2xl flex flex-col sm:flex-row items-center gap-4">
                <div className="p-3 bg-white rounded-full text-[#173572] shadow-sm shrink-0">
                    <Globe size={24} />
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
                    <strong>Não encontrou o que procurava?</strong> Caso o serviço desejado não esteja disponível em formato digital,
                    consulte a <a href="/servicos/carta" className="text-blue-600 font-bold hover:underline">Carta de Serviços ao Usuário</a> ou
                    entre em contato pelos canais oficiais da Prefeitura Municipal.
                </p>
            </section>

        </ContentPage>
    );
}
