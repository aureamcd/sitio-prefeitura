"use client";

import ContentPage from "@/components/layout/ContentPage";

export default function AcessibilidadePage() {
    return (
        <ContentPage
            title="Acessibilidade"
            description="Este portal segue diretrizes de acessibilidade para garantir que todas as pessoas possam acessar as informações públicas de forma igualitária."
            breadcrumb={[
                { label: "Início", href: "/" },
                { label: "Acessibilidade" },
            ]}
            lastUpdate="2026-04-07"
            responsavel="Prefeitura Municipal"
        >
            {/* INTRODUÇÃO */}
            <section className="space-y-4">
                <p>
                    O Portal da Transparência do Município foi desenvolvido com o objetivo
                    de garantir o acesso à informação a todos os cidadãos, seguindo boas
                    práticas de acessibilidade digital.
                </p>

                <p>
                    Este portal busca atender às recomendações das Diretrizes de
                    Acessibilidade para Conteúdo Web (WCAG) e do Modelo de Acessibilidade
                    em Governo Eletrônico (eMAG).
                </p>
            </section>

            {/* RECURSOS DE ACESSIBILIDADE */}
            <section className="mt-8 space-y-4">
                <h2 className="text-xl font-semibold text-[#173572]">
                    Recursos de acessibilidade disponíveis
                </h2>

                <ul className="list-disc pl-5 space-y-2">
                    <li>Ajuste de tamanho da fonte (A+, A- e padrão)</li>
                    <li>Modo de alto contraste</li>
                    <li>Navegação completa por teclado</li>
                    <li>Links de atalho para conteúdo e menu</li>
                    <li>Compatibilidade com leitores de tela</li>
                </ul>
            </section>

            {/* ATALHOS DE TECLADO */}
            <section className="mt-8 space-y-4">
                <h2 className="text-xl font-semibold text-[#173572]">
                    Atalhos de teclado
                </h2>

                <p>
                    O portal oferece atalhos de teclado para facilitar a navegação:
                </p>

                <ul className="list-disc pl-5 space-y-2">
                    <li>
                        <strong>Alt + 1</strong> → Ir para o conteúdo principal
                    </li>
                    <li>
                        <strong>Alt + 2</strong> → Ir para o menu principal
                    </li>
                    <li>
                        <strong>Alt + 3</strong> → Ir para a busca
                    </li>
                </ul>

                <p className="text-sm text-gray-600">
                    Em alguns navegadores, pode ser necessário usar combinações como
                    Alt + Shift + número.
                </p>
            </section>

            {/* VLibras */}
            <section className="mt-8 space-y-4">
                <h2 className="text-xl font-semibold text-[#173572]">
                    Tradução para Libras
                </h2>

                <p>
                    Este portal conta com o recurso de tradução automática para a Língua
                    Brasileira de Sinais (Libras) por meio do VLibras.
                </p>

                <p>
                    O VLibras é uma ferramenta desenvolvida pelo Governo Federal que
                    permite a tradução de conteúdos digitais para Libras, ampliando o
                    acesso para pessoas surdas.
                </p>
            </section>

            {/* COMPATIBILIDADE */}
            <section className="mt-8 space-y-4">
                <h2 className="text-xl font-semibold text-[#173572]">
                    Compatibilidade
                </h2>

                <p>
                    Este portal foi desenvolvido para ser compatível com os principais
                    navegadores modernos, incluindo:
                </p>

                <ul className="list-disc pl-5 space-y-2">
                    <li>Google Chrome</li>
                    <li>Mozilla Firefox</li>
                    <li>Microsoft Edge</li>
                    <li>Safari</li>
                </ul>
            </section>

            {/* CONTATO */}
            <section className="mt-8 space-y-4">
                <h2 className="text-xl font-semibold text-[#173572]">
                    Fale sobre acessibilidade
                </h2>

                <p>
                    Caso encontre dificuldades de acesso ou tenha sugestões de melhoria,
                    entre em contato com a Prefeitura.
                </p>

                <p>
                    Seu feedback é essencial para que possamos melhorar continuamente a
                    acessibilidade do portal.
                </p>
            </section>
        </ContentPage>
    );
}