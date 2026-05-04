import ContentPage from "@/components/layout/ContentPage";
import { Search, FileText, Download, Eye, FilterX } from "lucide-react";
import { Calendar } from "lucide-react";
import Link from "next/link";
import LeiAnoSelect from "@/components/leis/LeiAnoSelect";

export const revalidate = 60;

type Norma = {
    id: string;
    numero: string;
    ano: string;
    titulo: string;
    tipo: "Lei" | "Decreto" | "Portaria" | "Resolução" | "Instrução Normativa";
    data: string;
    arquivo: string;
};

const normasMock: Norma[] = [
    { id: "1", numero: "123", ano: "2026", titulo: "Lei de Diretrizes Orçamentárias para o exercício de 2026", tipo: "Lei", data: "2026-03-10", arquivo: "#" },
    { id: "2", numero: "010", ano: "2026", titulo: "Regulamenta o uso de espaços públicos para eventos", tipo: "Decreto", data: "2026-02-05", arquivo: "#" },
    { id: "3", numero: "045", ano: "2026", titulo: "Nomeação de comissão técnica para avaliação de projetos", tipo: "Portaria", data: "2026-01-20", arquivo: "#" },
    { id: "4", numero: "001", ano: "2026", titulo: "Aprovação de contas do exercício anterior", tipo: "Resolução", data: "2026-01-05", arquivo: "#" },
    { id: "5", numero: "002", ano: "2026", titulo: "Instruções sobre o novo sistema de protocolo eletrônico", tipo: "Instrução Normativa", data: "2026-01-02", arquivo: "#" },
    { id: "6", numero: "200", ano: "2025", titulo: "Cria o programa municipal de incentivo à leitura", tipo: "Lei", data: "2025-11-15", arquivo: "#" },
];

const TIPOS = ["Lei", "Decreto", "Portaria", "Resolução", "Instrução Normativa"];
const ITEMS_PER_PAGE = 10;

