import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import ContentPage from "@/components/layout/ContentPage";
import { Calendar, Clock, User, Share2 } from "lucide-react";

// Forçar revalidação a cada 60 segundos
export const revalidate = 60;

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function formatarData(data: string) {
    return new Date(data).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    });
}

function estimarLeitura(texto: string) {
    const palavrasPorMinuto = 200;
    const palavras = texto.trim().split(/\s+/).length;
    const minutos = Math.ceil(palavras / palavrasPorMinuto);
    return `${minutos} min de leitura`;
}

function formatarConteudoNoticia(texto: string) {
    if (!texto) return "";
    
    // Se não tiver tags HTML de bloco (<p, <div, <h1, <br), é texto puro colado do admin
    const hasHtmlBlocks = /<(p|div|h1|h2|h3|h4|ul|ol|table|br|blockquote|section|article)[\s>]/i.test(texto);
    
    let processado = texto;
    if (!hasHtmlBlocks) {
        // Transforma blocos separados por quebras de linha em parágrafos <p>
        processado = texto
            .split(/\r?\n\r?\n/)
            .map((paragrafo) => {
                const pTrim = paragrafo.trim();
                if (!pTrim) return "";
                // Se o parágrafo for apenas uma URL de imagem
                if (/^https?:\/\/[^\s<>]+\.(?:png|jpg|jpeg|webp|gif)(?:\?[^\s<>]*)?$/i.test(pTrim)) {
                    return `<figure class="my-8"><img src="${pTrim}" alt="Imagem da Notícia" class="rounded-2xl shadow-lg w-full max-h-[550px] object-cover mx-auto" /></figure>`;
                }
                // Converte quebras simples internamente em <br />
                const comBr = pTrim.replace(/\r?\n/g, "<br />");
                return `<p class="mb-6 text-gray-700 leading-relaxed">${comBr}</p>`;
            })
            .join("\n");
    }

    // Converte automaticamente URLs de imagens soltas que ainda não estejam em tags img
    processado = processado.replace(
        /(^|\s|<br\s*\/?>|<p[^>]*>)(https?:\/\/[^\s<>"']+\.(?:png|jpg|jpeg|webp|gif)(?:\?[^\s<>"']*)?)(?=\s|<|$)/gi,
        (match, prefix, url) => {
            if (prefix.includes('src=') || prefix.includes('href=')) return match;
            return `${prefix}<figure class="my-8"><img src="${url}" alt="Imagem da Notícia" class="rounded-2xl shadow-lg w-full max-h-[550px] object-cover mx-auto" /></figure>`;
        }
    );

    return processado;
}

export default async function NoticiaPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;

    const { data, error } = await supabase
        .from("noticias")
        .select("*")
        .eq("slug", slug)
        .eq("status", "publicado")
        .single();

    if (error || !data) {
        notFound();
    }

    const tempoLeitura = estimarLeitura(data.conteudo || "");

    const mainCategory = Array.isArray(data.destaque) ? data.destaque[0] : data.destaque;
    const categoryColors: Record<string, string> = {
        saude: "bg-green-500",
        educacao: "bg-blue-500",
        obras: "bg-orange-500",
        assistencia: "bg-purple-500",
        esporte: "bg-red-500",
    };
    const categoryLabels: Record<string, string> = {
        saude: "Saúde",
        educacao: "Educação",
        obras: "Obras",
        assistencia: "Social",
        esporte: "Esporte",
    };
    const topBarColor = categoryColors[mainCategory] || "bg-gray-300";

    return (
        <ContentPage
            title=""
            description=""
            hideStripe={true}
            breadcrumb={[
                { label: "Início", href: "/" },
                { label: "Notícias", href: "/noticias" },
                { label: data.titulo },
            ]}
        >
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                    {/* Barra de destaque superior */}
                    <div className={`h-2.5 w-full ${topBarColor}`} />

                    {/* CONTEÚDO */}
                    <article className="p-6 sm:p-8 md:p-12 space-y-12">
                        {/* CATEGORIAS (BADGES) */}
                        {data.destaque && (
                            <div className="flex flex-wrap gap-2.5">
                                {(Array.isArray(data.destaque) ? data.destaque : [data.destaque]).map((cat: string) => {
                                    const badgeColors: Record<string, string> = {
                                        saude: "bg-green-50 text-green-700 border-green-100",
                                        educacao: "bg-blue-50 text-blue-700 border-blue-100",
                                        obras: "bg-orange-50 text-orange-700 border-orange-100",
                                        assistencia: "bg-purple-50 text-purple-700 border-purple-100",
                                        esporte: "bg-red-50 text-red-700 border-red-100",
                                    };
                                    return (
                                        <span key={cat} className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${badgeColors[cat] || "bg-gray-50 text-gray-600 border-gray-100"}`}>
                                            {categoryLabels[cat] || cat}
                                        </span>
                                    );
                                })}
                            </div>
                        )}

                        <div className="space-y-8">
                            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 leading-[1.15] tracking-tight">
                                {data.titulo}
                            </h1>

                            {/* META */}
                            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-semibold text-gray-500">
                                <span className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                                    <Calendar size={15} className="text-blue-500" />
                                    {formatarData(data.data)}
                                </span>

                                <span className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                                    <Clock size={15} className="text-blue-500" />
                                    {tempoLeitura}
                                </span>

                                {data.fonte && (
                                    <span className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                                        <User size={15} className="text-blue-500" />
                                        {data.fonte}
                                    </span>
                                )}
                            </div>

                            <p className="text-lg sm:text-xl text-gray-600 leading-relaxed font-medium italic border-l-4 border-blue-500/20 pl-5 py-2">
                                {data.resumo}
                            </p>
                        </div>

                        {/* CONTEÚDO PRINCIPAL (HTML) */}
                        <div
                            className="prose prose-blue prose-lg max-w-none 
                            prose-headings:font-bold prose-headings:text-gray-900
                            prose-p:text-gray-700 prose-p:leading-relaxed
                            prose-img:rounded-2xl prose-img:shadow-lg
                            prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline"
                            dangerouslySetInnerHTML={{ __html: formatarConteudoNoticia(data.conteudo || "") }}
                        />

                        {/* RODAPÉ DO ARTIGO */}
                        <div className="pt-10 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                            <div className="text-sm text-gray-400">
                                Publicado em {formatarData(data.data)}
                            </div>

                            <button className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-50 text-blue-700 font-bold rounded-xl hover:bg-blue-100 transition-colors">
                                <Share2 size={18} />
                                Compartilhar Notícia
                            </button>
                        </div>
                    </article>
                </div>

                {/* VOLTAR */}
                <div className="mt-8 text-center">
                    <a
                        href="/noticias"
                        className="inline-flex items-center gap-2 text-gray-500 hover:text-blue-600 font-medium transition"
                    >
                        ← Voltar para todas as notícias
                    </a>
                </div>
            </div>
        </ContentPage>
    );
}