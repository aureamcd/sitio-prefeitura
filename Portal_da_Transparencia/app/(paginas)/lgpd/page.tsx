import ContentPage from "@/components/layout/ContentPage";
import { ShieldCheck, User, Mail, FileText, AlertTriangle } from "lucide-react";
import { getTodayDate } from '@/lib/utils/date';

export default function LGPDPage() {
  return (
    <ContentPage
      title="Política de Privacidade e LGPD"
      description="Saiba como o município trata seus dados pessoais em conformidade com a Lei Geral de Proteção de Dados."
      breadcrumb={[
        { label: "Início", href: "/" },
        { label: "LGPD" },
      ]}
      lastUpdate={getTodayDate()}
    >
      <div className="space-y-6">

        <p className="text-gray-600 text-lg leading-relaxed">
          Este portal atende às exigências da Lei nº 13.709/2018 (Lei Geral de Proteção de Dados Pessoais — LGPD), garantindo a transparência no tratamento das informações dos cidadãos.
        </p>

        {/* ENCARREGADO */}
        <section className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-50 text-indigo-600 p-2.5 rounded-xl">
              <User size={22} />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Encarregado de Proteção de Dados (DPO)</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl p-4 space-y-1">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nome</span>
              <p className="text-sm font-semibold text-gray-800">Lorena Barros</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 space-y-1">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">E-mail de contato</span>
              <a href="mailto:lgpd@padremarcos.pi.gov.br" className="text-sm font-semibold text-blue-600 hover:underline block">
                lgpd@padremarcos.pi.gov.br
              </a>
            </div>
          </div>
          <p className="text-sm text-gray-500 italic">
            O encarregado é responsável por receber comunicações dos titulares de dados e da Autoridade Nacional de Proteção de Dados (ANPD).
          </p>
        </section>

        {/* POLÍTICA DE PRIVACIDADE */}
        <section className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 text-blue-600 p-2.5 rounded-xl">
              <ShieldCheck size={22} />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Política de Privacidade</h2>
          </div>

          <div className="space-y-4 text-gray-600 leading-relaxed">
            <p>
              A Prefeitura Municipal de Padre Marcos coleta e utiliza dados pessoais exclusivamente para finalidades legítimas, como:
            </p>
            <ul className="space-y-2">
              {[
                "Atendimento de solicitações feitas pelo cidadão (e-SIC, Ouvidoria, protocolos).",
                "Prestação de serviços públicos municipais.",
                "Cumprimento de obrigações legais e regulatórias.",
                "Envio de comunicações institucionais, quando autorizado.",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-1.5 w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* DIREITOS */}
        <section className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-green-50 text-green-600 p-2.5 rounded-xl">
              <FileText size={22} />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Seus direitos como titular de dados</h2>
          </div>

          <div className="space-y-4 text-gray-600 leading-relaxed">
            <p>Conforme a LGPD, você tem direito a:</p>
            <ol className="space-y-3">
              {[
                "Confirmação da existência de tratamento de seus dados.",
                "Acesso aos dados pessoais mantidos pelo município.",
                "Correção de dados incompletos, inexatos ou desatualizados.",
                "Eliminação de dados desnecessários ou excessivos.",
                "Portabilidade dos dados a outro fornecedor de serviço.",
                "Revogação do consentimento, quando aplicável.",
              ].map((step, i) => (
                <li key={i} className="flex items-center gap-4">
                  <span className="w-8 h-8 flex items-center justify-center bg-green-50 text-green-700 font-black text-sm rounded-lg shrink-0">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* COMO EXERCER */}
        <section className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-amber-50 text-amber-600 p-2.5 rounded-xl">
              <Mail size={22} />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Como exercer seus direitos</h2>
          </div>
          <p className="text-gray-600 leading-relaxed">
            Para exercer qualquer um dos direitos acima, entre em contato com o Encarregado de Proteção de Dados:
          </p>
          <a
            href="mailto:lgpd@padremarcos.pi.gov.br"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#173572] text-white rounded-xl font-bold text-sm hover:bg-[#122a5a] transition shadow-sm"
          >
            <Mail size={16} />
            Enviar solicitação por e-mail
          </a>
          <p className="text-sm text-gray-500 italic">
            Sua solicitação será respondida em até 15 dias úteis, conforme a legislação.
          </p>
        </section>

        {/* COOKIES */}
        <section className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-orange-50 text-orange-600 p-2.5 rounded-xl">
              <AlertTriangle size={22} />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Uso de cookies</h2>
          </div>
          <p className="text-gray-600 leading-relaxed">
            Este site utiliza apenas cookies essenciais para o funcionamento básico (navegação e segurança). Não utilizamos cookies de rastreamento ou publicidade. Nenhum dado pessoal é coletado de forma automática durante a navegação.
          </p>
        </section>

      </div>
    </ContentPage>
  );
}
