import { createClient } from "@supabase/supabase-js";
import ContentPage from "@/components/layout/ContentPage";
import PageActions from "@/components/ui/PageActions";
import Link from "next/link";
import {
    Calendar,
    Clock,
    User,
    ExternalLink,
    ArrowLeft,
} from "lucide-react";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/* helpers */

function formatarData(data: string) {
    return new Date(data).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    });
}

function estimarLeitura(conteudo: string) {
    const palavras = conteudo.replace(/<[^>]*>/g, "").split(/\s+/).length;
    return `${Math.max(1, Math.ceil(palavras / 200))} min de leitura`;
}

/* page */

export default async function NoticiaPage({ params }: any) {
    const { slug } = await params;

    const { data } = await supabase
        .from("noticias")
        .select("*")
        .eq("slug", slug)
        .eq("status", "publicado")
        .single();

    if (!data) {
        return (
            <ContentPage title="Notícia não encontrada">
                <div className="text-center py-20">
                    <p className="text-gray-500 mb-4">
                        A notícia não está disponível.
                    </p>

                    <Link
                        href="/noticias"
                        className="text-blue-600 hover:underline"
                    >
                        ← Voltar para notícias
                    </Link>
                </div>
            </ContentPage>
        );
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
                    <article className="p-6 sm:p-8 md:p-12 space-y-8">
                        {/* CATEGORIAS (BADGES) */}
                        {data.destaque && (
                            <div className="flex flex-wrap gap-2">
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

                        {/* META */}
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                                <Calendar size={14} />
                                {formatarData(data.data)}
                            </span>

                            <span className="flex items-center gap-1">
                                <Clock size={14} />
                                {tempoLeitura}
                            </span>

                            {data.fonte && (
                                <span className="flex items-center gap-1">
                                    <User size={14} />
                                    {data.fonte}
                                </span>
                            )}
                        </div>

                        {/* TÍTULO */}
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
                            {data.titulo}
                        </h1>

                        {/* RESUMO */}
                        {data.resumo && (
                            <p className="text-lg text-gray-600 leading-relaxed border-l-4 border-blue-500 pl-4">
                                {data.resumo}
                            </p>
                        )}

                        {/* TEXTO */}
                        <div
                            className="
                prose prose-lg max-w-none
                prose-headings:text-gray-900
                prose-p:text-gray-700
                prose-a:text-blue-600 hover:prose-a:underline
              "
                            dangerouslySetInnerHTML={{
                                __html: data.conteudo || "",
                            }}
                        />

                        {/* RODAPÉ */}
                        <div className="pt-6 border-t flex flex-wrap justify-between gap-4">

                            {data.link_original && (
                                <a
                                    href={data.link_original}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline"
                                >
                                    Ver original
                                    <ExternalLink size={14} />
                                </a>
                            )}

                            <Link
                                href="/noticias"
                                className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600"
                            >
                                <ArrowLeft size={14} />
                                Voltar
                            </Link>
                        </div>

                    </article>
                </div>

            </div>
        </ContentPage>
    );
}