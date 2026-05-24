"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  Pencil,
  Calendar,
  ExternalLink,
  Loader2,
  AlertTriangle,
  Tag,
  Archive,
} from "lucide-react";
import { aprovarNoticia, rejeitarNoticia, arquivarNoticia } from "@/app/actions/noticias";

export type Noticia = {
  id: string;
  titulo: string;
  resumo: string;
  imagem?: string;
  slug: string;
  data: string;
  origem?: string;
  fonte?: string;
  destaque?: string[];
  status: string;
  link_original?: string;
  score_positivo?: number;
  score_risco?: number;
  prioridade?: string;
  tom?: string;
};

type Props = {
  noticias: Noticia[];
  showApprove?: boolean;
  showReject?: boolean;
  showArchive?: boolean;
  showEdit?: boolean;
  onRefresh: (silent?: boolean) => void;
  emptyMessage?: string;
};

const categoryLabels: Record<string, string> = {
  saude: "Saúde",
  educacao: "Educação",
  obras: "Obras",
  assistencia: "Social",
  esporte: "Esporte",
  licitacao: "Licitação",
};

const categoryColors: Record<string, string> = {
  saude: "bg-green-50 text-green-700 border-green-200",
  educacao: "bg-blue-50 text-blue-700 border-blue-200",
  obras: "bg-orange-50 text-orange-700 border-orange-200",
  assistencia: "bg-purple-50 text-purple-700 border-purple-200",
  esporte: "bg-red-50 text-red-700 border-red-200",
  licitacao: "bg-gray-50 text-gray-700 border-gray-200",
};

function getRiskBadge(score?: number) {
  if (!score || score < 20) return { label: "Baixo", color: "bg-green-100 text-green-700" };
  if (score < 50) return { label: "Médio", color: "bg-amber-100 text-amber-700" };
  return { label: "Alto", color: "bg-red-100 text-red-700" };
}

export default function AdminNewsTable({
  noticias,
  showApprove = false,
  showReject = false,
  showArchive = false,
  showEdit = true,
  onRefresh,
  emptyMessage = "Nenhuma notícia encontrada.",
}: Props) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [removingIds, setRemovingIds] = useState<string[]>([]);

  async function handleApprove(id: string) {
    try {
      setLoadingId(id);
      await aprovarNoticia(id);

      setLoadingId(null);
      setRemovingIds((prev) => [...prev, id]);
      setTimeout(() => {
        onRefresh(true);
        window.dispatchEvent(new Event("refresh-counts"));
      }, 400); // Aguarda animação de saída
    } catch (error: any) {
      alert("Erro ao aprovar: " + error.message);
      setLoadingId(null);
    }
  }

  async function handleReject(id: string) {
    try {
      setLoadingId(id);
      await rejeitarNoticia(id);

      setLoadingId(null);
      setRemovingIds((prev) => [...prev, id]);
      setTimeout(() => {
        onRefresh(true);
        window.dispatchEvent(new Event("refresh-counts"));
      }, 400);
    } catch (error: any) {
      alert("Erro ao rejeitar: " + error.message);
      setLoadingId(null);
    }
  }

  async function handleArchive(id: string) {
    try {
      setLoadingId(id);
      await arquivarNoticia(id);

      setLoadingId(null);
      setRemovingIds((prev) => [...prev, id]);
      setTimeout(() => {
        onRefresh(true);
        window.dispatchEvent(new Event("refresh-counts"));
      }, 400);
    } catch (error: any) {
      alert("Erro ao arquivar: " + error.message);
      setLoadingId(null);
    }
  }

  if (noticias.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-gray-300" />
        </div>
        <p className="text-gray-500 font-medium">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {noticias.map((n) => {
        const isLoading = loadingId === n.id;
        const isRemoving = removingIds.includes(n.id);
        const risk = getRiskBadge(n.score_risco);
        const categories = Array.isArray(n.destaque) ? n.destaque : [];

        return (
          <div
            key={n.id}
            className={`bg-white rounded-2xl border overflow-hidden hover:shadow-md transition-all duration-400 ease-in-out transform origin-top ${
              isLoading ? "opacity-60 pointer-events-none" : ""
            } ${
              isRemoving
                ? "opacity-0 scale-95 max-h-0 border-transparent !mt-0 !mb-[-1rem] pointer-events-none"
                : "opacity-100 scale-100 max-h-[800px] border-gray-200"
            }`}
          >
            <div className="flex flex-col md:flex-row">
              {/* Imagem */}
              {n.imagem && (
                <div className="relative w-full md:w-48 h-40 md:h-auto flex-shrink-0">
                  <Image
                    src={n.imagem}
                    alt={n.titulo}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 192px"
                  />
                </div>
              )}

              {/* Conteúdo */}
              <div className="flex-1 p-4 md:p-5 space-y-3">
                {/* Título */}
                <h3 className="text-base font-bold text-gray-900 leading-snug line-clamp-2">
                  {n.titulo}
                </h3>

                {/* Resumo */}
                {n.resumo && (
                  <p className="text-sm text-gray-500 line-clamp-2">
                    {n.resumo}
                  </p>
                )}

                {/* Meta Info */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {/* Data */}
                  <span className="flex items-center gap-1 text-gray-400">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(n.data).toLocaleDateString("pt-BR")}
                  </span>

                  {/* Origem */}
                  {n.fonte && (
                    <span className="text-gray-400">• {n.fonte}</span>
                  )}

                  {/* Link Original */}
                  {n.link_original && (
                    <a
                      href={n.link_original}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-500 hover:text-blue-700"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Original
                    </a>
                  )}

                  {/* Risco IA */}
                  <span
                    className={`px-2 py-0.5 rounded-md font-semibold ${risk.color}`}
                  >
                    Risco: {risk.label}
                  </span>

                  {/* Prioridade */}
                  {n.prioridade && n.prioridade !== "normal" && (
                    <span className="px-2 py-0.5 rounded-md font-semibold bg-indigo-100 text-indigo-700">
                      {n.prioridade}
                    </span>
                  )}
                </div>

                {/* Categorias */}
                {categories.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {categories.map((cat) => (
                      <span
                        key={cat}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider border ${
                          categoryColors[cat] ||
                          "bg-gray-50 text-gray-600 border-gray-200"
                        }`}
                      >
                        <Tag className="w-3 h-3" />
                        {categoryLabels[cat] || cat}
                      </span>
                    ))}
                  </div>
                )}

                {/* Ações */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {showApprove && (
                    <button
                      onClick={() => handleApprove(n.id)}
                      disabled={isLoading}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 transition disabled:opacity-50"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                      Aprovar
                    </button>
                  )}

                  {showEdit && (
                    <Link
                      href={`/admin/editar/${n.id}`}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-50 text-blue-700 text-sm font-semibold rounded-xl hover:bg-blue-100 transition"
                    >
                      <Pencil className="w-4 h-4" />
                      Editar
                    </Link>
                  )}

                  {showReject && (
                    <button
                      onClick={() => handleReject(n.id)}
                      disabled={isLoading}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-red-50 text-red-700 text-sm font-semibold rounded-xl hover:bg-red-100 transition disabled:opacity-50"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <XCircle className="w-4 h-4" />
                      )}
                      Rejeitar
                    </button>
                  )}

                  {showArchive && (
                    <button
                      onClick={() => handleArchive(n.id)}
                      disabled={isLoading}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-200 transition disabled:opacity-50"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Archive className="w-4 h-4" />
                      )}
                      Arquivar
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
