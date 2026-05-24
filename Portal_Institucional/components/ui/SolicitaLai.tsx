"use client";

import Link from "next/link";
import { JSX } from "react";

export default function SolicitaLai(): JSX.Element {
  return (
    <>
      {/* Onda de transição adaptada */}
      <div className="w-full overflow-hidden leading-[0] bg-[#f0f4f8] rotate-180">
        <svg 
          viewBox="0 0 1200 120" 
          preserveAspectRatio="none" 
          className="relative block w-[calc(100%+1.3px)] h-[60px] md:h-[80px] fill-gray-50"
        >
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V120c159.27-23.26,243.71-45.42,321.39-63.56Z"></path>
        </svg>
      </div>

      {/* Seção LAI */}
      <section
        className="bg-gray-50 py-10"
        aria-labelledby="titulo-lai"
      >
        <div className="max-w-4xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6">

          {/* Texto */}
          <div className="text-center sm:text-left">
            <h2
              id="titulo-lai"
              className="text-xl md:text-2xl font-bold text-[#173572] mb-2"
            >
              Não encontrou o que procura?
            </h2>
            <p className="text-gray-500 text-sm leading-relaxed max-w-lg">
              Caso a informação desejada não esteja disponível no Portal da Transparência,
              você pode solicitá-la por meio da Lei de Acesso à Informação (LAI).
            </p>
          </div>

          {/* Botão */}
          <Link
            href="/esic"
            aria-label="Fazer solicitação de informação via Lei de Acesso à Informação"
            className="
              shrink-0 inline-block bg-[#173572] text-white
              px-8 py-3.5 rounded-lg font-semibold text-sm whitespace-nowrap
              hover:bg-[#0f2d52] transition-all duration-200
              focus-visible:ring-2 focus-visible:ring-[#173572] focus-visible:ring-offset-2
            "
          >
            Fazer Solicitação LAI
          </Link>

        </div>
      </section>
    </>
  );
}