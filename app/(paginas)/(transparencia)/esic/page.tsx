/**
 * ========================================================
 * PÁGINA: e-SIC — Serviço de Informação ao Cidadão
 * ========================================================
 *
 * Estrutura (ordem de leitura conforme avaliação PNTP):
 *
 * 1. TOPO — Informações obrigatórias:
 *    - Destaque legal (LAI)
 *    - Atendimento presencial (endereço, telefone, e-mail, horário)
 *    - Responsáveis (Lorena Barros + Autoridade de Monitoramento)
 *    - Prazos e recursos
 *
 * 2. MEIO — Formulário eletrônico:
 *    - Título grande: "Faça seu pedido eletrônico aqui"
 *    - Campos: Nome, CPF/CNPJ, E-mail, Telefone, Mensagem
 *
 * 3. RODAPÉ — Dashboard + Documentos
 *
 * Conformidade: Lei nº 12.527/2011, PNTP 2026
 * @module app/(paginas)/(transparencia)/esic/page
 */
import ContentPage from "@/components/layout/ContentPage";
import InstitutionalForm from "@/components/institucional/InstitutionalForm";
import DashboardStats from "@/components/institucional/DashboardStats";
import { createServerClient } from "@/lib/supabase/server";
import type { FieldConfig } from "@/components/institucional/InstitutionalForm";
import {
  FileText,
  Clock,
  Info,
  Search,
  MapPin,
  Phone,
  Mail,
  User,
  Shield,
  FileEdit,
  CheckCircle2,
  Scale,
  Gavel,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

/* ── CAMPOS DO FORMULÁRIO ── */
const ESIC_FIELDS: FieldConfig[] = [
  {
    name: "nome",
    label: "Nome completo",
    type: "text",
    required: true,
    placeholder: "Seu nome completo",
    width: "full",
  },
  {
    name: "cpf",
    label: "CPF ou CNPJ (opcional)",
    type: "text",
    required: false,
    placeholder: "000.000.000-00 ou 00.000.000/0000-00",
    hint: "Opcional — utilizado apenas para identificação complementar do solicitante",
  },
  {
    name: "email",
    label: "E-mail",
    type: "email",
    required: true,
    placeholder: "seu@email.com",
    hint: "Para envio da resposta e consulta do protocolo",
  },
  {
    name: "telefone",
    label: "Telefone",
    type: "tel",
    required: false,
    placeholder: "(00) 00000-0000",
    hint: "Opcional — para contato alternativo",
  },
  {
    name: "orgao_destinatario",
    label: "Órgão destinatário (opcional)",
    type: "select",
    required: false,
    options: [
      { value: "Gabinete do Prefeito", label: "Gabinete do Prefeito" },
      { value: "Secretaria de Administração", label: "Secretaria de Administração" },
      { value: "Secretaria de Saúde", label: "Secretaria de Saúde" },
      { value: "Secretaria de Educação", label: "Secretaria de Educação" },
      { value: "Secretaria de Finanças", label: "Secretaria de Finanças" },
      { value: "Secretaria de Assistência Social", label: "Secretaria de Assistência Social" },
      { value: "Secretaria de Obras", label: "Secretaria de Obras" },
      { value: "Outro / Não sei informar", label: "Outro / Não sei informar" }
    ],
    hint: "Caso não saiba o órgão responsável, selecione 'Outro / Não sei informar'.",
  },
  {
    name: "descricao",
    label: "Mensagem — Descreva a informação que deseja",
    type: "textarea",
    required: true,
    placeholder:
      "Descreva de forma clara e objetiva a informação que deseja obter. Não é necessário justificar o motivo do pedido (Art. 10, §3º da LAI).",
    rows: 6,
    width: "full",
  },
];

/* ── COMPONENTE ── */
export default async function ESICPage() {
  const supabase = createServerClient();
  const { data } = await supabase
    .from("esic_solicitacoes")
    .select("updated_at")
    .order("updated_at", { ascending: false })
    .limit(1)
    .single();

  const lastUpdateDate = data?.updated_at
    ? new Date(data.updated_at).toISOString().split('T')[0]
    : "2026-05-14";

  return (
    <ContentPage
      title="Serviço de Informação ao Cidadão (e-SIC)"
      icon={<FileText size={20} strokeWidth={1.5} />}
      description="Canal oficial para solicitação de informações públicas, conforme a Lei de Acesso à Informação (LAI)."
      breadcrumb={[
        { label: "Início", href: "/" },
        { label: "e-SIC" },
      ]}
      lastUpdate={lastUpdateDate}
    >

      {/* ╔═══════════════════════════════════════╗
          ║  1. TOPO — INFO OBRIGATÓRIAS          ║
          ╚═══════════════════════════════════════╝ */}

      <div className="print:hidden">
        {/* Destaque legal */}
        <div className="mb-12">
          <div className="bg-[#173572] text-white p-4 rounded-xl shadow-sm mb-5 flex items-start sm:items-center gap-3 border-l-4 border-blue-400">
            <Info size={24} className="shrink-0 text-blue-200 mt-0.5 sm:mt-0" />
            <p className="font-medium text-[15px] leading-relaxed">
              O acesso à informação pública é um direito garantido a todos os cidadãos pela <strong>Lei Federal nº 12.527/2011 (LAI)</strong>.
            </p>
          </div>

          <p className="text-gray-700 leading-relaxed">
            O Serviço de Informação ao Cidadão (SIC) permite que qualquer pessoa, física ou jurídica, solicite
            acesso a informações públicas produzidas ou custodiadas pela Prefeitura Municipal de Padre Marcos,
            promovendo a transparência ativa e passiva da gestão pública.
          </p>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { icon: FileText, title: "Pedido sem justificativa", text: "O cidadão informa o que deseja acessar, sem precisar explicar o motivo." },
              { icon: Clock, title: "Prazo legal claro", text: "Resposta em até 20 dias, com possibilidade de prorrogação por mais 10 dias." },
              { icon: CheckCircle2, title: "Protocolo em tela", text: "Após o envio, o sistema gera um número para acompanhamento online." },
            ].map((item) => (
              <div key={item.title} className="rounded-xl border border-blue-100 bg-blue-50/45 p-4 shadow-sm">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-white text-[#173572] shadow-sm">
                  <item.icon size={18} />
                </div>
                <p className="font-bold text-[#173572] text-sm">{item.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-gray-600">{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── SEÇÃO: BASE LEGAL (DESTAQUE) ── */}
        <div className="mb-12">
          <h2 className="text-lg font-medium text-[#173572] mb-4 border-b border-[#e8edf7] pb-2 flex items-center gap-2">
            <Scale size={20} className="text-[#173572]/70" />
            Base Legal e Regulamentação
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                title: "Lei 12.527/2011",
                desc: "Lei de Acesso à Informação (Federal)",
                href: "https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2011/lei/l12527.htm",
                icon: FileText,
                color: "text-blue-600",
                bg: "bg-blue-50"
              },
              {
                title: "Decreto Municipal LAI",
                desc: "Regulamentação no Município",
                href: "/regulamentacao-lai",
                icon: Gavel,
                color: "text-indigo-600",
                bg: "bg-indigo-50"
              },
              {
                title: "Constituição Federal",
                desc: "Art. 5º, XXXIII - Direito de Acesso",
                href: "https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm#art5",
                icon: Scale,
                color: "text-emerald-600",
                bg: "bg-emerald-50"
              },
              {
                title: "Lei 13.709/2018",
                desc: "LGPD - Lei Geral de Proteção de Dados",
                href: "/lgpd",
                icon: ShieldCheck,
                color: "text-amber-600",
                bg: "bg-amber-50"
              }
            ].map((item) => (
              <a
                key={item.title}
                href={item.href}
                target={item.href.startsWith("http") ? "_blank" : undefined}
                rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
                className="group flex flex-col p-5 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:border-[#173572]/30 transition-all duration-300"
              >
                <div className={`w-12 h-12 ${item.bg} ${item.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <item.icon size={24} />
                </div>
                <h3 className="font-bold text-gray-900 group-hover:text-[#173572] transition-colors">{item.title}</h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{item.desc}</p>
                <div className="mt-4 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#173572] opacity-0 group-hover:opacity-100 transition-opacity">
                  Acessar <ExternalLink size={12} />
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Atendimento Presencial */}
        <div className="mb-12">
          <h2 className="text-lg font-medium text-[#173572] mb-3 border-b border-[#e8edf7] pb-1">
            Atendimento Presencial (SIC Físico)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pl-1">
            <div className="flex items-start gap-3">
              <MapPin size={18} className="text-[#173572] shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-gray-800">Endereço</p>
                <p className="text-gray-600 text-sm">Rua Anfrísio Macedo, 150, Centro – CEP 64.680-000, Padre Marcos – PI</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone size={18} className="text-[#173572] shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-gray-800">Telefone</p>
                <p className="text-gray-600 text-sm">(89) 98116-0296</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail size={18} className="text-[#173572] shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-gray-800">E-mail</p>
                <p className="text-gray-600 text-sm">prefeitura@padremarcos.gov.pi.br</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock size={18} className="text-[#173572] shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-gray-800">Horário de funcionamento</p>
                <p className="text-gray-600 text-sm">Segunda a sexta-feira, das 7h às 12h</p>
              </div>
            </div>
          </div>
        </div>

        {/* Responsáveis */}
        <div className="mb-12">
          <h2 className="text-lg font-medium text-[#173572] mb-3 border-b border-[#e8edf7] pb-1">
            Responsáveis
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-start gap-3 shadow-sm">
              <div className="bg-blue-50 p-2.5 rounded-lg">
                <User size={20} className="text-[#173572]" />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">
                  Servidora Responsável pelo Atendimento
                </p>
                <p className="font-bold text-gray-900">Lorena Barros</p>
                <p className="text-xs text-gray-500 mt-0.5">Serviço de Informação ao Cidadão</p>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-start gap-3 shadow-sm">
              <div className="bg-blue-50 p-2.5 rounded-lg">
                <Shield size={20} className="text-[#173572]" />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">
                  Autoridade de Monitoramento da LAI
                </p>
                <p className="font-bold text-gray-900">Autoridade de Monitoramento da LAI</p>
                <p className="text-xs text-gray-500 mt-0.5">Responsável pelo acompanhamento da LAI, conforme Art. 40 da Lei 12.527/2011</p>
              </div>
            </div>
          </div>
        </div>

        {/* Procedimento para Pedido e Recurso */}
        <div className="mb-12">
          <h2 className="text-lg font-medium text-[#173572] mb-3 border-b border-[#e8edf7] pb-1">
            Procedimento para Pedido e Recurso
          </h2>

          <div className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8 shadow-sm print:border-gray-300">
            <div className="relative space-y-6">
              <div className="hidden sm:block absolute left-5 top-5 bottom-5 w-px bg-blue-100"></div>

              {/* Etapa 1 */}
              <div className="flex flex-col sm:flex-row gap-4 items-start relative z-10">
                <div className="w-10 h-10 rounded-full border border-blue-200 bg-white text-[#173572] flex items-center justify-center shrink-0 shadow-sm ring-4 ring-blue-50">
                  <FileText size={24} />
                </div>
                <div className="space-y-3 flex-1 w-full">
                  <h3 className="font-bold text-[#173572] text-base">1. Realização do Pedido</h3>
                  <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
                    Os pedidos de acesso à informação poderão ser realizados através de dois canais oficiais:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="bg-gray-50 border border-gray-200/80 rounded-lg p-3.5 shadow-2xs">
                      <p className="text-xs font-black text-[#173572] uppercase tracking-wider mb-1">Cidadão Digital</p>
                      <p className="text-sm text-gray-800 font-medium">Eletronicamente, através do formulário online disponível nesta página.</p>
                    </div>
                    <div className="bg-gray-50 border border-gray-200/80 rounded-lg p-3.5 shadow-2xs">
                      <p className="text-xs font-black text-[#173572] uppercase tracking-wider mb-1">Atendimento Físico</p>
                      <p className="text-sm text-gray-800 font-medium">Presencialmente, junto ao Serviço de Informação ao Cidadão (SIC) da Prefeitura.</p>
                    </div>
                  </div>
                </div>
              </div>

              <hr className="border-gray-100" />

              {/* Etapa 2 */}
              <div className="flex flex-col sm:flex-row gap-4 items-start relative z-10">
                <div className="w-10 h-10 rounded-full border border-blue-200 bg-white text-[#173572] flex items-center justify-center shrink-0 shadow-sm ring-4 ring-blue-50">
                  <Clock size={24} />
                </div>
                <div className="space-y-2 flex-1">
                  <h3 className="font-bold text-[#173572] text-base">2. Prazos e Protocolo</h3>
                  <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
                    Após o envio do pedido, será gerado um número de protocolo único para acompanhamento. A Prefeitura Municipal tem o prazo legal de até <strong>20 dias</strong> para enviar a resposta oficial, podendo esse prazo ser prorrogado por mais <strong>10 dias</strong> mediante justificativa expressa (conforme Art. 11, §1º e §2º da Lei nº 12.527/2011).
                  </p>
                </div>
              </div>

              <hr className="border-gray-100" />

              {/* Etapa 3 */}
              <div className="flex flex-col sm:flex-row gap-4 items-start relative z-10">
                <div className="w-10 h-10 rounded-full border border-amber-200 bg-white text-amber-700 flex items-center justify-center shrink-0 shadow-sm ring-4 ring-amber-50">
                  <Shield size={24} />
                </div>
                <div className="space-y-3 flex-1 w-full">
                  <h3 className="font-bold text-amber-800 text-base">3. Recurso Administrativo</h3>
                  <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
                    Em caso de negativa de acesso à informação, ausência de resposta no prazo legal ou resposta considerada insatisfatória, o solicitante poderá interpor recurso administrativo no prazo de <strong>10 (dez) dias</strong>, contados da ciência da decisão.
                  </p>
                  <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-4 text-sm text-amber-900 space-y-2.5 shadow-2xs">
                    <p className="font-bold text-amber-800 text-xs uppercase tracking-wider">Passo a Passo para Interpor Recurso Eletrônico:</p>
                    <div className="space-y-2 text-amber-900/90 text-xs sm:text-sm font-medium">
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-amber-200 bg-white text-[11px] font-black text-amber-800 shadow-sm">
                          1
                        </span>
                        <span>Acesse o <strong>Formulário de Solicitação</strong> disponível abaixo nesta mesma página;</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-amber-200 bg-white text-[11px] font-black text-amber-800 shadow-sm">
                          2
                        </span>
                        <span>Preencha seus dados de identificação (Nome e E-mail);</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-amber-200 bg-white text-[11px] font-black text-amber-800 shadow-sm">
                          3
                        </span>
                        <span>
                          No campo <strong>Mensagem</strong>, inicie informando expressamente o número do protocolo anterior (
                          <span className="font-bold text-amber-800">Exemplo:</span>{" "}
                          <div className="mt-2 inline-flex items-center gap-2.5 rounded-xl border-2 border-dashed border-amber-300 bg-amber-50 px-4 py-2 font-mono text-sm font-black text-amber-950 shadow-sm ring-4 ring-amber-50/50 transition-all hover:bg-amber-100/70">
                            <Shield size={16} className="text-amber-600" />
                            RECURSO - PROTOCOLO ESIC-2026-00001
                          </div>
                          );
                        </span>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-amber-200 bg-white text-[11px] font-black text-amber-800 shadow-sm">
                          4
                        </span>
                        <span>Apresente as razões e justificativas pelas quais considera a resposta insatisfatória ou indevidamente negada.</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-500 text-xs leading-relaxed italic">
                    O recurso será dirigido à autoridade hierarquicamente superior competente e, quando aplicável, à Autoridade de Monitoramento da LAI, sendo apreciado dentro dos prazos legais. Também é possível interpor presencialmente no SIC Físico.
                  </p>
                </div>
              </div>
            </div>

            {/* Cards de Resumo */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-gray-100 print:hidden">
              <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl text-center shadow-2xs">
                <span className="block text-[11px] text-[#173572] font-black uppercase tracking-wider mb-1">Prazo de Resposta</span>
                <span className="text-3xl font-black text-[#173572]">20</span>
                <span className="text-xs text-gray-500 font-medium block mt-0.5">dias corridos</span>
              </div>
              <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl text-center shadow-2xs">
                <span className="block text-[11px] text-[#173572] font-black uppercase tracking-wider mb-1">Prorrogação</span>
                <span className="text-3xl font-black text-[#173572]">+10</span>
                <span className="text-xs text-gray-500 font-medium block mt-0.5">mediante justificativa</span>
              </div>
              <div className="bg-amber-50/50 border border-amber-100 p-4 rounded-xl text-center shadow-2xs">
                <span className="block text-[11px] text-amber-800 font-black uppercase tracking-wider mb-1">Recurso</span>
                <span className="text-3xl font-black text-amber-700">10</span>
                <span className="text-xs text-amber-700/80 font-medium block mt-0.5">dias para interpor</span>
              </div>
            </div>
          </div>
        </div>

        {/* Diferença e-SIC vs Ouvidoria */}
        <div className="mb-12">
          <h2 className="text-lg font-medium text-[#173572] mb-2 border-b border-[#e8edf7] pb-1">
            Diferença entre e-SIC e Ouvidoria
          </h2>
          <div className="border-l-[3px] border-[#173572] pl-4 py-1">
            <p className="text-[#374151] mb-3">
              O e-SIC é utilizado exclusivamente para <strong>solicitações de acesso a informações públicas</strong>.
            </p>
            <p className="text-[#173572] text-[15px] leading-relaxed">
              Para manifestações como reclamações, denúncias, sugestões ou elogios,
              utilize a <a href="/ouvidoria" className="font-bold underline decoration-2 underline-offset-2 hover:text-[#0f2847] transition-colors">Ouvidoria</a>.
            </p>
          </div>
        </div>


        {/* ╔═══════════════════════════════════════╗
          ║  2. MEIO — FORMULÁRIO ELETRÔNICO      ║
          ╚═══════════════════════════════════════╝ */}

        <div className="mb-12 mt-12 overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-b from-blue-50/80 to-white px-6 py-10 shadow-sm sm:px-10 sm:pt-14 sm:pb-10">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-black text-[#173572] mb-4 flex items-center justify-center gap-3">
              <FileEdit size={32} className="text-[#173572]/80" /> Faça seu pedido eletrônico aqui
            </h2>
            <p className="text-gray-500 max-w-lg mx-auto text-sm">
              Após o envio, você receberá um <strong>número de protocolo</strong> para acompanhamento da solicitação.
            </p>
          </div>

          <div className="mb-8 flex items-center justify-center">
            <Link
              href="/esic/consultar"
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-[#173572] bg-blue-100/50 border border-blue-200/50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Search size={16} />
              Já possui um protocolo? Consulte aqui
            </Link>
          </div>

          <div className="bg-white border border-blue-100 p-6 rounded-xl shadow-sm">
            <InstitutionalForm
              title="Formulário de Solicitação"
              description="Não é necessário justificar o motivo do pedido (Art. 10, §3º da LAI)."
              fields={ESIC_FIELDS}
              apiUrl="/api/esic"
              canal="esic"
              formId="form-esic"
            />
          </div>
        </div>
      </div>

      {/* Cabeçalho exclusivo para impressão (PDF) */}
      <div className="hidden print:block text-center mb-10">
        <h1 className="text-2xl font-bold uppercase tracking-widest text-black">Relatório Estatístico e-SIC</h1>
        <p className="text-sm font-bold mt-1 text-gray-700">Prefeitura Municipal de Padre Marcos - PI</p>
        <p className="text-xs text-gray-500 mt-2">Transparência Pública • Gerado em: {new Date().toLocaleDateString("pt-BR")}</p>
        <hr className="my-6 border-black/20" />
      </div>


      {/* ╔═══════════════════════════════════════╗
          ║  3. RODAPÉ — DASHBOARD + DOCUMENTOS   ║
          ╚═══════════════════════════════════════╝ */}

      <div className="mb-7">
        <h2 className="text-lg font-medium text-[#173572] mb-2 border-b border-[#e8edf7] pb-1">
          Informações e relatórios da LAI
        </h2>

        <div className="mb-6">
          <DashboardStats
            apiUrl="/api/esic/stats"
            title="Estatísticas de Pedidos de Informação"
            canal="esic"
          />
        </div>

        {/* Declaração de Não Ocorrência */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6">
          <h3 className="text-amber-800 font-bold mb-2">Declaração de Não Ocorrência (2023 a 2025)</h3>
          <p className="text-amber-700 text-sm leading-relaxed">
            Declaramos, para os devidos fins de cumprimento do Programa Nacional de Transparência Pública (PNTP 2026), que o sistema de solicitação eletrônica de informações (e-SIC) foi implantado no exercício corrente pela Administração Municipal, razão pela qual não constam registros de pedidos eletrônicos de acesso à informação ou relatórios estatísticos relativos aos exercícios de 2023, 2024 e 2025.
          </p>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 md:p-6 print:hidden">

            <h3 className="font-semibold text-[#173572] mb-4 flex items-center gap-2 text-base md:text-lg">
              <Shield size={20} /> Informações Classificadas e Desclassificadas
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-2.5 text-sm text-[#173572] bg-blue-50/70 p-3.5 rounded-lg border border-blue-100">
                <Info size={18} className="shrink-0 mt-0.5" />
                <p className="font-medium">
                  Não existem informações classificadas em grau de sigilo (reservado, secreto ou ultrassecreto) no período apurado e nos últimos 3 anos.
                </p>
              </div>
              <div className="flex items-start gap-2.5 text-sm text-[#173572] bg-blue-50/70 p-3.5 rounded-lg border border-blue-100">
                <Info size={18} className="shrink-0 mt-0.5" />
                <p className="font-medium">
                  Não houve desclassificação de informações sigilosas nos últimos 3 anos.
                </p>
              </div>
            </div>
        </div>
      </div>

    </ContentPage>
  );
}
