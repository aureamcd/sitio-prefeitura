import { ReactNode } from "react";
import { Children } from "react";


type TransparencySectionProps = {
  id?: string;
  title: string;
  children: ReactNode;
  index?: number;
};

export default function TransparencySection({
  id,
  title,
  children,
  index = 0,
}: TransparencySectionProps) {
  const bgColor =
    index % 2 === 0
      ? "bg-blue-100"
      : "bg-gray-100";

  // 🔢 Quantidade de cards
  const cardsArray = Children.toArray(children);
  const cardsCount = cardsArray.length;

  // 🎯 Ajustes automáticos do grid
  const gridClasses =
    cardsCount === 1
      ? "grid-cols-1 max-w-[280px]"
      : cardsCount === 2
        ? "grid-cols-1 sm:grid-cols-2 max-w-2xl"
        : cardsCount === 3
          ? "grid-cols-1 sm:grid-cols-3 max-w-4xl"
          : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 max-w-6xl";

  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className={`${bgColor} py-12 md:py-10 scroll-mt-28`}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6">

        {/* Cabeçalho */}
        <div className="flex justify-center">
          <div className="inline-flex flex-col items-center mb-10">
            <h2 id={`${id}-title`} className="text-2xl font-semibold text-blue-800 text-center">
              {title}
            </h2>

            {/* Linha decorativa */}
            <div className="mt-2 h-0.5 w-[60%] bg-linear-to-r from-white-400 to-blue-500" />
          </div>
        </div>

        {/* Cards */}
        <div
          className={`
            grid
            ${gridClasses}
            gap-6
            mx-auto
            justify-center
          `}
        >
          {children}
        </div>

      </div>
    </section>
  );
}