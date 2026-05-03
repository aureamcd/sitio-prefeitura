import { createClient } from "@supabase/supabase-js";
import ContentPage from "@/components/layout/ContentPage";
import NewsCard from "@/components/news/NewsCard";
import { LayoutGrid, List, FilterX } from "lucide-react";
import Link from "next/link";
import NewsFilters from "@/components/news/NewsFilters";

export const revalidate = 60;

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const ITEMS_PER_PAGE = 9;

function optimizeImage(url: string | undefined) {
    if (!url) return "/placeholder.jpg";
    if (url.includes("cidadesnanet.com")) {
        return url.replace(/-\d+x\d+(?=\.\w+$)/, "");
    }
    return url;
}

export default async function NoticiasPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const filters = await searchParams;
    const categoria = (filters.categoria as string) || "";
    const periodo = (filters.periodo as string) || "";
    const view = (filters.view as "grid" | "list") || "grid";
    const page = Number(filters.page) || 1;

    // 1. Busca no Supabase
    let query = supabase
        .from("noticias")
        .select("id, titulo, resumo, imagem, slug, data, destaque, imagem_posicao")
        .eq("status", "publicado")
        .order("data", { ascending: false });

    if (categoria) {
        query = query.contains("destaque", [categoria]);
    }

    const { data: rawData } = await query;
    const todasNoticias = rawData || [];

    // 2. Filtro de período
    const filtradas = todasNoticias.filter((n) => {
        if (!periodo) return true;
        const dias = Number(periodo);
        const dataNoticia = new Date(n.data);
        const limite = new Date();
        limite.setDate(limite.getDate() - dias);
        return dataNoticia >= limite;
    });

    // 3. Paginação
    const totalPages = Math.ceil(filtradas.length / ITEMS_PER_PAGE);
    const paginadas = filtradas.slice(
        (page - 1) * ITEMS_PER_PAGE,
        page * ITEMS_PER_PAGE
    );

    return (
        <ContentPage
            title="Notícias"
            description="Fique por dentro de tudo o que acontece em nosso município."
            breadcrumb={[{ label: "Início", href: "/" }, { label: "Notícias" }]}
        >
            <div className="space-y-8">
                
                {/* 🛠 BARRA DE FILTROS (COMPONENTIZADA PARA USAR SELECT) */}
                <NewsFilters 
                    categoria={categoria} 
                    periodo={periodo} 
                    view={view} 
                />

                {/* 📰 LISTA DE NOTÍCIAS */}
                {paginadas.length > 0 ? (
                    <div
                        className={
                            view === "grid"
                                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                                : "flex flex-col gap-4"
                        }
                    >
                        {paginadas.map((noticia) => (
                            <NewsCard
                                key={noticia.id}
                                {...noticia}
                                imagem={optimizeImage(noticia.imagem)}
                                variant={view}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                        <FilterX size={48} className="mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">Nenhuma notícia encontrada</h3>
                        <p className="text-gray-500">Tente ajustar seus filtros para encontrar o que procura.</p>
                        <Link href="/noticias" className="mt-4 inline-block text-blue-600 font-medium">
                            Limpar todos os filtros
                        </Link>
                    </div>
                )}

                {/* 📄 PAGINAÇÃO */}
                {totalPages > 1 && (
                    <div className="flex justify-center gap-2 pt-8">
                        {Array.from({ length: totalPages }).map((_, i) => {
                            const p = i + 1;
                            const active = p === page;
                            return (
                                <Link
                                    key={p}
                                    href={`/noticias?categoria=${categoria}&periodo=${periodo}&view=${view}&page=${p}`}
                                    className={`w-10 h-10 flex items-center justify-center rounded-xl font-medium transition ${
                                        active
                                            ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                                            : "bg-white border hover:border-blue-400 text-gray-600"
                                    }`}
                                >
                                    {p}
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </ContentPage>
    );
}