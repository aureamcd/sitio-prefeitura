/**
 * ========================================================
 * PÁGINA: Ouvidoria Municipal
 * ========================================================
 * Estrutura profissional seguindo o padrão e-SIC.
 * Canal de manifestações (Lei 13.460/2017).
 *
 * @module app/(paginas)/(transparencia)/ouvidoria/page
 */
import ContentPage from "@/components/layout/ContentPage";
import InstitutionalForm from "@/components/institucional/InstitutionalForm";
import DashboardStats from "@/components/institucional/DashboardStats";
import { createServerClient } from "@/lib/supabase/server";
import type { FieldConfig } from "@/components/institucional/InstitutionalForm";
import {
  MessageCircle,
  Clock,
  Search,
  Info,
  MapPin,
  Phone,
  Mail,
  Shield,
  FileEdit,
  CheckCircle,
  ArrowRight,
  Lock,
  Lightbulb,
  ThumbsUp,
  MessageSquare,
  AlertTriangle,
  Megaphone,
  Scale,
  Gavel,
  ShieldCheck,
  ExternalLink,
  BookOpen,
  FileText,
} from "lucide-react";
import Link from "next/link";

/* ── CAMPOS DO FORMULÁRIO ── */
const OUVIDORIA_FIELDS: FieldConfig[] = [
  {
    name: "anonimo",
    label: "Deseja manter seus dados em sigilo?",
    type: "checkbox",
    width: "full",
    hint: "Ao marcar esta opção, sua identidade será preservada e tratada com restrição de acesso, conforme a LGPD e o sigilo de fonte.",
  },
  {
    name: "tipo",
    label: "Tipo de manifestação",
    type: "select",
    required: true,
    options: [
      { value: "sugestao", label: "Sugestão" },
      { value: "elogio", label: "Elogio" },
      { value: "solicitacao", label: "Solicitação" },
      { value: "reclamacao", label: "Reclamação" },
      { value: "denuncia", label: "Denúncia" },
    ],
    width: "full",
  },
  {
    name: "nome",
    label: "Nome completo",
    type: "text",
    required: true,
    placeholder: "Seu nome completo",
    width: "full"
  },
  {
    name: "email",
    label: "E-mail",
    type: "email",
    required: true,
    placeholder: "seu@email.com",
    hint: "Para envio da resposta e consulta do protocolo"
  },
  {
    name: "cpf",
    label: "CPF",
    type: "text",
    required: false,
    placeholder: "000.000.000-00",
    hint: "Opcional"
  },
  {
    name: "telefone",
    label: "Telefone",
    type: "tel",
    required: false,
    placeholder: "(00) 00000-0000"
  },
  {
    name: "orgao_destinatario",
    label: "Órgão / Setor destinatário (opcional)",
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
    hint: "Se não souber, selecione 'Outro'",
  },
  {
    name: "descricao",
    label: "Descrição da manifestação",
    type: "textarea",
    required: true,
    placeholder: "Descreva detalhadamente sua manifestação (fatos, datas, locais, etc).",
    rows: 6,
    width: "full",
  },
  {
    name: "anexo",
    label: "Anexar arquivo (opcional)",
    type: "file",
    required: false,
    hint: "Formatos aceitos: PDF, JPG, PNG. Tamanho máx: 10MB.",
    accept: ".pdf,.jpg,.jpeg,.png",
    width: "full",
  },
];

