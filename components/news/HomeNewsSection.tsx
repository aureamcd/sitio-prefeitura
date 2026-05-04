"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import Image from "next/image";
import Link from "next/link";
import { Calendar, ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";

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
    });
}

function optimizeImage(url: string | undefined) {
    if (!url) return "/placeholder.jpg";
    if (url.includes("cidadesnanet.com")) {
        return url.replace(/-\d+x\d+(?=\.\w+$)/, "");
    }
    return url;
}

export default function HomeNewsSection() {
    const [noticias, setNoticias] = useState<Noticia[]>([]);
    const [activeSlide, setActiveSlide] = useState(0);

    useEffect(() => {
        async function fetch() {
            const { data } = await supabase
                .from("noticias")
                .select("id, titulo, resumo, imagem, slug, data, destaque")
                .eq("status", "publicado")
                .order("data", { ascending: false })
                .limit(8);
            setNoticias(data || []);
        }
        fetch();
    }, []);

    const carousel = noticias.slice(0, 3);
    const sidebar = noticias.slice(3, 7);

    const next = useCallback(() => {
        setActiveSlide((prev) => (prev + 1) % carousel.length);
    }, [carousel.length]);

    const prev = useCallback(() => {
        setActiveSlide((prev) => (prev - 1 + carousel.length) % carousel.length);
    }, [carousel.length]);

    // Auto-play
    useEffect(() => {
        if (carousel.length === 0) return;
        const interval = setInterval(next, 6000);
        return () => clearInterval(interval);
    }, [next, carousel.length]);

    if (noticias.length === 0) return null;

    const current = carousel[activeSlide];

    return (
        <section className="bg-gray-50 py-12 md:py-16">
            <div className="max-w-7xl mx-auto px-4 md:px-6">
                {/* Header */}
                <div className="flex items-end justify-between mb-8">
                    <div>
                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Fique por dentro</span>
                        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight mt-1">
                            Últimas Notícias
                        </h2>
                    </div>
                    <Link
                        href="/noticias"
                        className="hidden md:flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-800 transition group"
                    >
                        Ver todas as notícias
                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* CARROSSEL (2 colunas) */}
                    {current && (
                        <div className="lg:col-span-2 relative group">
                            <Link href={`/noticias/${current.slug}`} className="block">
                                <div className="relative aspect-[16/9] rounded-2xl overflow-hidden shadow-xl">
                                    <Image
                                        src={optimizeImage(current.imagem)}
                                        alt={current.titulo}
                                        fill
                                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                                        sizes="(max-width: 1024px) 100vw, 66vw"
                                        priority
                                    />
                                    {/* Gradient overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                                    {/* Content */}
                                    <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 space-y-3">
                                        <span className="inline-block bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg">
                                            {formatDate(current.data)}
                                        </span>
                                        <h3 className="text-xl md:text-2xl lg:text-3xl font-extrabold text-white leading-tight drop-shadow-lg">
                                            {current.titulo}
                                        </h3>
                                        <p className="text-gray-200 text-sm md:text-base line-clamp-2 max-w-2xl">
                                            {current.resumo}
                                        </p>
                                    </div>
                                </div>
                            </Link>

                            {/* Controles */}
                            {carousel.length > 1 && (
                                <>
                                    <button
                                        onClick={(e) => { e.preventDefault(); prev(); }}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-white"
                                    >
                                        <ChevronLeft size={20} className="text-gray-800" />
                                    </button>
                                    <button
                                        onClick={(e) => { e.preventDefault(); next(); }}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-white"
                                    >
                                        <ChevronRight size={20} className="text-gray-800" />
                                    </button>

                                    {/* Indicadores */}
                                    <div className="absolute bottom-3 right-6 md:right-8 flex gap-1.5">
                                        {carousel.map((_, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setActiveSlide(i)}
                                                className={`h-1.5 rounded-full transition-all duration-300 ${
                                                    i === activeSlide ? "w-8 bg-white" : "w-3 bg-white/40"
                                                }`}
                                            />
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* SIDEBAR (1 coluna) */}
                    <div className="flex flex-col gap-4">
                        {sidebar.map((noticia) => (
                            <Link
                                key={noticia.id}
                                href={`/noticias/${noticia.slug}`}
                                className="group flex gap-4 bg-white border border-gray-100 rounded-xl p-3 hover:shadow-lg hover:border-blue-200 transition-all duration-300"
                            >
                                <div className="w-24 h-20 min-w-[96px] rounded-lg overflow-hidden relative bg-gray-100">
                                    <Image
                                        src={optimizeImage(noticia.imagem)}
                                        alt={noticia.titulo}
                                        fill
                                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                                        sizes="96px"
                                    />
                                </div>
                                <div className="flex-1 flex flex-col justify-center min-w-0">
                                    <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1 mb-1">
                                        <Calendar size={10} />
                                        {formatDate(noticia.data)}
                                    </span>
                                    <h4 className="text-sm font-bold text-gray-900 leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors">
                                        {noticia.titulo}
                                    </h4>
                                </div>
                            </Link>
                        ))}

                        {/* Link para todas */}
                        <Link
                            href="/noticias"
                            className="flex items-center justify-center gap-2 py-3 bg-blue-50 text-blue-600 font-bold text-sm rounded-xl hover:bg-blue-100 transition group"
                        >
                            Ver todas as notícias
                            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </div>

                {/* Mobile link */}
                <div className="mt-6 md:hidden text-center">
                    <Link
                        href="/noticias"
                        className="inline-flex items-center gap-2 text-sm font-bold text-blue-600"
                    >
                        Ver todas as notícias
                        <ArrowRight size={16} />
                    </Link>
                </div>
            </div>
        </section>
    );
}
