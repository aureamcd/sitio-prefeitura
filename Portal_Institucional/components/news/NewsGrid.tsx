import { createClient } from "@supabase/supabase-js";
import NewsCard from "./NewsCard";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

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
    imagem_posicao?: string;
};

export default async function NewsGrid() {
    const { data } = await supabase
        .from("noticias")
        .select("id, titulo, resumo, imagem, slug, data, destaque, imagem_posicao")
        .eq("status", "publicado")
        .order("data", { ascending: false })
        .range(4, 23); // Pula as 4 do destaque, pega até 20 seguintes

    const noticias = data || [];

    if (noticias.length === 0) return null;

    return (
        <section className="bg-gray-50 py-16 border-t border-gray-100">
            <div className="max-w-7xl mx-auto px-4 md:px-6">
                <div className="flex items-center justify-between mb-10">
                    <div>
                        <span className="text-xs font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-4 py-1.5 rounded-full border border-blue-100">
                            Fique por dentro
                        </span>
                        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight mt-3">
                            Mais Notícias
                        </h2>
                    </div>
                    <Link
                        href="/noticias"
                        className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-gray-200 text-gray-700 font-bold rounded-xl hover:border-blue-600 hover:text-blue-600 hover:shadow-md transition-all duration-300 text-sm"
                    >
                        Ver todas
                        <ArrowRight size={16} />
                    </Link>
                </div>

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 items-stretch">
                    {noticias.map((n) => (
                        <NewsCard key={n.id} {...n} />
                    ))}
                </div>

                <div className="mt-10 text-center sm:hidden">
                    <Link
                        href="/noticias"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 font-bold rounded-xl hover:border-blue-600 hover:text-blue-600 transition-all duration-300"
                    >
                        Ver todas as notícias
                        <ArrowRight size={16} />
                    </Link>
                </div>
            </div>
        </section>
    );
}