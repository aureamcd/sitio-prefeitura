"use client";

import { useState, useMemo } from "react";
import ContentPage from "../layout/ContentPage";
import {
    ChevronLeft,
    ChevronRight,
    Download,
    Eye,
    Search,
    Calendar,
} from "lucide-react";

/* =========================
   TIPOS
========================= */
type Documento = {
    id: number;
    titulo: string;
    tipo?: string;
    data: string;
    dataISO?: string; // Preparado para backend
    arquivo: string;
};

type Props = {
    title: string;
    description: string;
    breadcrumb: { label: string; href?: string }[];
    lastUpdate: string;
    responsavel: string;

    documentos: Documento[];

    showTipoFiltro?: boolean;
    tipos?: string[];
    showSearch?: boolean;
};

/* =========================
   CONFIG
========================= */
const ITEMS_PER_PAGE = 5;

/* =========================
   COMPONENTE
========================= */
export default function PublicationPage({
    title,
    description,
    breadcrumb,
    lastUpdate,
    responsavel,
    documentos,
    showTipoFiltro = false,
    tipos = [],
    showSearch = true,
}: Props) {
    const [busca, setBusca] = useState("");
    const [tipo, setTipo] = useState("Todos");
    const [ano, setAno] = useState("Todos");
    const [pagina, setPagina] = useState(1);

    // anos dinâmicos
    const anosDisponiveis = useMemo(() => {
        const anos = documentos.map((d) => d.data.split("/")[2]);
        return ["Todos", ...Array.from(new Set(anos)).sort((a, b) => b.localeCompare(a))];
    }, [documentos]);

    // filtro
    const filtrados = useMemo(() => {
        return documentos
            .filter((d) => {
                const matchTipo =
                    !showTipoFiltro || tipo === "Todos" || d.tipo === tipo;

                const matchAno = ano === "Todos" || d.data.endsWith(ano);

                const matchBusca =
                    d.titulo.toLowerCase().includes(busca.toLowerCase()) ||
                    d.data.includes(busca);

                return matchTipo && matchAno && matchBusca;
            })
            .sort((a, b) => {
                const dateA = new Date(a.data.split("/").reverse().join("-")).getTime();
                const dateB = new Date(b.data.split("/").reverse().join("-")).getTime();
                return dateB - dateA;
            });
    }, [busca, tipo, ano, documentos, showTipoFiltro]);

    const totalPaginas = Math.ceil(filtrados.length / ITEMS_PER_PAGE);
    const inicio = (pagina - 1) * ITEMS_PER_PAGE;
    const paginados = filtrados.slice(inicio, inicio + ITEMS_PER_PAGE);

    const handlePagina = (p: number) => {
        if (p >= 1 && p <= totalPaginas) {
            setPagina(p);
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    const handleExportCSV = () => {
        const header = "ID;Título;Tipo;Data;Link\n";
        const csvContent = filtrados
            .map((d) => `${d.id};"${d.titulo}";"${d.tipo || ""}";${d.data};${d.arquivo}`)
            .join("\n");

        const blob = new Blob(["\uFEFF" + header + csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `exportacao-${title.toLowerCase().replace(/\s+/g, "-")}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <ContentPage
            title={title}
            description={description}
            breadcrumb={breadcrumb}
            lastUpdate={lastUpdate}
            responsavel={responsavel}
            showSearch={false}
        >
            {/* FILTROS */}
            <section className="mb-8 p-6 bg-gray-50 border rounded-xl shadow-sm space-y-6">

                {/* BUSCA */}
                {showSearch && (
                    <form 
                        className="w-full"
                        onSubmit={(e) => { 
                            e.preventDefault(); 
                            const formData = new FormData(e.currentTarget);
                            setBusca(formData.get("query") as string);
                            setPagina(1);
                        }}
                    >
                        <label className="text-xs font-bold text-gray-500 uppercase">
                            Buscar
                        </label>
                        <div className="relative mt-2 flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    name="query"
                                    defaultValue={busca}
                                    className="w-full pl-10 pr-4 py-2.5 border rounded-lg bg-white focus:ring-2 focus:ring-[#173572] outline-none transition-all"
                                    placeholder="Digite palavra-chave, número ou data..."
                                />
                            </div>
                            <button
                                type="submit"
                                className="px-6 py-2.5 bg-[#173572] text-white rounded-lg font-medium hover:bg-[#0f2847] transition-colors shadow-sm"
                            >
                                Ir
                            </button>
                        </div>
                    </form>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* ANO */}
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">
                            Ano
                        </label>
                        <select
                            value={ano}
                            onChange={(e) => { setAno(e.target.value); setPagina(1); }}
                            className="w-full mt-2 border rounded-lg py-2.5 px-3 bg-white outline-none focus:ring-2 focus:ring-[#173572] transition-all cursor-pointer"
                        >
                            {anosDisponiveis.map((a) => (
                                <option key={a}>{a}</option>
                            ))}
                        </select>
                    </div>

                    {/* BOTÃO EXPORTAR */}
                    <div className="flex items-end">
                        <button
                            onClick={handleExportCSV}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors shadow-sm"
                            aria-label="Exportar resultados para CSV"
                        >
                            <Download size={18} />
                            Exportar CSV
                        </button>
                    </div>
                </div>

                {/* TIPO */}
                {showTipoFiltro && (
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">
                            Tipo
                        </label>
                        <div className="flex gap-2 mt-2 flex-wrap">
                            {["Todos", ...tipos].map((t) => (
                                <button
                                    key={t}
                                    onClick={() => { setTipo(t); setPagina(1); }}
                                    className={`px-4 py-2 rounded-full border transition-all ${tipo === t
                                        ? "bg-[#173572] text-white shadow-md border-[#173572]"
                                        : "bg-white text-gray-600 border-gray-200 hover:border-blue-400"
                                        }`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </section>

            {/* RESULTADOS */}
            <div className="mb-4 flex items-center justify-between text-sm text-gray-500 px-1">
                <p><strong>{filtrados.length}</strong> documento(s) encontrado(s)</p>
                <p className="hidden sm:block italic">Ordenação: mais recentes primeiro</p>
            </div>

            {/* LISTA */}
            <section className="space-y-3">
                {paginados.length === 0 ? (
                    <div className="bg-white border-2 border-dashed rounded-xl p-12 text-center">
                        <Search className="mx-auto text-gray-300 mb-4" size={48} />
                        <p className="text-gray-500 font-medium">Nenhum documento encontrado com os filtros aplicados.</p>
                    </div>
                ) : (
                    paginados.map((doc) => (
                        <div
                            key={doc.id}
                            className="group bg-white border rounded-xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:border-blue-300 hover:shadow-md transition-all"
                        >
                            <div>
                                <h3 className="font-bold text-gray-900 group-hover:text-[#173572] transition-colors">{doc.titulo}</h3>
                                <div className="flex items-center gap-3 mt-1.5 text-sm">
                                    {doc.tipo && (
                                        <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-medium text-xs">
                                            {doc.tipo}
                                        </span>
                                    )}
                                    <span className="text-gray-400 flex items-center gap-1">
                                        <Calendar size={14} /> {doc.data}
                                    </span>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <a
                                    href={doc.arquivo}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                    aria-label={`Visualizar documento: ${doc.titulo}`}
                                    title="Visualizar"
                                >
                                    <Eye size={20} />
                                </a>
                                <a
                                    href={doc.arquivo}
                                    download
                                    className="p-2 text-[#173572] hover:bg-blue-50 rounded-lg transition-all"
                                    aria-label={`Baixar documento: ${doc.titulo}`}
                                    title="Baixar"
                                >
                                    <Download size={20} />
                                </a>
                            </div>
                        </div>
                    ))
                )}
            </section>

            {/* PAGINAÇÃO */}
            {totalPaginas > 1 && (
                <div className="mt-10 flex flex-col items-center gap-4">
                    <div className="flex justify-center items-center gap-2">
                        <button
                            onClick={() => handlePagina(pagina - 1)}
                            disabled={pagina === 1}
                            className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-30 transition-colors"
                            aria-label="Ir para página anterior"
                        >
                            <ChevronLeft size={20} />
                        </button>

                        <div className="flex gap-1">
                            {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((p) => (
                                <button
                                    key={p}
                                    onClick={() => handlePagina(p)}
                                    className={`w-10 h-10 rounded-lg text-sm font-bold transition-all ${pagina === p
                                        ? "bg-[#173572] text-white shadow-md"
                                        : "bg-white border text-gray-600 hover:border-blue-400"
                                        }`}
                                    aria-label={`Ir para página ${p}`}
                                    aria-current={pagina === p ? "page" : undefined}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => handlePagina(pagina + 1)}
                            disabled={pagina === totalPaginas}
                            className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-30 transition-colors"
                            aria-label="Ir para próxima página"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                    <p className="text-xs text-gray-400">
                        Página {pagina} de {totalPaginas}
                    </p>
                </div>
            )}
        </ContentPage>
    );
}