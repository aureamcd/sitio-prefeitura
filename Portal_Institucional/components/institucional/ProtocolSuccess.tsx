/**
 * ========================================================
 * COMPONENTE: ProtocolSuccess
 * ========================================================
 * Tela de sucesso pós-envio com protocolo, cópia para
 * clipboard e orientações legais ao cidadão.
 *
 * @module components/institucional/ProtocolSuccess
 */
"use client";

import { useState } from "react";
import { CheckCircle2, Copy, Check, FileText } from "lucide-react";

interface ProtocolSuccessProps {
  protocolo: string;
  canal: "esic" | "ouvidoria";
  onReset: () => void;
}

export default function ProtocolSuccess({
  protocolo,
  canal,
  onReset,
}: ProtocolSuccessProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(protocolo);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* fallback para navegadores antigos */
      const input = document.createElement("input");
      input.value = protocolo;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const textoCanal = canal === "esic" ? "Pedido de Acesso à Informação" : "Manifestação de Ouvidoria";
  const prazoTexto = canal === "esic" ? "20 dias" : "30 dias";

  return (
    <div className="text-center py-16 min-h-[30rem] flex flex-col justify-center space-y-8">
      {/* Ícone de sucesso */}
      <div className="mx-auto w-20 h-20 rounded-full bg-green-100 flex items-center justify-center shadow-sm">
        <CheckCircle2 size={40} className="text-green-600" />
      </div>

      {/* Mensagem */}
      <div>
        <h3 className="text-2xl font-black text-gray-900 mb-2">
          {textoCanal} registrado!
        </h3>
        <p className="text-gray-600 text-sm md:text-base">
          Guarde o número de protocolo abaixo para acompanhar o andamento.
        </p>
      </div>

      {/* Protocolo com botão de cópia */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 max-w-sm mx-auto shadow-sm">
        <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3">
          Seu Protocolo
        </p>
        <div className="flex items-center justify-center gap-4">
          <span className="text-[30px] font-black text-[#173572] tracking-wider leading-none">
            {protocolo}
          </span>
          <button
            onClick={handleCopy}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 transition"
            title="Copiar protocolo"
          >
            {copied ? (
              <Check size={18} className="text-green-600" />
            ) : (
              <Copy size={18} className="text-gray-400" />
            )}
          </button>
        </div>
        {copied && (
          <p className="text-xs text-green-600 font-medium mt-2">
            Protocolo copiado!
          </p>
        )}
      </div>

      {/* Orientações */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 max-w-md mx-auto text-left">
        <div className="flex items-center gap-2 mb-2">
          <FileText size={16} className="text-blue-600" />
          <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
            Orientações
          </p>
        </div>
        <ul className="text-sm text-blue-800 space-y-1">
          <li> A prefeitura responderá em até <strong>{prazoTexto}</strong></li>
          <li> Use o protocolo para consultar o andamento</li>
          <li> Mantenha seu e-mail atualizado para receber a resposta</li>
        </ul>
      </div>

      {/* Botões */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          onClick={onReset}
          className="px-6 py-2.5 bg-[#173572] text-white rounded-xl font-bold text-sm hover:bg-[#0f2847] transition-colors"
        >
          Fazer novo pedido
        </button>
        <a
          href={`/${canal}/consultar`}
          className="px-6 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-50 transition-colors"
        >
          Consultar protocolo
        </a>
      </div>
    </div>
  );
}
