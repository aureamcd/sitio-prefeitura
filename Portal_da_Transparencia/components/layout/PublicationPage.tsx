"use client";

import { useState, useMemo } from "react";
import ContentPage from "./ContentPage";
import {
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    Download,
    Eye,
    Search,
    Calendar,
    FileText,
    FilterX,
    Building2,
} from "lucide-react";

/* =========================
   TIPOS
========================= */
type Documento = {
    id: number;
    titulo: string;
    tipo?: string;
    numero?: string;
    descricao?: string;
    orgao?: string;
    data: string;       // "DD/MM/YYYY" ou "AAAA" (ano)
    dataISO?: string;   // "YYYY-MM-DD" para ordenação e filtro de ano
    arquivo: string;
    arquivo_r2_url?: string;
};

type Props = {
    title: string;
    description: string;
    breadcrumb: { label: string; href?: string }[];
    lastUpdate: string;
    documentos: Documento[];
    showTipoFiltro?: boolean;
    tipos?: string[];
    tiposMap?: Record<string, string[]>;
    showSearch?: boolean;
};

/* =========================
   CONFIG
========================= */
const ITEMS_PER_PAGE = 10;

/* =========================
   HELPERS
========================= */
function extrairAno(doc: Documento): string {
    if (doc.dataISO) return doc.dataISO.split("-")[0];
    const parts = doc.data.split("/");
    return parts.length === 3 ? parts[2] : doc.data;
}

function getTimestamp(doc: Documento): number {
    if (doc.dataISO) return new Date(doc.dataISO).getTime();
    const parts = doc.data.split("/");
    if (parts.length === 3) return new Date(parts.reverse().join("-")).getTime();
    return new Date(`${doc.data}-01-01`).getTime();
}

