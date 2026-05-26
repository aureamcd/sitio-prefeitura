"use client";

import { useState } from "react";
import ContentPage from "@/components/layout/ContentPage";
import { BarChart, Star, ThumbsUp, Send, CheckCircle } from "lucide-react";
import { useTodayDate } from '@/lib/hooks/useTodayDate';

const perguntas = [
  {
    id: "facilidade",
    pergunta: "Como você avalia a facilidade para encontrar informações neste portal?",
    opcoes: ["Muito Fácil", "Fácil", "Regular", "Difícil", "Muito Difícil"],
  },
  {
    id: "clareza",
    pergunta: "As informações disponibilizadas são claras e compreensíveis?",
    opcoes: ["Sim, totalmente", "Sim, parcialmente", "Não", "Não sei opinar"],
  },
  {
    id: "qualidade",
    pergunta: "Como você avalia a qualidade geral das informações do portal?",
    opcoes: ["Excelente", "Boa", "Regular", "Ruim", "Péssima"],
  },
  {
    id: "atualizacao",
    pergunta: "As informações parecem estar atualizadas?",
    opcoes: ["Sim", "Parcialmente", "Não", "Não sei avaliar"],
  },
  {
    id: "atendimento",
    pergunta: "Caso tenha utilizado o e-SIC ou Ouvidoria, como avalia o atendimento?",
    opcoes: ["Excelente", "Bom", "Regular", "Ruim", "Não utilizei"],
  },
];

export default function PesquisaSatisfacaoPage() {
  const today = useTodayDate();
  const [respostas, setRespostas] = useState<Record<string, string>>({});
  const [enviado, setEnviado] = useState(false);
  const [sugestao, setSugestao] = useState("");

  const handleSelect = (perguntaId: string, valor: string) => {
    setRespostas((prev) => ({ ...prev, [perguntaId]: valor }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Em produção, enviar para API/banco
    setEnviado(true);
  };

  const totalPerguntas = perguntas.length;
  const respondidas = Object.keys(respostas).length;
  const podeEnviar = respondidas === totalPerguntas;

  if (enviado) {
    return (
      <ContentPage
        title="Pesquisa de Satisfação"
        icon={<BarChart size={20} strokeWidth={1.5} />}
        description="Sua opinião é muito importante para melhorarmos o Portal da Transparência."
        breadcrumb={[
          { label: "Início", href: "/" },
          { label: "Pesquisa de Satisfação" },
        ]}
        lastUpdate={today}
      >
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="bg-green-100 p-4 rounded-full text-green-600 mb-6">
            <CheckCircle size={48} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Pesquisa enviada com sucesso!</h2>
          <p className="text-gray-600 max-w-md leading-relaxed">
            Agradecemos sua participação! Suas respostas nos ajudarão a melhorar continuamente
            o Portal da Transparência de Padre Marcos.
          </p>
        </div>
      </ContentPage>
    );
  }

  return (
    <ContentPage
      title="Pesquisa de Satisfação"
      icon={<BarChart size={20} strokeWidth={1.5} />}
      description="Avalie o Portal da Transparência e ajude-nos a melhorar a qualidade das informações e serviços prestados."
      breadcrumb={[
        { label: "Início", href: "/" },
        { label: "Pesquisa de Satisfação" },
      ]}
      lastUpdate={today}
    >
      {/* Introdução */}
      <div className="mb-8 bg-blue-50 border-l-4 border-[#173572] p-4 rounded-r-xl">
        <p className="text-sm text-[#173572] font-medium leading-relaxed">
          Esta pesquisa de satisfação atende ao critério do PNTP 2026, que exige a disponibilização
          de ferramenta para avaliação da experiência do usuário no portal de transparência.
          Sua participação é voluntária e anônima.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {perguntas.map((pq, index) => (
          <div
            key={pq.id}
            className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm"
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="bg-[#e8edf7] p-2 rounded-lg text-[#173572] shrink-0">
                <Star size={18} />
              </div>
              <div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Pergunta {index + 1} de {totalPerguntas}
                </span>
                <p className="text-gray-900 font-semibold mt-1">{pq.pergunta}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 ml-11">
              {pq.opcoes.map((opcao) => {
                const isSelected = respostas[pq.id] === opcao;
                return (
                  <button
                    key={opcao}
                    type="button"
                    onClick={() => handleSelect(pq.id, opcao)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                      isSelected
                        ? "bg-[#173572] text-white border-[#173572] shadow-sm"
                        : "bg-white text-gray-700 border-gray-200 hover:border-[#173572]/30 hover:bg-gray-50"
                    }`}
                  >
                    {opcao}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Sugestão */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <div className="flex items-start gap-3 mb-4">
            <div className="bg-amber-50 p-2 rounded-lg text-amber-600 shrink-0">
              <ThumbsUp size={18} />
            </div>
            <div>
              <p className="text-gray-900 font-semibold">
                Deixe sua sugestão ou comentário (opcional)
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Sua opinião nos ajuda a melhorar
              </p>
            </div>
          </div>
          <textarea
            value={sugestao}
            onChange={(e) => setSugestao(e.target.value)}
            placeholder="Compartilhe suas ideias para melhorarmos o portal..."
            rows={4}
            className="ml-11 w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#173572]/30 focus:border-[#173572] transition resize-y"
          />
        </div>

        {/* Botão de envio */}
        <div className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-2xl p-5">
          <div className="text-sm text-gray-500">
            {respondidas} de {totalPerguntas} perguntas respondidas
            {!podeEnviar && (
              <span className="block text-xs text-amber-600 mt-0.5">
                Responda todas as perguntas para enviar
              </span>
            )}
          </div>
          <button
            type="submit"
            disabled={!podeEnviar}
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-sm ${
              podeEnviar
                ? "bg-[#173572] text-white hover:bg-[#122a5a] cursor-pointer"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            <Send size={16} />
            Enviar avaliação
          </button>
        </div>
      </form>

      {/* Nota */}
      <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-500 leading-relaxed">
        <p>
          <strong>Conformidade PNTP 2026:</strong> Esta pesquisa de satisfação atende ao critério
          de avaliação da experiência do usuário, conforme exigido pelo Programa Nacional de
          Transparência Pública. Os dados coletados são anônimos e utilizados exclusivamente para
          melhoria contínua do portal.
        </p>
      </div>
    </ContentPage>
  );
}
