"use client";

import { useState, useEffect } from "react";
import { X, Cookie, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookieConsent");
    if (!consent) {
      // Delay para não aparecer instantaneamente
      const timer = setTimeout(() => setVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  function acceptCookies() {
    localStorage.setItem("cookieConsent", "accepted");
    setVisible(false);
  }

  function dismiss() {
    localStorage.setItem("cookieConsent", "dismissed");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className="fixed bottom-4 left-4 right-4 sm:right-auto sm:max-w-sm z-[200] animate-in slide-in-from-bottom-8 fade-in duration-700"
    >
      <div className="relative bg-white/80 backdrop-blur-xl border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-2xl p-5 flex flex-col gap-4 overflow-hidden">
        
        {/* Efeito decorativo de fundo */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-start gap-4 relative z-10">
          {/* Ícone */}
          <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-100/50 text-[#173572] rounded-xl shrink-0 shadow-sm">
            <Cookie size={20} className="drop-shadow-sm" />
          </div>

          {/* Texto */}
          <div className="flex-1 text-sm text-gray-700 leading-relaxed pr-4">
            <h3 className="font-bold text-gray-900 mb-1">
              Privacidade e Cookies
            </h3>
            <p className="text-gray-600 text-xs">
              Utilizamos cookies essenciais para o funcionamento básico do site. Não coletamos dados pessoais.
            </p>
            <Link href="/lgpd" className="inline-block mt-2 text-xs text-[#173572] font-semibold hover:text-blue-700 transition-colors underline decoration-blue-200/50 hover:decoration-blue-400 underline-offset-4">
              Ver Política de Privacidade
            </Link>
          </div>
        </div>

        {/* Botões */}
        <div className="flex items-center gap-2 pt-1 relative z-10">
          <button
            type="button"
            onClick={dismiss}
            className="flex-1 px-4 py-2.5 text-xs font-semibold text-gray-600 bg-white/50 hover:bg-gray-100/80 border border-gray-200/60 rounded-xl transition-all duration-200 focus:ring-2 focus:ring-gray-200 outline-none"
          >
            Dispensar
          </button>
          <button
            type="button"
            onClick={acceptCookies}
            className="flex-1 px-4 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-[#173572] to-[#254ea0] hover:from-[#132c5e] hover:to-[#173572] rounded-xl transition-all duration-300 shadow-lg shadow-blue-900/20 flex items-center justify-center gap-1.5 focus:ring-2 focus:ring-[#173572]/50 outline-none hover:-translate-y-0.5 active:translate-y-0"
          >
            <ShieldCheck size={14} />
            Entendi
          </button>
        </div>

        {/* Fechar */}
        <button
          type="button"
          onClick={dismiss}
          aria-label="Fechar aviso de cookies"
          className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100/50 rounded-full transition-colors z-10"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