/* =========================
   COMPONENTE
========================= */
export default function PublicationPage({
    title,
    description,
    breadcrumb,
    lastUpdate,
    documentos,
    showTipoFiltro = false,
    tipos = [],
    tiposMap,
    showSearch = true,
}: Props) {
    const [busca, setBusca] = useState("");
    const [tipo, setTipo] = useState("Todos");
    const [ano, setAno] = useState("Todos");
    const [pagina, setPagina] = useState(1);

    const anosDisponiveis = useMemo(() => {
        const anos = documentos.map(extrairAno).filter(Boolean);
        return ["Todos", ...Array.from(new Set(anos)).sort((a, b) => b.localeCompare(a))];
    }, [documentos]);

    const filtrados = useMemo(() => {
        const termo = busca.trim().toLowerCase();

        const normalizeString = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-");

        return documentos
            .filter((d) => {
                let matchTipo = true;
                if (showTipoFiltro && tipo !== "Todos") {
                    if (tiposMap) {
                        const key = normalizeString(tipo);
                        const permitidos = tiposMap[key] || [key];
                        const docTipo = d.tipo ? normalizeString(d.tipo) : "";
                        matchTipo = permitidos.includes(docTipo);
                    } else {
                        matchTipo = d.tipo === tipo;
                    }
                }

                const anoDoc = extrairAno(d);
                const matchAno = ano === "Todos" || anoDoc === ano;
                const matchBusca =
                    termo === "" ||
                    d.titulo.toLowerCase().includes(termo) ||
                    d.data.toLowerCase().includes(termo) ||
                    (d.tipo?.toLowerCase().includes(termo) ?? false) ||
                    (d.numero?.toLowerCase().includes(termo) ?? false) ||
                    (d.descricao?.toLowerCase().includes(termo) ?? false) ||
                    (d.orgao?.toLowerCase().includes(termo) ?? false);
                return matchTipo && matchAno && matchBusca;
            })
            .sort((a, b) => getTimestamp(b) - getTimestamp(a));
    }, [busca, tipo, ano, documentos, showTipoFiltro, tiposMap]);

    const totalPaginas = Math.ceil(filtrados.length / ITEMS_PER_PAGE);
    const inicio = (pagina - 1) * ITEMS_PER_PAGE;
    const paginados = filtrados.slice(inicio, inicio + ITEMS_PER_PAGE);

    function goPage(p: number) {
        if (p >= 1 && p <= totalPaginas) {
            setPagina(p);
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    }

    function limparFiltros() {
        setBusca("");
        setTipo("Todos");
        setAno("Todos");
        setPagina(1);
    }

    const temFiltro = !!(busca || tipo !== "Todos" || ano !== "Todos");

    return (
        <ContentPage
            title={title}
            description={description}
            breadcrumb={breadcrumb}
            lastUpdate={lastUpdate}
            showSearch={false}
        >
            <div className="space-y-8">

                {/* ── PAINEL DE FILTROS ── */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">

                    {/* Linha: busca + ano + limpar */}
                    <div className="flex flex-col sm:flex-row gap-4 items-end">

                        {showSearch && (
                            <div className="flex-1 min-w-0 space-y-1.5">
                                <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1">
                                    Busca
                                </label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
                                    <input
                                        type="text"
                                        value={busca}
                                        onChange={(e) => { setBusca(e.target.value); setPagina(1); }}
                                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm font-medium"
                                        placeholder="Palavra-chave, número, título ou data..."
                                    />
                                </div>
                            </div>
                        )}

                        <div className="shrink-0 space-y-1.5">
                            <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1">
                                Ano
                            </label>
                            <div className="relative">
                                <select
                                    value={ano}
                                    onChange={(e) => { setAno(e.target.value); setPagina(1); }}
                                    className="w-40 pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 appearance-none text-sm font-bold cursor-pointer"
                                >
                                    {anosDisponiveis.map((a) => (
                                        <option key={a} value={a}>{a === "Todos" ? "Todos os anos" : a}</option>
                                    ))}
                                </select>
                                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" />
                            </div>
                        </div>

                        <button
                            onClick={limparFiltros}
                            disabled={!temFiltro}
                            className={`shrink-0 flex items-center gap-1.5 px-4 py-2.5 border rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition ${
                                temFiltro
                                    ? "border-dashed border-gray-200 text-gray-700 hover:text-red-500 hover:border-red-200"
                                    : "border-gray-100 text-gray-500 cursor-not-allowed"
                            }`}
                        >
                            <FilterX size={14} />
                            Limpar Filtros
                        </button>
                    </div>

                    {/* Tipo pills */}
                    {showTipoFiltro && (
                        <div className="space-y-2 pt-1 border-t border-gray-50">
                            <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1 pt-2">
                                Tipo de Documento
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {["Todos", ...tipos].map((t) => (
                                    <button
                                        key={t}
                                        onClick={() => { setTipo(t); setPagina(1); }}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
                                            tipo === t
                                                ? "bg-blue-600 text-white shadow-md shadow-blue-100"
                                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                        }`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                            
                            {tipo === "Editais e Chamamentos Gerais" && (
                                <div className="mt-4 p-3.5 bg-blue-50/80 border border-blue-100 rounded-xl text-[13px] text-blue-800 leading-relaxed animate-in fade-in duration-300">
                                    <strong className="font-black text-blue-900">Procurando Editais de Licitação?</strong> Acesse o Portal da Transparência.<br />
                                    <strong className="font-black text-blue-900">Procurando Concursos?</strong> Acesse a área de Serviços.
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* ── CONTADOR ── */}
                <div className="text-sm text-gray-700 px-1">
                    Mostrando <strong className="text-gray-900">{paginados.length}</strong> de{" "}
                    <strong className="text-gray-900">{filtrados.length}</strong> documentos
                </div>

                {/* ── LISTA ── */}
                <div className="space-y-4">
                    {paginados.length === 0 ? (
                        <div className="text-center py-24 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                            <FilterX size={48} className="mx-auto text-gray-500 mb-4" />
                            <h3 className="text-lg font-bold text-gray-900">Nenhum documento encontrado</h3>
                            <p className="text-gray-700">Tente ajustar seus filtros ou busca.</p>
                            {temFiltro && (
                                <button
                                    onClick={limparFiltros}
                                    className="mt-4 inline-block text-blue-600 font-bold hover:underline text-sm"
                                >
                                    Ver todos os documentos
                                </button>
                            )}
                        </div>
                    ) : (
                        paginados.map((doc) => {
                            const arquivoUrl = doc.arquivo_r2_url || doc.arquivo;
                            return (
                                <div
                                    key={doc.id}
                                    className="group bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-xl hover:border-blue-200 transition-all duration-300"
                                >
                                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">

                                        <div className="flex items-start gap-5 flex-1 min-w-0">
                                            <div className="bg-blue-50 text-blue-600 p-3 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300 shadow-sm shrink-0 mt-1">
                                                <FileText size={22} strokeWidth={1.5} />
                                            </div>

                                            <div className="space-y-2 min-w-0">
                                                {/* Título */}
                                                <h3 className="text-base font-bold text-gray-900 leading-snug group-hover:text-blue-600 transition-colors">
                                                    {doc.titulo}
                                                </h3>

                                                {/* Badge tipo + data publicação */}
                                                <div className="flex items-center gap-3 flex-wrap">
                                                    {doc.tipo && (
                                                        <span className="bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded text-[11px] font-bold tracking-wide uppercase">
                                                            {(doc as any).tipoExibicao || doc.tipo}
                                                        </span>
                                                    )}
                                                    {doc.dataISO && (
                                                        <span className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
                                                            <Calendar size={13} className="text-gray-600" />
                                                            {doc.data}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Órgão */}
                                                {doc.orgao && (
                                                    <p className="flex items-center gap-1.5 text-xs text-gray-600 font-medium">
                                                        <Building2 size={12} className="shrink-0" />
                                                        {doc.orgao}
                                                    </p>
                                                )}

                                                {/* Descrição */}
                                                {doc.descricao && (
                                                    <p className="text-sm text-gray-700 leading-relaxed line-clamp-2">
                                                        {doc.descricao}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0 md:mt-1">
                                            <a
                                                href={arquivoUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-50 text-gray-600 font-bold text-xs uppercase rounded-xl hover:bg-gray-100 transition"
                                                aria-label={`Visualizar: ${doc.titulo}`}
                                            >
                                                <Eye size={15} />
                                                Ver
                                            </a>
                                            <a
                                                href={arquivoUrl}
                                                download
                                                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-bold text-xs uppercase rounded-xl hover:bg-blue-700 shadow-md shadow-blue-100 transition"
                                                aria-label={`Baixar: ${doc.titulo}`}
                                            >
                                                <Download size={15} />
                                                Baixar PDF
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* ── PAGINAÇÃO ── */}
                {totalPaginas > 1 && (
                    <div className="flex items-center justify-center gap-2 pt-8 border-t border-gray-100">
                        <button
                            onClick={() => goPage(pagina - 1)}
                            disabled={pagina === 1}
                            className="w-10 h-10 flex items-center justify-center rounded-xl font-bold bg-white border border-gray-200 hover:border-blue-400 hover:text-blue-600 text-gray-600 transition disabled:opacity-30"
                            aria-label="Página anterior"
                        >
                            <ChevronLeft size={20} />
                        </button>

                        {Array.from({ length: totalPaginas }, (_, i) => i + 1)
                            .filter(p => p === 1 || p === totalPaginas || (p >= pagina - 1 && p <= pagina + 1))
                            .map((p, idx, arr) => (
                                <div key={p} className="flex gap-2">
                                    {idx > 0 && p - arr[idx - 1] > 1 && (
                                        <span className="w-10 h-10 flex items-center justify-center text-gray-600">…</span>
                                    )}
                                    <button
                                        onClick={() => goPage(p)}
                                        className={`w-10 h-10 flex items-center justify-center rounded-xl font-bold transition ${
                                            pagina === p
                                                ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                                                : "bg-white border border-gray-200 hover:border-blue-400 text-gray-600"
                                        }`}
                                        aria-label={`Página ${p}`}
                                        aria-current={pagina === p ? "page" : undefined}
                                    >
                                        {p}
                                    </button>
                                </div>
                            ))}

                        <button
                            onClick={() => goPage(pagina + 1)}
                            disabled={pagina === totalPaginas}
                            className="w-10 h-10 flex items-center justify-center rounded-xl font-bold bg-white border border-gray-200 hover:border-blue-400 hover:text-blue-600 text-gray-600 transition disabled:opacity-30"
                            aria-label="Próxima página"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                )}

                {/* ── INFO ACESSIBILIDADE ── */}
                <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-6 text-sm text-gray-600 leading-relaxed">
                    <p>
                        <strong>Transparência e Acessibilidade:</strong> Todos os arquivos estão disponíveis em formato{" "}
                        <strong>PDF pesquisável</strong>, garantindo a leitura por softwares assistivos e facilitando a
                        busca por termos específicos dentro do documento.
                    </p>
                </div>

            </div>
        </ContentPage>
    );
}
