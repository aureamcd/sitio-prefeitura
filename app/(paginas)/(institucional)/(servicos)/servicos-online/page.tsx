"use client";

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
    LucideIcon
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
        link: "http://picontreina2.dcfiorilli.com.br:8084/issweb/home.jsf",
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
    return (
        <ContentPage
            title="Serviços Online"
            description="Acesse os serviços públicos municipais disponíveis de forma digital, sem necessidade de deslocamento."
            breadcrumb={[
                { label: "Início", href: "/" },
                { label: "Serviços", href: "/servicos/todos" },
                { label: "Serviços Online" },
            ]}
            lastUpdate="2026-05-04"
            responsavel="Prefeitura Municipal"
            showSearch={false}
        >

            {/* INTRO */}
            <section className="mb-10 space-y-4">
                <p className="text-gray-700 leading-relaxed">
                    Nesta seção, o cidadão pode acessar serviços públicos municipais de forma totalmente digital,
                    proporcionando mais agilidade, comodidade e transparência no atendimento.
                </p>

                <p className="text-gray-700 leading-relaxed">
                    Os serviços online permitem que diversas demandas sejam resolvidas sem a necessidade de
                    comparecimento presencial à sede da Prefeitura.
                </p>
            </section>

            {/* LISTA AGRUPADA POR CATEGORIA */}
            <div className="space-y-12">
                {categorias.map((cat) => (
                    <section key={cat}>
                        <div className="flex items-center gap-3 mb-6 border-l-4 border-[#173572] pl-4">
                            <h2 className="text-xl font-bold text-gray-900 uppercase tracking-tight">
                                {cat}
                            </h2>
                        </div>

                        <div className="grid gap-6 sm:grid-cols-2">
                            {servicosOnline
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
                <div className="p-3 bg-white rounded-full text-[#173572] shadow-sm">
                    <Globe size={24} />
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
                    <strong>Não encontrou o que procurava?</strong> Caso o serviço desejado não esteja disponível online,
                    consulte a nossa <a href="/servicos/carta" className="text-blue-600 font-bold hover:underline">Carta de Serviços</a> ou
                    utilize os canais oficiais da Ouvidoria Municipal.
                </p>
            </section>

        </ContentPage>
    );
}