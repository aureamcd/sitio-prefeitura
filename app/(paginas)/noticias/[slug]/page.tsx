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

                <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">


                    {/* IMAGEM DENTRO DO CARD */}
                    {data.imagem && (
                        <div className="w-full h-[220px] sm:h-[320px] md:h-[420px] bg-gray-100 overflow-hidden">
                            <img
                                src={data.imagem}
                                alt={data.titulo}
                                className={`w-full h-full object-cover ${
                                    data.imagem_posicao === "cover_top"
                                        ? "object-top"
                                        : data.imagem_posicao === "cover_face"
                                        ? "object-center"
                                        : "object-center"
                                }`}
                            />
                        </div>
                    )}

                    {/* CONTEÚDO */}
                    <article className="p-6 sm:p-8 md:p-10 space-y-6">

                        {/* CATEGORIAS (BADGES) */}
                        {data.destaque && (
                            <div className="flex flex-wrap gap-2">
                                {(Array.isArray(data.destaque) ? data.destaque : [data.destaque]).map((cat: string) => {
                                    // Cores simplificadas para o detalhe
                                    const colors: Record<string, string> = {
                                        saude: "bg-green-100 text-green-700",
                                        educacao: "bg-blue-100 text-blue-700",
                                        obras: "bg-orange-100 text-orange-700",
                                        assistencia: "bg-purple-100 text-purple-700",
                                        esporte: "bg-red-100 text-red-700",
                                    };
                                    const labels: Record<string, string> = {
                                        saude: "Saúde",
                                        educacao: "Educação",
                                        obras: "Obras",
                                        assistencia: "Social",
                                        esporte: "Esporte",
                                    };
                                    return (
                                        <span key={cat} className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${colors[cat] || "bg-gray-100 text-gray-600"}`}>
                                            {labels[cat] || cat}
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