"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import ContentPage from "@/components/layout/ContentPage";
import NewsGrid from "@/components/news/NewsGrid";
import NewsCard from "@/components/news/NewsCard";
import { LayoutGrid, List } from "lucide-react";

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

const ITEMS_PER_PAGE = 9;

export default function NoticiasPage() {
    const [data, setData] = useState<Noticia[]>([]);
    const [categoria, setCategoria] = useState("");
    const [periodo, setPeriodo] = useState("");
    const [view, setView] = useState<"grid" | "list">("grid");
    const [page, setPage] = useState(1);

    useEffect(() => {
        async function fetchNoticias() {
            const { data } = await supabase
                .from("noticias")
                .select("*")
                .eq("status", "publicado")
                .order("data", { ascending: false });

            setData(data || []);
        }

        fetchNoticias();
    }, []);

    // 🎯 categorias (com cor ativa definida corretamente)
    const categorias = [
        {
            value: "",
            label: "Todas",
            base: "bg-gray-200 text-gray-800",
            active: "bg-blue-600 text-white",
        },
        {
            value: "saude",
            label: "Saúde",
            base: "bg-green-100 text-green-700",
            active: "bg-green-800 text-white",
        },
        {
            value: "educacao",
            label: "Educação",
            base: "bg-blue-100 text-blue-700",
            active: "bg-blue-600 text-white",
        },
        {
            value: "obras",
            label: "Obras",
            base: "bg-orange-100 text-orange-700",
            active: "bg-orange-700 text-white",
        },
        {
            value: "assistencia",
            label: "Social",
            base: "bg-purple-100 text-purple-700",
            active: "bg-purple-800 text-white",
        },
        {
            value: "esporte",
            label: "Esporte",
            base: "bg-red-100 text-red-700",
            active: "bg-red-800 text-white",
        },
    ];

    // 📅 períodos
    const periodos = [
        { value: "", label: "Todas" },
        { value: "7", label: "7 dias" },
        { value: "30", label: "30 dias" },
    ];

    // 🔍 filtro
    const filtradas = data.filter((n) => {
        const matchCategoria =
            !categoria || (n.destaque ?? []).includes(categoria);

        if (!periodo) return matchCategoria;

        const dias = Number(periodo);
        const dataNoticia = new Date(n.data);
        const limite = new Date();
        limite.setDate(limite.getDate() - dias);

        return matchCategoria && dataNoticia >= limite;
    });

    // 📄 paginação
    const totalPages = Math.ceil(filtradas.length / ITEMS_PER_PAGE);

    const paginated = filtradas.slice(
        (page - 1) * ITEMS_PER_PAGE,
        page * ITEMS_PER_PAGE
    );

    return (

        <ContentPage
            title="Notícias"
            description="Acompanhe as últimas notícias e ações do município."
        >
            <div className="space-y-6">

                {/* 🔘 FILTROS */}
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">

                    {/* Categorias */}
                    <div className="flex-1">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                            Categorias
                        </h3>

                        <div className="flex flex-wrap gap-2">
                            {categorias.map((cat) => {
                                const active = categoria === cat.value;

                                return (
                                    <button
                                        key={cat.value}
                                        onClick={() => {
                                            setCategoria(cat.value);
                                            setPage(1);
                                        }}
                                        className={`px-3 py-2 rounded-full text-sm font-medium transition-all duration-200
                      ${active ? cat.active : `${cat.base} hover:opacity-80`}
                    `}
                                    >
                                        {cat.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Período + Toggle */}
                    <div className="flex items-end gap-4">

                        {/* Período */}
                        <div>
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                Período
                            </h3>

                            <div className="flex gap-2">
                                {periodos.map((p) => (
                                    <button
                                        key={p.value}
                                        onClick={() => {
                                            setPeriodo(p.value);
                                            setPage(1);
                                        }}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                      ${periodo === p.value
                                                ? "bg-blue-600 text-white shadow"
                                                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                                            }
                    `}
                                    >
                                        {p.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Toggle */}
                        <div className="flex gap-2 mb-[2px]">
                            <button
                                onClick={() => setView("grid")}
                                className={`p-2 rounded transition
                  ${view === "grid"
                                        ? "bg-blue-600 text-white shadow"
                                        : "bg-gray-100 hover:bg-gray-200"
                                    }
                `}
                            >
                                <LayoutGrid size={18} />
                            </button>

                            <button
                                onClick={() => setView("list")}
                                className={`p-2 rounded transition
                  ${view === "list"
                                        ? "bg-blue-600 text-white shadow"
                                        : "bg-gray-100 hover:bg-gray-200"
                                    }
                `}
                            >
                                <List size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* 📰 CONTEÚDO */}
                {view === "grid" ? (
                    <NewsGrid noticias={paginated} />
                ) : (
                    <div className="space-y-4">
                        {paginated.map((n) => (
                            <NewsCard key={n.id} {...n} variant="list" />
                        ))}
                    </div>
                )}

                {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2 flex-wrap">

                        {/* anterior */}
                        <button
                            onClick={() => setPage((p) => Math.max(p - 1, 1))}
                            disabled={page === 1}
                            className="px-3 py-1 rounded-full bg-blue-200 "
                        >
                            ←
                        </button>

                        {/* páginas próximas */}
                        {Array.from({ length: totalPages })
                            .slice(Math.max(0, page - 3), page + 2)
                            .map((_, i) => {
                                const pageNumber = Math.max(1, page - 2) + i;

                                if (pageNumber > totalPages) return null;

                                return (
                                    <button
                                        key={pageNumber}
                                        onClick={() => setPage(pageNumber)}
                                        className={`px-3 py-1 rounded text-sm ${page === pageNumber
                                            ? "bg-blue-600 text-white"
                                            : "bg-gray-200"
                                            }`}
                                    >
                                        {pageNumber}
                                    </button>
                                );
                            })}

                        {/* próximo */}
                        <button
                            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                            disabled={page === totalPages}
                            className="px-3 py-1 rounded-full bg-blue-200 disabled:opacity-50 hover:bg-blue-600"
                        >
                            →
                        </button>

                    </div>
                )}

                {/* vazio */}
                {filtradas.length === 0 && (
                    <p className="text-center text-gray-500">
                        Nenhuma notícia encontrada.
                    </p>
                )}
            </div>
        </ContentPage>
    );
}