"use client";

import Link from "next/link";
import { Calendar } from "lucide-react";

type NewsCardProps = {
  titulo: string;
  resumo: string;
  imagem?: string;
  slug: string;
  data: string;
  destaque?: string | string[];
  imagem_posicao?: string;
  variant?: "grid" | "list";
};

function getCategoriaInfo(cat?: string) {
  switch (cat) {
    case "saude":
      return { label: "Saúde", color: "bg-green-100 text-green-700" };
    case "educacao":
      return { label: "Educação", color: "bg-blue-100 text-blue-700" };
    case "obras":
      return { label: "Obras", color: "bg-orange-100 text-orange-700" };
    case "assistencia":
      return { label: "Social", color: "bg-purple-100 text-purple-700" };
    case "esporte":
      return { label: "Esporte", color: "bg-red-100 text-red-700" };
    default:
      return { label: "Geral", color: "bg-gray-100 text-gray-600" };
  }
}

function formatarDataRelativa(data: string) {
  const agora = new Date();
  const dataNoticia = new Date(data);

  const diffMs = agora.getTime() - dataNoticia.getTime();
  const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDias === 0) return "Hoje";
  if (diffDias === 1) return "Ontem";
  if (diffDias < 7) return `${diffDias} dias atrás`;

  return dataNoticia.toLocaleDateString("pt-BR");
}

export default function NewsCard({
  titulo,
  resumo,
  imagem,
  slug,
  data,
  destaque,
  imagem_posicao,
  variant = "grid",
}: NewsCardProps) {
  const formattedDate = formatarDataRelativa(data);
  const categoriaInfo = getCategoriaInfo(destaque);

  // 🟦 GRID
  if (variant === "grid") {
    return (
      <Link
        href={`/noticias/${slug}`}
        className="group flex flex-col h-full rounded-2xl overflow-hidden border bg-white hover:shadow-lg transition-all duration-300"
      >
        {/* imagem */}
        <div className="w-full aspect-[16/9] bg-gray-100 overflow-hidden">
          <img
            src={imagem || "/placeholder.jpg"}
            alt={titulo}
            className={`w-full h-full object-cover group-hover:scale-105 transition duration-500 ${
              imagem_posicao === "cover_top"
                ? "object-top"
                : imagem_posicao === "cover_face"
                ? "object-center"
                : "object-center"
            }`}
          />
        </div>

        {/* conteúdo */}
        <div className="p-4 flex flex-col flex-1">
          <div className="space-y-2">
            {destaque && (
              <div className="flex flex-wrap gap-1.5">
                {(Array.isArray(destaque) ? destaque : [destaque]).map((cat) => {
                  const info = getCategoriaInfo(cat);
                  return (
                    <span
                      key={cat}
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${info.color}`}
                    >
                      {info.label}
                    </span>
                  );
                })}
              </div>
            )}

            <h3 className="font-semibold text-base leading-tight group-hover:text-blue-600 transition">
              {titulo}
            </h3>

            <p className="text-sm text-gray-600 line-clamp-3">
              {resumo}
            </p>
          </div>

          {/* 🔥 rodapé fixo */}
          <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Calendar size={14} />
              {formattedDate}
            </div>

            {/* 👇 só aparece no hover */}
            <span className="text-blue-600 font-medium opacity-0 group-hover:opacity-100 transition">
              Ler mais →
            </span>
          </div>
        </div>
      </Link>
    );
  }

  // 🟩 LISTA
  return (
    <Link
      href={`/noticias/${slug}`}
      className=" group flex gap-4 items-center border rounded-xl p-3 bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
    >
      {/* barra lateral */}
      <div className={`w-1 h-full rounded ${categoriaInfo.color}`} />

      {/* imagem */}
      <div className="w-24 h-24 min-w-[96px] bg-gray-100 rounded-lg overflow-hidden">
        <img
          src={imagem || "/placeholder.jpg"}
          alt={titulo}
          className={`w-full h-full object-cover ${
            imagem_posicao === "cover_top"
              ? "object-top"
              : imagem_posicao === "cover_face"
              ? "object-center"
              : "object-center"
          }`}
        />
      </div>

      {/* conteúdo */}
      <div className="flex-1 flex flex-col">
        <div className="space-y-1">
          {destaque && (
            <div className="flex flex-wrap gap-1.5 mb-1">
              {(Array.isArray(destaque) ? destaque : [destaque]).map((cat) => {
                const info = getCategoriaInfo(cat);
                return (
                  <span
                    key={cat}
                    className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${info.color}`}
                  >
                    {info.label}
                  </span>
                );
              })}
            </div>
          )}

          <h3 className="font-semibold leading-tight hover:text-blue-600 transition">
            {titulo}
          </h3>

          <p className="text-sm text-gray-600 line-clamp-2">
            {resumo}
          </p>
        </div>

        {/* rodapé */}
        <div className="mt-auto flex items-center justify-between pt-2 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Calendar size={14} />
            {formattedDate}
          </div>

        
          <span className="text-blue-600 font-medium opacity-0 group-hover:opacity-100 transition ">
            Ler mais →
          </span>
        </div>
      </div>
    </Link>
  );
}