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

  // O layout agora usa flexbox para centralizar a última linha perfeitamente
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
          className="
            flex flex-wrap justify-center gap-6
            max-w-6xl mx-auto
          "
        >
          {children}
        </div>

      </div>
    </section>
  );
}