export default async function OuvidoriaPage() {
  const supabase = createServerClient();
  const { data } = await supabase
    .from("ouvidoria_manifestacoes")
    .select("updated_at")
    .order("updated_at", { ascending: false })
    .limit(1)
    .single();

  const lastUpdateDate = data?.updated_at
    ? new Date(data.updated_at).toISOString().split('T')[0]
    : "2026-05-15";

  return (
    <ContentPage
      title="Ouvidoria Municipal"
      icon={<MessageCircle size={20} strokeWidth={1.5} />}
      description="Canal oficial para envio de manifestações, denúncias e reclamações sobre os serviços públicos."
      breadcrumb={[
        { label: "Início", href: "/" },
        { label: "Ouvidoria" },
      ]}
      lastUpdate={lastUpdateDate}
    >

      {/* 1. TOPO — INFO OBRIGATÓRIAS */}
      <div className="print:hidden">
        {/* Destaque legal */}
        <div className="mb-12">
          <div className="bg-[#173572] text-white p-4 rounded-xl shadow-sm mb-5 flex items-start sm:items-center gap-3 border-l-4 border-blue-400">
            <Info size={24} className="shrink-0 text-blue-200 mt-0.5 sm:mt-0" />
            <p className="font-medium text-[15px] leading-relaxed">
              A Ouvidoria é o canal de interlocução entre o cidadão e a Administração Pública, conforme a <strong>Lei Federal nº 13.460/2017</strong>.
            </p>
          </div>

          <p className="text-gray-700 leading-relaxed">
            Este é o espaço para você apresentar denúncias, reclamações, sugestões, elogios e solicitações de providências. Sua manifestação é essencial para a melhoria contínua dos serviços prestados pela Prefeitura de Padre Marcos.
          </p>

          <div className="mt-4 bg-amber-50 border border-amber-200 p-4 rounded-xl text-sm text-amber-800 flex items-center gap-3">
            <Phone size={18} className="shrink-0" />
            <p>
              <strong>Fale Conosco:</strong> Se você deseja apenas um contato direto ou tirar dúvidas rápidas, também pode utilizar este canal de Ouvidoria para ser encaminhado ao setor responsável.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { title: "Sugestão", text: "Ideias para melhorar serviços públicos.", icon: Lightbulb, color: "bg-amber-100 text-amber-700 border-amber-200" },
              { title: "Elogio", text: "Reconhecimento a atendimento ou serviço.", icon: ThumbsUp, color: "bg-green-100 text-green-700 border-green-200" },
              { title: "Solicitação", text: "Pedido de providência ou serviço.", icon: MessageSquare, color: "bg-blue-100 text-[#173572] border-blue-200" },
              { title: "Reclamação", text: "Insatisfação com serviço prestado.", icon: AlertTriangle, color: "bg-orange-100 text-orange-700 border-orange-200" },
              { title: "Denúncia", text: "Comunicação de irregularidade.", icon: Megaphone, color: "bg-red-100 text-red-700 border-red-200" },
            ].map((item) => (
              <div key={item.title} className="group rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-1">
                <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${item.color} shadow-sm group-hover:scale-110 transition-transform`}>
                  <item.icon size={20} />
                </div>
                <p className="text-sm font-bold text-gray-900">{item.title}</p>
                <p className="mt-1.5 text-[11px] leading-relaxed text-gray-500">{item.text}</p>
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
                title: "Lei 13.460/2017",
                desc: "Lei de Defesa dos Direitos do Usuário",
                href: "https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2017/lei/l13460.htm",
                icon: FileText,
                color: "text-blue-600",
                bg: "bg-blue-50"
              },
              {
                title: "Carta de Serviços",
                desc: "Direitos, deveres e etapas de cada serviço",
                href: "/carta-servicos",
                icon: BookOpen,
                color: "text-indigo-600",
                bg: "bg-indigo-50"
              },
              {
                title: "Constituição Federal",
                desc: "Art. 37, §3º - Participação e Defesa",
                href: "https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm#art37",
                icon: Scale,
                color: "text-emerald-600",
                bg: "bg-emerald-50"
              },
              {
                title: "Lei 13.709/2018",
                desc: "LGPD - Proteção de dados e sigilo do denunciante",
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
            Atendimento Presencial (Ouvidoria Física)
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
                <p className="text-gray-600 text-sm">prefeitura@padremarcos.pi.gov.br</p>
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

        {/* Fluxo do Atendimento */}
        <div className="mb-12">
          <h2 className="text-lg font-medium text-[#173572] mb-3 border-b border-[#e8edf7] pb-1">
            Como funciona o atendimento
          </h2>

          <div className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="grid grid-cols-1 gap-6 relative">
              {/* Timeline Line (desktop only) */}
              <div className="hidden sm:block absolute left-5 top-5 bottom-5 w-px bg-blue-100"></div>

              {[
                { step: 1, title: "Recebimento da manifestação", desc: "Sua manifestação é registrada no sistema e um número de protocolo é gerado imediatamente." },
                { step: 2, title: "Análise pela Ouvidoria", desc: "A equipe da Ouvidoria analisa o conteúdo para validar se há informações suficientes." },
                { step: 3, title: "Encaminhamento ao setor responsável", desc: "A manifestação é enviada à secretaria ou órgão competente para apuração dos fatos." },
                { step: 4, title: "Apuração e resposta", desc: "O setor responsável responde à Ouvidoria, que valida a resposta para garantir clareza ao cidadão." },
                { step: 5, title: "Encerramento do protocolo", desc: "A resposta final é enviada ao cidadão e o protocolo é encerrado no sistema." },
              ].map((item, idx) => (
                <div key={idx} className="flex gap-4 items-start relative z-10">
                  <div className="w-10 h-10 rounded-full border border-blue-200 bg-white text-[#173572] flex items-center justify-center shrink-0 font-black text-sm shadow-sm ring-4 ring-blue-50">
                    {item.step}
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-[#173572] text-base">{item.title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Prazo Card */}
            <div className="mt-8 bg-blue-50/50 border border-blue-100 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="bg-white p-3 rounded-xl text-blue-600 shadow-sm shrink-0">
                <Clock size={24} />
              </div>
              <div>
                <p className="text-[#173572] font-bold text-sm uppercase tracking-wider">Prazo Legal</p>
                <p className="text-gray-700 text-sm">
                  O prazo para resposta é de até <strong>30 dias</strong>, prorrogáveis por mais 30 mediante justificativa (Lei 13.460/2017).
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Diferença e-SIC vs Ouvidoria */}
        <div className="mb-12">
          <h2 className="text-lg font-medium text-[#173572] mb-2 border-b border-[#e8edf7] pb-1">
            Diferença entre Ouvidoria e e-SIC
          </h2>
          <div className="border-l-[3px] border-[#173572] pl-4 py-1">
            <p className="text-[#374151] mb-3 text-[15px]">
              A <strong>Ouvidoria</strong> recebe manifestações de natureza subjetiva (elogios, reclamações, denúncias).
            </p>
            <p className="text-[#173572] text-[15px] leading-relaxed">
              Para pedidos de dados técnicos ou documentos específicos, utilize o <a href="/esic" className="font-bold underline decoration-2 underline-offset-2 hover:text-[#0f2847] transition-colors">e-SIC (Acesso à Informação)</a>.
            </p>
          </div>
        </div>



        {/* Sigilo e Proteção de Dados */}
        <div className="mb-12">
          <h2 className="text-lg font-medium text-[#173572] mb-3 border-b border-[#e8edf7] pb-1">
            Sigilo e proteção de dados
          </h2>
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 sm:p-8">
            <div className="flex flex-col md:flex-row gap-8">
              <div className="md:w-1/3 flex flex-col items-center justify-center text-center p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="bg-green-100 p-4 rounded-full text-green-700 mb-4">
                  <Lock size={32} />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Ambiente Seguro</h3>
                <p className="text-xs text-gray-500">Seus dados são criptografados e o acesso é restrito apenas aos agentes públicos responsáveis.</p>
              </div>
              <div className="md:w-2/3 space-y-4">
                <div className="flex gap-4">
                  <CheckCircle size={20} className="text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-gray-800 text-sm">Denúncias podem ser sigilosas</p>
                    <p className="text-sm text-gray-600">O denunciante pode solicitar a proteção de sua identidade, que será preservada pela Ouvidoria em todos os trâmites.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <CheckCircle size={20} className="text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-gray-800 text-sm">Dados pessoais protegidos</p>
                    <p className="text-sm text-gray-600">Informações como CPF, telefone e e-mail não são divulgadas para os setores denunciados ou reclamados.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <CheckCircle size={20} className="text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-gray-800 text-sm">Tratamento conforme LGPD</p>
                    <p className="text-sm text-gray-600">A Prefeitura Municipal cumpre integralmente a Lei Geral de Proteção de Dados (Lei 13.709/2018) no tratamento de suas informações.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. MEIO — FORMULÁRIO ELETRÔNICO */}
        <div className="mb-12 mt-12 overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-b from-blue-50/80 to-white px-6 py-10 shadow-sm sm:px-10 sm:pt-14 sm:pb-10">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-black text-[#173572] mb-4 flex items-center justify-center gap-3">
              <FileEdit size={32} className="text-[#173572]/80" /> Registrar manifestação online
            </h2>
            <p className="text-gray-500 max-w-lg mx-auto text-sm">
              Preencha os campos abaixo para enviar sua manifestação. Você receberá um <strong>número de protocolo</strong> para acompanhar o andamento.
            </p>
          </div>

          <div className="mb-8 flex items-center justify-center">
            <Link
              href="/ouvidoria/consultar"
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-[#173572] bg-blue-100/50 border border-blue-200/50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Search size={16} />
              Já possui um protocolo? Consulte aqui
            </Link>
          </div>

          <div className="bg-white border border-blue-100 p-6 rounded-xl shadow-sm">
            <InstitutionalForm
              title="Formulário de Ouvidoria"
              description="Escolha o tipo e descreva detalhadamente sua manifestação."
              fields={OUVIDORIA_FIELDS}
              apiUrl="/api/ouvidoria"
              canal="ouvidoria"
              formId="form-ouvidoria"
            />
          </div>
        </div>

        {/* 3. RODAPÉ — DASHBOARD */}
        <div className="mb-7">
          <h2 className="text-lg font-medium text-[#173572] mb-2 border-b border-[#e8edf7] pb-1">
            Estatísticas de Atendimento
          </h2>
          <div className="mb-6">
            <DashboardStats
              apiUrl="/api/ouvidoria/stats"
              title="Indicadores da Ouvidoria Municipal"
              canal="ouvidoria"
            />
          </div>


        </div>
      </div>

    </ContentPage>
  );
}