export default async function LeisNormasPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const filters = await searchParams;
    const tipo = (filters.tipo as string) || "";
    const ano = (filters.ano as string) || "";
    const busca = (filters.busca as string) || "";
    const page = Number(filters.page) || 1;

    const filtradas = normasMock.filter((n) => {
        const matchTipo = !tipo || n.tipo === tipo;
        const matchAno = !ano || n.ano === ano;
        const matchBusca = !busca ||
            n.titulo.toLowerCase().includes(busca.toLowerCase()) ||
            n.numero.includes(busca);
        return matchTipo && matchAno && matchBusca;
    });

    const anosDisponiveis = Array.from(new Set(normasMock.map(n => n.ano))).sort((a, b) => b.localeCompare(a));

    const totalPages = Math.ceil(filtradas.length / ITEMS_PER_PAGE);
    const paginadas = filtradas.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

    return (
        <ContentPage
            title="Leis e Normas"
            description="Consulte a legislação municipal, decretos, portarias e outros atos normativos."
            breadcrumb={[
                { label: "Início", href: "/" },
                { label: "Leis e Normas" },
            ]}
            showSearch={false}
        >
            <div className="space-y-8">
                {/* 🔍 PAINEL DE FILTROS */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">

                        {/* Busca Texto */}
                        <div className="md:col-span-6 space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Busca por Título ou Número</label>
                            <form action="/leis-normas" method="get" className="relative flex gap-2">
                                <input type="hidden" name="tipo" value={tipo} />
                                <input type="hidden" name="ano" value={ano} />
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        name="busca"
                                        type="text"
                                        defaultValue={busca}
                                        placeholder="Ex: 123 ou Orçamento..."
                                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm font-medium"
                                    />
                                </div>
                                <button type="submit" className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 transition">
                                    Buscar
                                </button>
                            </form>
                        </div>

                        {/* Filtro Ano */}
                        <div className="md:col-span-3 space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Ano</label>
                            <LeiAnoSelect tipo={tipo} ano={ano} busca={busca} anosDisponiveis={anosDisponiveis} />
                        </div>

                        {/* Limpar */}
                        <div className="md:col-span-3">
                            <Link href="/leis-normas" className="flex items-center justify-center gap-2 px-4 py-2.5 border border-dashed border-gray-200 rounded-xl text-gray-500 hover:text-red-500 hover:border-red-200 transition text-xs font-bold uppercase tracking-wider">
                                <FilterX size={14} />
                                Limpar Filtros
                            </Link>
                        </div>
                    </div>

                    {/* Filtro Tipo */}
                    <div className="space-y-3 pt-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tipo de Documento</label>
                        <div className="flex flex-wrap gap-2">
                            <Link
                                href={`/leis-normas?tipo=&ano=${ano}&busca=${busca}`}
                                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${!tipo ? "bg-blue-600 text-white shadow-md shadow-blue-100" : "bg-gray-50 text-gray-500 hover:bg-gray-100"}`}
                            >
                                Todos
                            </Link>
                            {TIPOS.map(t => (
                                <Link
                                    key={t}
                                    href={`/leis-normas?tipo=${encodeURIComponent(t)}&ano=${ano}&busca=${busca}`}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${tipo === t ? "bg-blue-600 text-white shadow-md shadow-blue-100" : "bg-gray-50 text-gray-500 hover:bg-gray-100"}`}
                                >
                                    {t}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 📊 RESULTADOS */}
                <div className="flex items-center justify-between text-sm text-gray-500 px-1">
                    <p>Mostrando <strong className="text-gray-900">{paginadas.length}</strong> de <strong className="text-gray-900">{filtradas.length}</strong> documentos</p>
                </div>

                {/* 📋 LISTA */}
                <div className="space-y-4">
                    {paginadas.length > 0 ? (
                        paginadas.map((norma) => (
                            <div key={norma.id} className="group bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-xl hover:border-blue-200 transition-all duration-300">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">

                                    <div className="flex items-start gap-5">
                                        <div className="bg-blue-50 text-blue-600 p-3 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300 shadow-sm">
                                            <FileText size={24} />
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-3 flex-wrap">
                                                <span className="bg-blue-600 text-white px-3 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider">
                                                    {norma.tipo} nº {norma.numero}/{norma.ano}
                                                </span>
                                                <span className="flex items-center gap-1.5 text-xs font-bold text-gray-400">
                                                    <Calendar size={14} className="text-gray-300" />
                                                    {new Date(norma.data).toLocaleDateString("pt-BR")}
                                                </span>
                                            </div>
                                            <h3 className="text-lg font-bold text-gray-900 leading-tight group-hover:text-blue-600 transition-colors">
                                                {norma.titulo}
                                            </h3>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <a
                                            href={norma.arquivo}
                                            target="_blank"
                                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-50 text-gray-600 font-bold text-xs uppercase rounded-xl hover:bg-gray-100 transition"
                                        >
                                            <Eye size={16} />
                                            Ver
                                        </a>
                                        <a
                                            href={norma.arquivo}
                                            download
                                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-bold text-xs uppercase rounded-xl hover:bg-blue-700 shadow-md shadow-blue-100 transition"
                                        >
                                            <Download size={16} />
                                            Baixar PDF
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-24 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                            <FilterX size={48} className="mx-auto text-gray-300 mb-4" />
                            <h3 className="text-lg font-bold text-gray-900">Nenhum documento encontrado</h3>
                            <p className="text-gray-500">Tente ajustar seus filtros ou busca.</p>
                            <Link href="/leis-normas" className="mt-4 inline-block text-blue-600 font-bold hover:underline">
                                Ver todos os documentos
                            </Link>
                        </div>
                    )}
                </div>

                {/* 📄 PAGINAÇÃO */}
                {totalPages > 1 && (
                    <div className="flex justify-center gap-2 pt-8">
                        {Array.from({ length: totalPages }).map((_, i) => {
                            const p = i + 1;
                            const active = p === page;
                            return (
                                <Link
                                    key={p}
                                    href={`/leis-normas?tipo=${tipo}&ano=${ano}&busca=${busca}&page=${p}`}
                                    className={`w-10 h-10 flex items-center justify-center rounded-xl font-bold transition ${
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

                {/* INFO */}
                <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-6 text-sm text-gray-600 leading-relaxed">
                    <p>
                        <strong>Transparência e Acessibilidade:</strong> Todos os arquivos estão disponíveis em formato <strong>PDF pesquisável</strong>,
                        garantindo a leitura por softwares assistivos e facilitando a busca por termos específicos dentro do documento.
                    </p>
                </div>
            </div>
        </ContentPage>
    );
}
