"use client";

import { useState, useMemo } from "react";
import ContentPage from "@/components/layout/ContentPage";
import { ChevronLeft, ChevronRight, Download, Eye, Search, Calendar, FileText } from "lucide-react";

type Norma = {
  id: number;
  titulo: string;
  tipo: "Lei" | "Decreto" | "Portaria";
  data: string; // Formato DD/MM/AAAA
  arquivo: string;
};

const normasMock: Norma[] = [
  { id: 1, titulo: "Lei nº 001/2026", tipo: "Lei", data: "10/03/2026", arquivo: "/arquivos/lei-001-2026.pdf" },
  { id: 2, titulo: "Decreto nº 010/2026", tipo: "Decreto", data: "05/02/2026", arquivo: "/arquivos/decreto-010-2026.pdf" },
  { id: 3, titulo: "Portaria nº 123/2026", tipo: "Portaria", data: "20/01/2026", arquivo: "/arquivos/portaria-123-2026.pdf" },
  { id: 4, titulo: "Lei nº 045/2025", tipo: "Lei", data: "15/12/2025", arquivo: "/arquivos/lei-045-2025.pdf" },
  { id: 5, titulo: "Decreto nº 088/2025", tipo: "Decreto", data: "10/11/2025", arquivo: "/arquivos/decreto-088-2025.pdf" },
  { id: 6, titulo: "Portaria nº 550/2025", tipo: "Portaria", data: "05/10/2025", arquivo: "/arquivos/portaria-550-2025.pdf" },
  { id: 7, titulo: "Lei nº 012/2025", tipo: "Lei", data: "20/05/2025", arquivo: "/arquivos/lei-012-2025.pdf" },
  { id: 8, titulo: "Decreto nº 005/2025", tipo: "Decreto", data: "01/01/2025", arquivo: "/arquivos/decreto-005-2025.pdf" },
  { id: 9, titulo: "Lei nº 100/2024", tipo: "Lei", data: "15/06/2024", arquivo: "/arquivos/lei-100-2024.pdf" },
  { id: 10, titulo: "Decreto nº 050/2024", tipo: "Decreto", data: "10/02/2024", arquivo: "/arquivos/decreto-050-2024.pdf" },
  { id: 11, titulo: "Lei nº 001/2024", tipo: "Lei", data: "02/01/2024", arquivo: "/arquivos/lei-001-2024.pdf" },
];

const ITEMS_PER_PAGE = 5;

