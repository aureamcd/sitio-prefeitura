import ContentPage from "@/components/layout/ContentPage";
import { createServerClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Calendar, FileText, Download, Building2, AlignLeft, Hash } from "lucide-react";
import Link from "next/link";

export const revalidate = 60;

export default async function LeiNormaPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const supabase = createServerClient();

    const { data: norma } = await supabase
        .from("legislacoes")
        .select("*")
        .eq("slug", slug)
        .or("publicado.eq.true,publicado.is.null")
        .single();

    if (!norma) {
        return notFound();
    }

    const tituloFormatado = (norma.tipo && norma.numero && norma.ano)
        ? `${norma.tipo.charAt(0).toUpperCase() + norma.tipo.slice(1).toLowerCase()} nº ${norma.numero}/${norma.ano}`
        : norma.titulo;

    return (
        <ContentPage
            title={tituloFormatado}
            description={norma.ementa || norma.descricao || norma.titulo}
            breadcrumb={[
                { label: "Início", href: "/" },
                { label: "Leis e Normas", href: "/leis-normas" },
                { label: "Visualização de Documento" },
            ]}
            showSearch={false}
        >
            <div className="space-y-8">
                {/* 📄 CABEÇALHO DO DOCUMENTO */}
                <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                        <div className="space-y-4 flex-1">
                            <div className="flex flex-wrap items-center gap-3">
                                <span className="bg-gray-100 text-gray-600 px-4 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider flex items-center gap-2 border border-gray-200">
                                    <FileText size={14} />
                                    {norma.tipo || "Documento"}
                                </span>
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900 leading-tight">
                                {tituloFormatado}
                            </h1>
                            {(norma.ementa || norma.descricao) && (
                                <p className="text-base text-gray-600 leading-relaxed font-medium">
                                    {norma.ementa || norma.descricao}
                                </p>
                            )}
                        </div>

                        {(norma.arquivo_r2_url || norma.arquivo_url) && (
                            <a
                                href={norma.arquivo_r2_url || norma.arquivo_url}
                                download
                                className="shrink-0 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold text-sm uppercase rounded-xl hover:bg-blue-700 shadow-sm transition-all group"
                            >
                                <Download size={18} className="group-hover:-translate-y-0.5 transition-transform" />
                                Baixar Arquivo
                            </a>
                        )}
                    </div>
                </div>

                {/* 📋 METADADOS E EMENTA */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Ementa e Texto */}
                    <div className="lg:col-span-2 space-y-8">
                        {norma.ementa && (
                            <div className="bg-gray-50 border-l-4 border-blue-600 rounded-r-2xl p-6">
                                <h3 className="text-xs font-black text-blue-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <AlignLeft size={16} />
                                    Ementa do Documento
                                </h3>
                                <p className="text-gray-700 leading-relaxed font-medium italic">
                                    {norma.ementa}
                                </p>
                            </div>
                        )}

                        {/* VISUALIZADOR DE PDF EMBUTIDO */}
                        {(norma.arquivo_r2_url || norma.arquivo_url) && (
                            <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm flex flex-col">
                                <div className="bg-gray-50 border-b border-gray-200 p-4 flex items-center justify-between">
                                    <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
                                        <FileText size={18} className="text-gray-400" />
                                        Visualização do Documento
                                    </h3>
                                </div>
                                <div className="w-full h-[800px] bg-gray-100 relative">
                                    {/* iFrame para PDF. Em produção com Supabase Storage, o PDF será exibido perfeitamente */}
                                    <iframe 
                                        src={`${norma.arquivo_r2_url || norma.arquivo_url}#toolbar=0`} 
                                        className="w-full h-full border-none"
                                        title={`Visualização de ${tituloFormatado}`}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Metadados Laterais */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
                            <h3 className="text-sm font-black text-gray-900 mb-6 border-b border-gray-100 pb-4">Detalhes da Publicação</h3>
                            <ul className="space-y-5">
                                <li>
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-1">
                                        <Hash size={14} /> Número da Norma
                                    </span>
                                    <span className="text-base font-bold text-gray-800">{norma.numero}</span>
                                </li>
                                {norma.data_publicacao && (
                                    <li>
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-1">
                                            <Calendar size={14} /> Data de Publicação
                                        </span>
                                        <span className="text-base font-bold text-gray-800">
                                            {new Date(norma.data_publicacao).toLocaleDateString("pt-BR", { timeZone: "UTC" })}
                                        </span>
                                    </li>
                                )}
                                <li>
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-1">
                                        <Calendar size={14} /> Ano Letivo
                                    </span>
                                    <span className="text-base font-bold text-gray-800">{norma.ano}</span>
                                </li>
                                {norma.orgao && (
                                    <li>
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-1">
                                            <Building2 size={14} /> Órgão Responsável
                                        </span>
                                        <span className="text-base font-bold text-gray-800">{norma.orgao}</span>
                                    </li>
                                )}
                            </ul>
                        </div>
                        
                        <div className="bg-blue-50/50 border border-blue-100 rounded-3xl p-6 shadow-sm text-center">
                            <p className="text-xs text-gray-600 mb-4">
                                Não encontrou o que procurava?
                            </p>
                            <Link href="/leis-normas" className="w-full block py-3 bg-white border border-blue-200 rounded-xl text-blue-600 font-bold text-xs uppercase tracking-wide hover:bg-blue-50 transition">
                                Voltar para Busca Geral
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </ContentPage>
    );
}
