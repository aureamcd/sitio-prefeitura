import ContentPage from "@/components/layout/ContentPage";
import { FileText, ExternalLink } from "lucide-react";

export default function ESICPage() {
    return (
        <ContentPage
            title="Serviço de Informação ao Cidadão (e-SIC)"
            icon={<FileText size={20} strokeWidth={1.5} />}
            description="Canal oficial para solicitação de informações públicas, conforme a Lei de Acesso à Informação (LAI)."
            breadcrumb={[
                { label: "Início", href: "/" },
                { label: "e-SIC" },
            ]}
            lastUpdate="2026-04-30"
            responsavel="Prefeitura Municipal"
        >

            {/* INTRO */}
            <div className="mb-7">
                <p>
                    O Serviço de Informação ao Cidadão (SIC) permite que qualquer pessoa solicite
                    acesso a informações públicas produzidas ou custodiadas pela Prefeitura,
                    conforme a Lei nº 12.527/2011 (Lei de Acesso à Informação - LAI).
                </p>
            </div>

            {/* ⚠️ DIFERENÇA OUVIDORIA */}
            <div className="mb-7">
                <h2 className="text-lg font-medium text-[#173572] mb-2 border-b border-[#e8edf7] pb-1">
                    Diferença entre e-SIC e Ouvidoria
                </h2>

                <div className="bg-[#f8faff] border border-[#e5e7eb] border-l-[4px] border-l-[#173572] p-4 rounded-r-lg shadow-sm">
                    <p className="text-[#374151] mb-3">
                        O e-SIC é utilizado exclusivamente para solicitações de acesso a informações públicas.
                    </p>

                    <p className="text-[#173572] text-[15px] leading-relaxed">
                        Para manifestações como reclamações, denúncias, sugestões ou elogios,
                        utilize a <a href="/ouvidoria" className="font-bold underline decoration-2 underline-offset-2 hover:text-[#0f2847] transition-colors">Ouvidoria</a>.
                    </p>
                </div>
            </div>

            {/* 💻 SOLICITAÇÃO */}
            <div className="mb-7">
                <h2 className="text-lg font-medium text-[#173572] mb-2 border-b border-[#e8edf7] pb-1">
                    Solicitar informação
                </h2>

                <p className="mb-4">
                    Para registrar seu pedido de acesso à informação, utilize o sistema eletrônico oficial:
                </p>

                <p className="mb-4 text-sm text-gray-500">
                    Você será redirecionado diretamente para o formulário do sistema Fala.BR.
                </p>

                <a
                    href="https://falabr.cgu.gov.br/web/manifestacao/selecionarsubtipoformulario?tipo=8"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#173572] text-white rounded-lg hover:bg-[#0f2847] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#173572]"
                    aria-label="Registrar pedido de acesso à informação no sistema Fala.BR"
                >
                    Fazer pedido de informação
                    <ExternalLink size={16} aria-hidden="true" />
                </a>
            </div>

            {/* 📍 SIC FÍSICO */}
            <div className="mb-7">
                <h2 className="text-lg font-medium text-[#173572] mb-2 border-b border-[#e8edf7] pb-1">
                    Atendimento presencial
                </h2>

                <ul>
                    <li><strong>Unidade responsável:</strong> Serviço de Informação ao Cidadão</li>
                    <li><strong>Endereço:</strong> Rua Anfrísio Macedo, 150, Centro – CEP 64.680-000</li>
                    <li><strong>Telefone:</strong> (89) 98116-0296</li>
                    <li><strong>E-mail:</strong> pmpadremarcos@gmail.com</li>
                    <li><strong>Horário de funcionamento:</strong> Segunda a sexta, das 7h às 12h</li>
                </ul>
            </div>

            {/* 📘 ORIENTAÇÕES */}
            <div className="mb-7">
                <h2 className="text-lg font-medium text-[#173572] mb-2 border-b border-[#e8edf7] pb-1">
                    Como fazer um pedido
                </h2>

                <ul>
                    <li>Descreva de forma clara a informação desejada</li>
                    <li>Informe um meio de contato para resposta</li>
                    <li>Não é necessário justificar o pedido</li>
                </ul>

                <p className="mt-3">
                    O prazo para resposta aos pedidos de acesso à informação é de até <strong>20 dias</strong>,
                    podendo ser prorrogado por mais <strong>10 dias</strong>, conforme a Lei nº 12.527/2011.
                </p>

                <p className="mt-2">
                    Em caso de negativa de acesso, o cidadão poderá interpor recurso no prazo de até <strong>10 dias</strong>,
                    contado a partir da ciência da decisão.
                </p>

                <p className="mt-2">
                    O recurso será analisado pela autoridade hierarquicamente superior à que proferiu a decisão.
                </p>
            </div>

            {/* 📄 DOCUMENTOS LAI */}
            <div className="mb-7">
                <h2 className="text-lg font-medium text-[#173572] mb-2 border-b border-[#e8edf7] pb-1">
                    Informações e relatórios da LAI
                </h2>

                <ul>
                    <li>
                        <a href="/docs/regulamentacao-lai.pdf" className="text-[#173572] underline">
                            Regulamentação da LAI no município
                        </a>
                    </li>

                    <li>
                        <a href="/docs/relatorio-esic.pdf" className="text-[#173572] underline">
                            Relatório estatístico de pedidos
                        </a>
                    </li>

                    <li>
                        Nenhuma informação foi classificada com grau de sigilo no período.
                    </li>
                </ul>
            </div>

        </ContentPage>
    );
}