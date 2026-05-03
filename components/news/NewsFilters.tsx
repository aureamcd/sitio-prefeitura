"use client";

import { LayoutGrid, List } from "lucide-react";
import { useRouter } from "next/navigation";

type NewsFiltersProps = {
    categoria: string;
    periodo: string;
    view: "grid" | "list";
};

export default function NewsFilters({ categoria, periodo, view }: NewsFiltersProps) {
    const router = useRouter();

    const categorias = [
        { value: "", label: "Todas", base: "bg-gray-100 text-gray-700", active: "bg-blue-600 text-white" },
        { value: "saude", label: "Saúde", base: "bg-green-100 text-green-700", active: "bg-green-800 text-white" },
        { value: "educacao", label: "Educação", base: "bg-blue-100 text-blue-700", active: "bg-blue-800 text-white" },
        { value: "obras", label: "Obras", base: "bg-orange-100 text-orange-700", active: "bg-orange-800 text-white" },
        { value: "assistencia", label: "Social", base: "bg-purple-100 text-purple-700", active: "bg-purple-800 text-white" },
        { value: "esporte", label: "Esporte", base: "bg-red-100 text-red-700", active: "bg-red-800 text-white" },
    ];

    const periodos = [
        { value: "", label: "Todas" },
        { value: "7", label: "7 dias" },
        { value: "30", label: "30 dias" },
    ];

    const updateFilters = (newParams: Partial<NewsFiltersProps>) => {
        const params = new URLSearchParams({
            categoria: newParams.categoria ?? categoria,
            periodo: newParams.periodo ?? periodo,
            view: newParams.view ?? view,
        });
        router.push(`/noticias?${params.toString()}`);
    };

    return (
        <div className="flex flex-wrap items-end gap-x-8 gap-y-6 bg-white p-4 md:p-5 rounded-2xl border border-gray-100 shadow-sm">
            
            {/* Bloco 1: Categorias */}
            <div className="flex flex-col gap-2">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Categoria</span>
                <div className="flex flex-wrap gap-1.5">
                    {categorias.map((cat) => (
                        <button
                            key={cat.value}
                            onClick={() => updateFilters({ categoria: cat.value })}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                categoria === cat.value 
                                ? `${cat.active} shadow-sm scale-105` 
                                : `${cat.base} hover:bg-gray-200 text-gray-600`
                            }`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Bloco 2: Período (com ml-auto para empurrar tudo daqui pra frente para a direita) */}
            <div className="flex flex-col gap-2 md:ml-auto">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Período</span>
                <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200/40">
                    {periodos.map((p) => (
                        <button
                            key={p.value}
                            onClick={() => updateFilters({ periodo: p.value })}
                            className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                                periodo === p.value 
                                ? "bg-white text-blue-600 shadow-sm" 
                                : "text-gray-500 hover:text-gray-700"
                            }`}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Bloco 3: Visualização */}
            <div className="flex flex-col gap-2">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Visualização</span>
                <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200/40 w-fit">
                    <button
                        onClick={() => updateFilters({ view: "grid" })}
                        className={`p-1.5 rounded-lg transition-all ${
                            view === "grid" ? "bg-white text-blue-600 shadow-sm" : "text-gray-400"
                        }`}
                    >
                        <LayoutGrid size={16} />
                    </button>
                    <button
                        onClick={() => updateFilters({ view: "list" })}
                        className={`p-1.5 rounded-lg transition-all ${
                            view === "list" ? "bg-white text-blue-600 shadow-sm" : "text-gray-400"
                        }`}
                    >
                        <List size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}
