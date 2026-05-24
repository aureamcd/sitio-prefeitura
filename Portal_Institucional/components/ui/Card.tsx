import Link from "next/link";
import { LucideIcon } from "lucide-react";

type GovCardProps = {
  title: string;
  href: string;
  Icon?: LucideIcon;
  description?: string;
  actionText?: string;
  featured?: boolean;
};

export default function GovCard({
  title,
  href,
  Icon,
  description,
  actionText = "Acessar >",
  featured = false,
}: GovCardProps) {
  return (
    <article className="h-[180px] max-w-[250px] w-full">
      <Link
        href={href}
        aria-label={`Acessar ${title}`}
        className={`
    group relative flex flex-col h-full bg-white
    border rounded-2xl overflow-hidden
    transition-all duration-300 ease-out
    hover:shadow-lg hover:-translate-y-1
    focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-600
    p-4
  ${featured
            ? "border-blue-200 shadow-sm bg-blue-50/40"
            : "border-gray-200"}
`}
      >
        {/* 🔵 Barra colorida topo */}
        <div
          className={`
            absolute top-0 left-0 w-full h-[4px] rounded-t-2xl
            ${featured
              ? "bg-[#0052CC]" 
              : "bg-gradient-to-r from-blue-600 via-green-500 to-yellow-400"}
          `}
        />

        {/* ✨ Brilho de fundo (hover) */}
        <div
          className="
            absolute inset-0            
            opacity-0
            group-hover:opacity-100
            transition-all duration-500
          "
        />

        {/* Container centralizador */}
        <div className="flex-1 flex flex-col items-center justify-center w-full mt-2">
          {/* Ícone */}
          <div className="mb-4 flex justify-center relative z-10">
            <div
              className={`
                flex items-center justify-center
                rounded-full
                border border-gray-200
                bg-gray-100
                transition-all duration-300
                group-hover:bg-gradient-to-br group-hover:from-blue-100 group-hover:to-blue-200
                h-14 w-14
              `}
            >
              {Icon && (
                <Icon
                  className={`
                    text-gray-600
                    transition-all duration-300
                    group-hover:text-blue-700
                    h-7 w-7
                  `}
                />
              )}
            </div>
          </div>

          {/* Conteúdo */}
          <h3 className="text-center font-semibold text-gray-800 relative z-10 text-sm leading-snug min-h-[40px] flex items-center justify-center px-1">
            {title}
          </h3>
        </div>

        {/* 🚀 Ação (aparece suave) */}
        <div
          className="
            mt-3 text-center text-xs font-medium text-blue-700
            opacity-0 translate-y-2
            group-hover:opacity-100 group-hover:translate-y-0
            transition-all duration-300
            relative z-10
          "
        >
          {actionText}
        </div>
      </Link>
    </article>
  );
}