import { createClient } from "@supabase/supabase-js";
import Image from "next/image";
import Link from "next/link";
import { Calendar, ArrowRight } from "lucide-react";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Noticia = {
    id: string;
    titulo: string;
    resumo: string;
    imagem?: string;
    slug: string;
    data: string;
    destaque?: string | string[];
};

function formatDate(data: string) {
    return new Date(data).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

function optimizeImage(url: string | undefined) {
    if (!url) return "/placeholder.jpg";
    if (url.includes("cidadesnanet.com")) {
        return url.replace(/-\d+x\d+(?=\.\w+$)/, "");
    }
    return url;
}

export default async function HomeNewsSection() {
    const { data } = await supabase
        .from("noticias")
        .select("id, titulo, resumo, imagem, slug, data, destaque")
        .eq("status", "publicado")
        .order("data", { ascending: false })
        .limit(4);
        
    const noticias = data || [];

    if (noticias.length === 0) {
        return (
            <section className="bg-white py-16 border-t border-gray-100">
                <div className="max-w-7xl mx-auto px-4 md:px-6 text-center text-gray-500">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Últimas Notícias</h2>
                    <p>Nenhuma notícia publicada no momento.</p>
                </div>
            </section>
        );
    }

    const mainNews = noticias[0];
    const secondaryNews = noticias.slice(1, 4);

    return (
        <section className="bg-white py-16 border-t border-gray-100">
            <div className="max-w-7xl mx-auto px-4 md:px-6">
                {/* Cabeçalho */}
                <div className="mb-10 text-center md:text-left">
                    <span className="text-xs font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-4 py-1.5 rounded-full border border-blue-100">
                        Comunicação Institucional
                    </span>
                    <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight mt-4">
                        Últimas Notícias
                    </h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Destaque Principal (Esquerda - 2 colunas) */}
                    <div className="lg:col-span-2 h-full">
                        <Link href={`/noticias/${mainNews.slug}`} className="group block relative rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 bg-gray-100 h-full min-h-[300px] md:min-h-[400px]">
                            <div className="absolute inset-0 w-full h-full">
                                <Image
                                    src={optimizeImage(mainNews.imagem)}
                                    alt={mainNews.titulo}
                                    fill
                                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                                    sizes="(max-width: 1024px) 100vw, 66vw"
                                    priority
                                />
                                {/* Overlay Escuro Suave para garantir leitura */}
                                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/40 to-transparent" />
                            </div>

                            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 flex flex-col justify-end h-full">
                                <div className="flex items-center gap-3 mb-3">
                                    <span className="inline-flex items-center gap-1.5 bg-blue-600 text-white text-[10px] md:text-xs font-bold uppercase tracking-wider px-3 py-1 md:py-1.5 rounded shadow-sm">
                                        <Calendar size={14} />
                                        {formatDate(mainNews.data)}
                                    </span>
                                </div>
                                <h3 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-white leading-tight drop-shadow-md group-hover:text-blue-50 transition-colors">
                                    {mainNews.titulo}
                                </h3>
                            </div>
                        </Link>
                    </div>

                    {/* Notícias Secundárias (Direita - 1 coluna - Lista) */}
                    <div className="flex flex-col gap-4">
                        {secondaryNews.map((noticia) => (
                            <Link
                                key={noticia.id}
                                href={`/noticias/${noticia.slug}`}
                                className="group flex items-start gap-4 bg-white border border-gray-100 rounded-2xl p-3 hover:border-blue-200 hover:shadow-lg transition-all duration-300"
                            >
                                {/* Thumbnail */}
                                <div className="relative w-20 h-20 md:w-24 md:h-20 shrink-0 rounded-xl overflow-hidden bg-gray-100">
                                    <Image
                                        src={optimizeImage(noticia.imagem)}
                                        alt={noticia.titulo}
                                        fill
                                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                                        sizes="96px"
                                    />
                                </div>
                                {/* Texto */}
                                <div className="flex-1 min-w-0 pt-0.5">
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                                        <Calendar size={11} />
                                        {formatDate(noticia.data)}
                                    </span>
                                    <h4 className="text-sm font-bold text-gray-900 leading-snug group-hover:text-blue-600 transition-colors line-clamp-2">
                                        {noticia.titulo}
                                    </h4>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Botão Ver Mais */}
                <div className="mt-12 text-center md:text-left flex justify-center">
                    <Link
                        href="/noticias"
                        className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white border-2 border-gray-200 text-gray-700 font-bold rounded-xl hover:border-blue-600 hover:text-blue-600 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
                    >
                        Ver mais notícias
                        <ArrowRight size={18} />
                    </Link>
                </div>
            </div>
        </section>
    );
}
