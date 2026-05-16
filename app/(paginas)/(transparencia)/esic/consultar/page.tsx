/**
 * ========================================================
 * PÁGINA: Consulta de Protocolo e-SIC
 * ========================================================
 * Cidadão consulta andamento usando protocolo + e-mail ou CPF.
 * Exibe: status, data, resposta, prazo, prorrogação.
 *
 * @module app/(paginas)/(transparencia)/esic/consultar/page
 */
"use client";

import { useState, FormEvent } from "react";
import ContentPage from "@/components/layout/ContentPage";
import StatusBadge from "@/components/institucional/StatusBadge";
import Toast, { ToastData } from "@/components/institucional/Toast";
import type { EsicConsultaResultado } from "@/lib/types/esic";
import {
  Search, Loader2, Inbox, Calendar,
  Clock, MessageSquare, ArrowLeft, AlertCircle, Shield, Paperclip,
} from "lucide-react";
import Link from "next/link";

function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function formatarDataCurta(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR");
}

export default function ConsultarEsicPage() {
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<EsicConsultaResultado | null>(null);
  const [buscaFeita, setBuscaFeita] = useState(false);
  const [toast, setToast] = useState<ToastData | null>(null);
  const [metodo, setMetodo] = useState<"email" | "cpf">("email");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setResultado(null);
    setBuscaFeita(false);

    const formData = new FormData(e.currentTarget);
    const protocolo = (formData.get("protocolo") as string)?.trim();
    const identificacao = (formData.get("identificacao") as string)?.trim();

    if (!protocolo || !identificacao) {
      setToast({ type: "error", message: "Preencha todos os campos." });
      setLoading(false);
      return;
    }

    try {
      const params = new URLSearchParams({ protocolo });
      if (metodo === "email") params.set("email", identificacao);
      else params.set("cpf", identificacao);

      const res = await fetch(`/api/esic/consultar?${params}`);
      const data = await res.json();

      if (!res.ok) {
        setToast({ type: "error", message: data.error || "Protocolo não encontrado." });
        setBuscaFeita(true);
        return;
      }

      setResultado(data);
      setBuscaFeita(true);
    } catch {
      setToast({ type: "error", message: "Erro ao consultar." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <ContentPage
      title="Consultar Protocolo e-SIC"
      icon={<Search size={20} strokeWidth={1.5} />}
      description="Acompanhe o andamento da sua solicitação de acesso à informação."
      breadcrumb={[
        { label: "Início", href: "/" },
        { label: "e-SIC", href: "/esic" },
        { label: "Consultar" },
      ]}
      lastUpdate="2026-05-14"
    >
      <div className="mb-6">
        <Link href="/esic" className="inline-flex items-center gap-2 text-sm text-[#173572] font-medium hover:underline">
          <ArrowLeft size={16} /> Voltar para o e-SIC
        </Link>
      </div>

      {/* Formulário */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 sm:p-6 mb-7">
        <h2 className="text-lg font-bold text-[#173572] mb-1">Consultar andamento</h2>
        <p className="text-sm text-gray-500 mb-5">
          Informe o protocolo e o e-mail ou CPF utilizados na solicitação.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="consulta-protocolo" className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
              Número do Protocolo <span className="text-red-400">*</span>
            </label>
            <input id="consulta-protocolo" name="protocolo" type="text" required
              placeholder="Ex: ESIC-2026-00001"
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#173572]/20 focus:border-[#173572] transition-all text-gray-900 text-sm uppercase"
            />
          </div>

          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
              Identificação <span className="text-red-400">*</span>
            </p>
            <div className="flex gap-2 mb-3">
              {(["email", "cpf"] as const).map((m) => (
                <button key={m} type="button" onClick={() => setMetodo(m)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                    metodo === m ? "bg-[#173572] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  {m === "email" ? "E-mail" : "CPF"}
                </button>
              ))}
            </div>
            <input id="consulta-id" name="identificacao"
              type={metodo === "email" ? "email" : "text"} required
              placeholder={metodo === "email" ? "seu@email.com" : "000.000.000-00"}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#173572]/20 focus:border-[#173572] transition-all text-gray-900 text-sm"
            />
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-3.5 bg-[#173572] text-white rounded-xl font-bold text-sm uppercase tracking-wider hover:bg-[#0f2847] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <><Search size={18} /> Consultar</>}
          </button>
        </form>
      </div>

      {/* Sem resultado */}
      {buscaFeita && !resultado && (
        <div className="text-center py-10">
          <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <Inbox size={28} className="text-gray-400" />
          </div>
          <h4 className="text-gray-600 font-semibold mb-1">Nenhum resultado encontrado</h4>
          <p className="text-sm text-gray-400">Verifique os dados e tente novamente.</p>
        </div>
      )}

      {/* Resultado */}
      {resultado && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-200 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Protocolo</p>
              <p className="text-xl font-black text-[#173572] tracking-wider">{resultado.protocolo}</p>
            </div>
            <StatusBadge status={resultado.status} canal="esic" size="md" />
          </div>

          <div className="p-5 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Calendar size={18} className="text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Data de abertura</p>
                  <p className="text-sm font-medium text-gray-700">{formatarData(resultado.created_at)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock size={18} className="text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Prazo de resposta</p>
                  <p className="text-sm font-medium text-gray-700">{formatarDataCurta(resultado.prazo_resposta)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar size={18} className="text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Última atualização</p>
                  <p className="text-sm font-medium text-gray-700">{formatarData(resultado.updated_at)}</p>
                </div>
              </div>
              {resultado.respondido_em && (
                <div className="flex items-start gap-3">
                  <Calendar size={18} className="text-green-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Respondido em</p>
                    <p className="text-sm font-medium text-green-700">{formatarData(resultado.respondido_em)}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Sua solicitação</p>
              <p className="text-sm text-gray-700 leading-relaxed">{resultado.descricao}</p>
            </div>

            {resultado.resposta && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare size={16} className="text-green-600" />
                  <p className="text-[10px] font-bold text-green-600 uppercase tracking-wider">Resposta da Prefeitura</p>
                </div>
                <p className="text-sm text-green-800 leading-relaxed whitespace-pre-wrap">{resultado.resposta}</p>
              </div>
            )}

            {resultado.resposta_anexo_url && (
              <a
                href={resultado.resposta_anexo_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-green-200 bg-white px-4 py-2.5 text-sm font-bold text-green-700 hover:bg-green-50"
              >
                <Paperclip size={16} />
                Baixar anexo da resposta
              </a>
            )}

            {resultado.justificativa_indeferimento && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle size={16} className="text-red-600" />
                  <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider">Justificativa do Indeferimento</p>
                </div>
                <p className="text-sm text-red-800 whitespace-pre-wrap">{resultado.justificativa_indeferimento}</p>
              </div>
            )}

            {resultado.data_prorrogacao && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock size={16} className="text-purple-600" />
                  <p className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">Prorrogação</p>
                </div>
                <p className="text-sm text-purple-800 mb-1"><strong>Novo prazo:</strong> {formatarDataCurta(resultado.data_prorrogacao)}</p>
                {resultado.motivo_prorrogacao && (
                  <p className="text-sm text-purple-700"><strong>Motivo:</strong> {resultado.motivo_prorrogacao}</p>
                )}
              </div>
            )}

            {(resultado.status === "respondido" || resultado.status === "indeferido") && (
              <div className="bg-blue-50/80 border border-blue-200 rounded-lg p-4 mt-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Shield size={16} className="text-[#173572]" />
                  <p className="text-[10px] font-bold text-[#173572] uppercase tracking-wider">Direito a Recurso</p>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Conforme a Lei de Acesso à Informação (Lei nº 12.527/2011), caso a resposta seja considerada insatisfatória ou o pedido tenha sido indeferido, você tem o direito de interpor <strong>recurso administrativo</strong> no prazo de até <strong>10 (dez) dias</strong> contados desta ciência.
                </p>
                <div className="bg-white/80 border border-blue-100 rounded-lg p-3 text-xs text-[#173572]">
                  <p className="font-bold uppercase tracking-wider mb-2">Passo a passo para recorrer online:</p>
                  <ul className="list-none space-y-1.5 text-gray-700 font-medium">
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-[#173572] shrink-0">1.</span>
                      <span>Clique no botão <strong>Novo Pedido e-SIC</strong> abaixo;</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-[#173572] shrink-0">2.</span>
                      <span>No campo Mensagem do novo formulário, informe logo no início o protocolo atual: <code className="bg-blue-100 text-[#173572] px-1.5 py-0.5 rounded font-bold">RECURSO - {resultado.protocolo}</code>;</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-[#173572] shrink-0">3.</span>
                      <span>Apresente as razões pelas quais considera a resposta insatisfatória.</span>
                    </li>
                  </ul>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-2 border-t border-blue-200/60">
                  <span className="text-xs text-gray-600 font-medium">Como apresentar o recurso?</span>
                  <div className="flex gap-2">
                    <Link href="/esic" className="px-3 py-1.5 bg-[#173572] text-white rounded-md text-xs font-bold hover:bg-[#0f2847] transition-colors">
                      Novo Pedido e-SIC
                    </Link>
                    <span className="px-3 py-1.5 bg-white border border-blue-200 text-gray-700 rounded-md text-xs font-medium">
                      Presencialmente no SIC
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </ContentPage>
  );
}
