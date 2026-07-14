import ContentPage from "@/components/layout/ContentPage";
import { Monitor, FileText } from "lucide-react";
import { getTodayDate } from '@/lib/utils/date';

export default function RegulamentacaoGovernoDigitalPage() {
  return (
    <ContentPage
      title="Regulamentação do Governo Digital"
      description="Decreto Municipal que regulamenta a aplicação da Lei Federal nº 14.129/2021 no âmbito do Poder Executivo Municipal."
      breadcrumb={[
        { label: "Início", href: "/" },
        { label: "LGPD e Governo Digital", href: "/lgpd" },
        { label: "Regulamentação Governo Digital" },
      ]}
      lastUpdate={getTodayDate()}
    >
      <div className="space-y-6">
        <div className="bg-blue-50 border-l-4 border-[#173572] p-4 rounded-r-xl">
          <p className="text-[#173572] font-medium">
            O acesso a esta página garante a transparência ativa da regulamentação municipal, atendendo integralmente ao
            critério 15.5 do Programa Nacional de Transparência Pública (PNTP), que determina a disponibilização da
            normativa local da Lei nº 14.129/2021 (Governo Digital) em formato HTML.
          </p>
        </div>

        <div className="prose max-w-none text-gray-700 space-y-4">
          <h2 className="text-xl font-bold text-gray-900 border-b pb-2">
            DECRETO MUNICIPAL DE REGULAMENTAÇÃO DO GOVERNO DIGITAL
          </h2>

          <p className="font-semibold italic text-sm text-gray-500">
            Regulamenta a Lei Federal nº 14.129, de 29 de março de 2021, que dispõe sobre princípios, regras e
            instrumentos para o Governo Digital e para o aumento da eficiência pública, no âmbito da Administração
            Pública Municipal direta e indireta.
          </p>

          <div className="space-y-6 mt-6">
            <div>
              <h3 className="font-bold text-gray-900">CAPÍTULO I – DISPOSIÇÕES PRELIMINARES</h3>
              <p className="mt-2">
                <strong>Art. 1º</strong> Fica instituída a Política Municipal de Governo Digital, com o objetivo de
                estabelecer diretrizes para a transformação digital da Administração Pública Municipal, visando à
                desburocratização, à modernização, ao fortalecimento da transparência e à ampliação do acesso a serviços
                públicos por meios digitais.
              </p>
              <p className="mt-2">
                <strong>Art. 2º</strong> Para os fins deste Decreto, considera-se:
              </p>
              <ul className="list-disc pl-6 mt-1 space-y-1">
                <li><strong>I – Autosserviço:</strong> acesso pelo cidadão a serviço público sem necessidade de mediação presencial, por meio de plataforma digital;</li>
                <li><strong>II – Dados Abertos:</strong> dados públicos disponibilizados em formatos estruturados, legíveis por máquina e de livre utilização;</li>
                <li><strong>III – Governo Digital:</strong> utilização de tecnologias digitais para aprimorar a prestação de serviços públicos e a participação social;</li>
                <li><strong>IV – Plataforma de Governo Digital:</strong> ferramenta tecnológica centralizada que integra e disponibiliza serviços públicos digitais;</li>
                <li><strong>V – Assinatura Eletrônica:</strong> comprovação de autoria e integridade de documentos em meio eletrônico.</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-gray-900">CAPÍTULO II – PRINCÍPIOS E DIRETRIZES</h3>
              <p className="mt-2">
                <strong>Art. 3º</strong> A Política Municipal de Governo Digital observará os seguintes princípios:
              </p>
              <ul className="list-disc pl-6 mt-1 space-y-1">
                <li><strong>I –</strong> Centralidade no cidadão, garantindo serviços simplificados e acessíveis;</li>
                <li><strong>II –</strong> Desburocratização e simplificação de processos administrativos;</li>
                <li><strong>III –</strong> Transparência e controle social das ações governamentais;</li>
                <li><strong>IV –</strong> Interoperabilidade entre sistemas e órgãos da Administração Municipal;</li>
                <li><strong>V –</strong> Proteção de dados pessoais, em conformidade com a Lei Federal nº 13.709/2018 (LGPD);</li>
                <li><strong>VI –</strong> Acessibilidade digital, assegurando a inclusão de pessoas com deficiência;</li>
                <li><strong>VII –</strong> Inovação e uso de tecnologias abertas;</li>
                <li><strong>VIII –</strong> Eficiência e economicidade na prestação dos serviços públicos.</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-gray-900">CAPÍTULO III – DOS SERVIÇOS PÚBLICOS DIGITAIS</h3>
              <p className="mt-2">
                <strong>Art. 4º</strong> Os órgãos da Administração Municipal deverão disponibilizar, preferencialmente
                por meio digital, os serviços públicos que não exijam presença física obrigatória do cidadão.
              </p>
              <p className="mt-2">
                <strong>Art. 5º</strong> É assegurado ao cidadão o direito de acesso gratuito às plataformas de Governo
                Digital do município, sendo vedada a cobrança de taxas para a realização de solicitações por meio
                eletrônico.
              </p>
              <p className="mt-2">
                <strong>Art. 6º</strong> A Administração Municipal manterá atualizada a Carta de Serviços ao Usuário,
                disponível em formato digital, contendo a relação dos serviços prestados, as formas de acesso, os
                documentos necessários, as etapas do processo e os prazos de atendimento.
              </p>
              <p className="mt-2">
                <strong>Art. 7º</strong> Os sistemas eletrônicos utilizados pela Administração Municipal deverão garantir:
              </p>
              <ul className="list-disc pl-6 mt-1 space-y-1">
                <li><strong>I –</strong> A autenticidade e a integridade das informações por meio de assinatura eletrônica, nos termos da legislação federal;</li>
                <li><strong>II –</strong> O registro de protocolo digital para todas as solicitações recebidas;</li>
                <li><strong>III –</strong> A tramitação eletrônica de processos administrativos, quando couber.</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-gray-900">CAPÍTULO IV – DA TRANSPARÊNCIA E DADOS ABERTOS</h3>
              <p className="mt-2">
                <strong>Art. 8º</strong> A Administração Municipal disponibilizará dados públicos em formatos abertos e
                estruturados (CSV, JSON, XML), permitindo o acesso automatizado por sistemas externos e a reutilização
                das informações.
              </p>
              <p className="mt-2">
                <strong>Art. 9º</strong> A página de Dados Abertos do Portal da Transparência conterá as regras de
                utilização, a licença aplicável e a periodicidade de atualização dos datasets disponíveis.
              </p>
              <p className="mt-2">
                <strong>Art. 10.</strong> A Administração Municipal realizará pesquisas periódicas de satisfação dos
                usuários dos serviços públicos, divulgando seus resultados no Portal da Transparência, como instrumento
                de avaliação e melhoria contínua.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-gray-900">CAPÍTULO V – DA GOVERNANÇA E IMPLEMENTAÇÃO</h3>
              <p className="mt-2">
                <strong>Art. 11.</strong> Fica designado o setor de Tecnologia da Informação como órgão gestor da
                Política Municipal de Governo Digital, competindo-lhe:
              </p>
              <ul className="list-disc pl-6 mt-1 space-y-1">
                <li><strong>I –</strong> Coordenar a implementação das diretrizes deste Decreto;</li>
                <li><strong>II –</strong> Propor cronograma de digitalização dos serviços públicos municipais;</li>
                <li><strong>III –</strong> Garantir a interoperabilidade dos sistemas municipais;</li>
                <li><strong>IV –</strong> Monitorar a qualidade e a disponibilidade dos serviços digitais prestados.</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-gray-900">CAPÍTULO VI – DISPOSIÇÕES FINAIS</h3>
              <p className="mt-2">
                <strong>Art. 12.</strong> Este Decreto deverá ser observado em consonância com a Lei Federal nº
                12.527/2011 (Lei de Acesso à Informação), com a Lei Federal nº 13.709/2018 (Lei Geral de Proteção de
                Dados Pessoais), com a Lei Federal nº 14.133/2021 (Lei de Licitações e Contratos) e com a legislação
                municipal correlata.
              </p>
              <p className="mt-2">
                <strong>Art. 13.</strong> Este Decreto entra em vigor na data de sua publicação, produzindo seus efeitos
                a partir de então.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-100">
          <h3 className="text-lg font-bold text-[#173572] mb-3">Formatos Alternativos</h3>
          <a
            href="/docs/decreto-governo-digital.pdf"
            target="_blank"
            className="inline-flex items-center gap-2 bg-gray-50 border border-gray-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
          >
            <FileText size={18} className="text-red-500" />
            Baixar versão em PDF assinada
          </a>
        </div>
      </div>
    </ContentPage>
  );
}
