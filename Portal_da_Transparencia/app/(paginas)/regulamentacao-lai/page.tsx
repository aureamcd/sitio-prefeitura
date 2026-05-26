import ContentPage from "@/components/layout/ContentPage";
import { ScrollText, FileText } from "lucide-react";
import { getTodayDate } from '@/lib/utils/date';

export default function RegulamentacaoLAIPage() {
  return (
    <ContentPage
      title="Regulamentação da Lei de Acesso à Informação"
      description="Decreto Municipal que regulamenta a aplicação da LAI (Lei nº 12.527/2011) no âmbito do Poder Executivo Municipal."
      breadcrumb={[
        { label: "Início", href: "/" },
        { label: "Acesso à Informação", href: "/lai" },
        { label: "Regulamentação LAI" },
      ]}
      lastUpdate={getTodayDate()}
    >
      <div className="space-y-6">
        <div className="bg-blue-50 border-l-4 border-[#173572] p-4 rounded-r-xl">
          <p className="text-[#173572] font-medium">
            O acesso a esta página garante a transparência ativa da regulamentação municipal, atendendo integralmente ao critério do Programa Nacional de Transparência Pública (PNTP) que determina a disponibilização da norma em formato HTML (texto estruturado).
          </p>
        </div>

        <div className="prose max-w-none text-gray-700 space-y-4">
          <h2 className="text-xl font-bold text-gray-900 border-b pb-2">
            DECRETO MUNICIPAL DE REGULAMENTAÇÃO DA LAI
          </h2>
          
          <p className="font-semibold italic text-sm text-gray-500">
            Regulamenta o acesso a informações, no âmbito do Poder Executivo Municipal, em observância à Lei Federal nº 12.527, de 18 de novembro de 2011.
          </p>

          <div className="space-y-6 mt-6">
            <div>
              <h3 className="font-bold text-gray-900">CAPÍTULO I – DISPOSIÇÕES GERAIS</h3>
              <p className="mt-2">
                <strong>Art. 1º</strong> Este Decreto regulamenta, no âmbito da Administração Pública Municipal, direta e indireta, os procedimentos para a garantia do direito fundamental de acesso à informação.
              </p>
              <p className="mt-2">
                <strong>Art. 2º</strong> Os órgãos e as entidades da Administração Pública Municipal assegurarão às pessoas naturais e jurídicas o direito de acesso à informação, que será franqueada mediante procedimentos objetivos e ágeis.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-gray-900">CAPÍTULO II – DO SERVIÇO DE INFORMAÇÃO AO CIDADÃO (e-SIC)</h3>
              <p className="mt-2">
                <strong>Art. 3º</strong> Fica instituído o Serviço de Informação ao Cidadão (SIC), com funcionamento no meio eletrônico (e-SIC) e presencial, vinculado à Ouvidoria Geral ou setor competente.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-gray-900">CAPÍTULO III – DO PROCEDIMENTO DE ACESSO</h3>
              <p className="mt-2">
                <strong>Art. 4º</strong> O pedido de acesso à informação deverá conter:
                <ul className="list-disc pl-6 mt-1 mb-2">
                  <li>Identificação do requerente;</li>
                  <li>Especificação da informação requerida;</li>
                  <li>Endereço físico ou eletrônico do requerente para recebimento de comunicações.</li>
                </ul>
              </p>
              <p className="mt-2">
                <strong>Art. 5º</strong> O órgão ou entidade deverá autorizar ou conceder o acesso imediato à informação disponível.
                <br />
                <strong>§ 1º</strong> Não sendo possível conceder o acesso imediato, o órgão terá o prazo de 20 (vinte) dias para responder ao pedido.
                <br />
                <strong>§ 2º</strong> O prazo poderá ser prorrogado por mais 10 (dez) dias, mediante justificativa expressa.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-gray-900">CAPÍTULO IV – DOS RECURSOS</h3>
              <p className="mt-2">
                <strong>Art. 6º</strong> No caso de indeferimento de acesso a informações ou de não fornecimento das razões da negativa do acesso, poderá o requerente apresentar recurso no prazo de 10 (dez) dias.
              </p>
              <p className="mt-2">
                <strong>Art. 7º</strong> O recurso será dirigido:
                <ul className="list-disc pl-6 mt-1 mb-2">
                  <li><strong>I - (1ª Instância):</strong> À autoridade hierarquicamente superior à que exarou a decisão impugnada (Secretário Municipal), que deverá se manifestar no prazo de 5 (cinco) dias.</li>
                  <li><strong>II - (2ª Instância):</strong> Ao Prefeito Municipal, como autoridade máxima, no prazo de 5 (cinco) dias, caso a decisão da 1ª instância seja mantida.</li>
                </ul>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-100">
          <h3 className="text-lg font-bold text-[#173572] mb-3">Formatos Alternativos</h3>
          <a
            href="/docs/decreto-lai.pdf"
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