export default function LeisNormasPage() {
  const [busca, setBusca] = useState("");
  const [tipo, setTipo] = useState("Todos");
  const [ano, setAno] = useState("Todos");
  const [pagina, setPagina] = useState(1);

  // Extrair anos disponíveis de forma dinâmica
  const anosDisponiveis = useMemo(() => {
    const anos = normasMock.map(n => n.data.split("/")[2]);
    return ["Todos", ...Array.from(new Set(anos)).sort((a, b) => b.localeCompare(a))];
  }, []);

  // Lógica de filtragem e ordenação
  const filtradasSorted = useMemo(() => {
    return normasMock
      .filter((n) => {
        const matchTipo = tipo === "Todos" || n.tipo === tipo;
        const matchAno = ano === "Todos" || n.data.endsWith(ano);
        const matchBusca =
          n.titulo.toLowerCase().includes(busca.toLowerCase()) ||
          n.data.includes(busca);
        return matchTipo && matchAno && matchBusca;
      })
      .sort((a, b) => {
        // Ordenar por data (mais recente primeiro)
        const dateA = new Date(a.data.split("/").reverse().join("-")).getTime();
        const dateB = new Date(b.data.split("/").reverse().join("-")).getTime();
        return dateB - dateA;
      });
  }, [busca, tipo, ano]);

  // Paginação
  const totalPaginas = Math.ceil(filtradasSorted.length / ITEMS_PER_PAGE);
  const inicio = (pagina - 1) * ITEMS_PER_PAGE;
  const normasPaginadas = filtradasSorted.slice(inicio, inicio + ITEMS_PER_PAGE);

  const handlePagina = (novaPagina: number) => {
    if (novaPagina >= 1 && novaPagina <= totalPaginas) {
      setPagina(novaPagina);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <ContentPage
      title="Leis e Normas"
      breadcrumb={[
        { label: "Início", href: "/" },
        { label: "Informações Institucionais", href: "/info-institucional" },
        { label: "Leis e Normas" },
      ]}
      description="Consulte e faça o download de leis, decretos e portarias municipais."
      lastUpdate="30/04/2026"
      responsavel="Secretaria Municipal de Administração"
      showSearch={false}
    >

      {/* INTRO */}
      <section className="mb-10">
        <p className="text-gray-700 leading-relaxed max-w-3xl">
          Nesta seção são disponibilizados os atos normativos do município em formato PDF pesquisável,
          permitindo o acesso rápido à legislação municipal vigente e histórica.
        </p>
      </section>

      {/* 🔍 PAINEL DE FILTROS */}
      <section className="mb-8 p-6 bg-gray-50 border rounded-xl shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* BUSCA TEXTO */}
          <form 
              className="md:col-span-2"
              onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  setBusca(formData.get("query") as string);
                  setPagina(1);
              }}
          >
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">Palavra-chave ou Número</label>
            <div className="relative flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  name="query"
                  type="text"
                  placeholder="Ex: Lei 001, 2026, Orçamento..."
                  defaultValue={busca}
                  className="w-full pl-10 pr-4 py-2.5 border rounded-lg bg-white outline-none focus:ring-2 focus:ring-[#173572] transition-all"
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

          {/* FILTRO ANO */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">Filtrar por Ano</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <select
                value={ano}
                onChange={(e) => { setAno(e.target.value); setPagina(1); }}
                className="w-full pl-10 pr-4 py-2.5 border rounded-lg bg-white outline-none focus:ring-2 focus:ring-[#173572] appearance-none cursor-pointer transition-all"
              >
                {anosDisponiveis.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* FILTRO TIPO (Tabs) */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-3 ml-1">Tipo de Documento</label>
          <div className="flex flex-wrap gap-2">
            {["Todos", "Lei", "Decreto", "Portaria"].map((t) => (
              <button
                key={t}
                onClick={() => { setTipo(t); setPagina(1); }}
                className={`px-4 py-2 text-sm rounded-full border transition-all ${tipo === t
                  ? "bg-[#173572] text-white border-[#173572] shadow-md"
                  : "bg-white text-gray-600 border-gray-200 hover:border-blue-400"
                  }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 📊 RESULTADOS */}
      <div className="mb-4 flex items-center justify-between text-sm text-gray-500 px-1">
        <p>Mostrando <strong>{normasPaginadas.length}</strong> de <strong>{filtradasSorted.length}</strong> documentos</p>
        <p>Ordenação: <span className="font-medium text-gray-900">Mais recentes primeiro</span></p>
      </div>

      <section className="space-y-3">
        {normasPaginadas.length === 0 ? (
          <div className="bg-white border-2 border-dashed rounded-xl p-12 text-center">
            <Search className="mx-auto text-gray-300 mb-4" size={48} />
            <p className="text-gray-500 font-medium">Nenhum documento encontrado com os filtros aplicados.</p>
            <button
              onClick={() => { setBusca(""); setTipo("Todos"); setAno("Todos"); }}
              className="mt-4 text-blue-600 hover:underline text-sm font-semibold"
            >
              Limpar todos os filtros
            </button>
          </div>
        ) : (
          normasPaginadas.map((norma) => (
            <div
              key={norma.id}
              className="group bg-white border rounded-xl p-5 hover:border-blue-300 hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <div className="mt-1 bg-blue-50 p-2.5 rounded-lg text-blue-700 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <FileText size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg leading-tight group-hover:text-[#173572] transition-colors">
                    {norma.titulo}
                  </h3>
                  <div className="flex items-center gap-3 mt-2 text-sm">
                    <span className="px-2 py-0.5 bg-gray-100 rounded text-gray-600 font-medium">
                      {norma.tipo}
                    </span>
                    <span className="text-gray-400 flex items-center gap-1">
                      <Calendar size={14} /> {norma.data}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:self-center">
                <a
                  href={norma.arquivo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition-all"
                  aria-label={`Visualizar documento: ${norma.titulo}`}
                >
                  <Eye size={18} />
                  <span className="hidden lg:inline">Visualizar</span>
                </a>

                <a
                  href={norma.arquivo}
                  download
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#173572] text-white rounded-lg text-sm font-medium hover:bg-[#0f2847] hover:shadow-lg transition-all"
                  aria-label={`Baixar documento: ${norma.titulo}`}
                >
                  <Download size={18} />
                  <span>Baixar</span>
                </a>
              </div>
            </div>
          ))
        )}
      </section>

      {/* 📄 PAGINAÇÃO */}
      {totalPaginas > 1 && (
        <div className="mt-10 flex flex-col items-center gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePagina(pagina - 1)}
              disabled={pagina === 1}
              className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              aria-label="Página anterior"
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
              className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              aria-label="Próxima página"
            >
              <ChevronRight size={20} />
            </button>
          </div>
          <p className="text-xs text-gray-400">
            Página {pagina} de {totalPaginas}
          </p>
        </div>
      )}

      {/* ⚠️ OBSERVAÇÃO (IMPORTANTE PNTP) */}
      <section className="mt-12 bg-blue-50/50 border border-blue-100 rounded-xl p-5">
        <p className="text-sm text-gray-600 leading-relaxed">
          <strong>Acessibilidade e Transparência:</strong> Todos os documentos estão disponíveis em formato
          <strong> PDF pesquisável</strong>, garantindo a leitura por softwares assistivos e facilitando a busca
          por termos específicos dentro do texto, em conformidade com as diretrizes de acessibilidade digital.
        </p>
      </section>

    </ContentPage>
  );
}
