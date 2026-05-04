import ContentPage from "@/components/layout/ContentPage";
import { Newspaper, ExternalLink, FileText, Info } from "lucide-react";

export default function DiarioOficialPage() {
  return (
    <ContentPage
      title="Diário Oficial"
      description="Acesse as publicações oficiais do município no Diário Oficial dos Municípios do Estado do Piauí."
      breadcrumb={[
        { label: "Início", href: "/" },
        { label: "Diário Oficial" },
      ]}
      lastUpdate="2026-05-04"
      responsavel="Setor de Transparência Pública"
    >
      <div className="space-y-6">

        <p className="text-gray-600 text-lg leading-relaxed">
          As publicações oficiais do município de Padre Marcos são veiculadas por meio do Diário Oficial dos Municípios do Estado do Piauí (DOE-PI), em parceria com a Associação Piauiense de Municípios (APPM).
        </p>

        {/* O QUE É */}
        <section className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 text-blue-600 p-2.5 rounded-xl">
              <Newspaper size={22} />
            </div>
            <h2 className="text-lg font-bold text-gray-900">O que é o Diário Oficial?</h2>
          </div>
          <p className="text-gray-600 leading-relaxed">
            O Diário Oficial dos Municípios é o veículo de comunicação oficial onde são publicados atos administrativos como leis, decretos, portarias, editais, contratos, nomeações e demais atos normativos do Poder Executivo Municipal.
          </p>
          <p className="text-gray-600 leading-relaxed">
            A publicação no Diário Oficial garante a <strong>transparência</strong> e a <strong>validade jurídica</strong> dos atos da administração pública.
          </p>
        </section>

        {/* O QUE ENCONTRAR */}
        <section className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-green-50 text-green-600 p-2.5 rounded-xl">
              <FileText size={22} />
            </div>
            <h2 className="text-lg font-bold text-gray-900">O que você encontra no Diário Oficial</h2>
          </div>
          <ul className="space-y-2">
            {[
              "Leis e decretos municipais",
              "Portarias e resoluções",
              "Editais de licitação e convocação",
              "Nomeações e exonerações de servidores",
              "Contratos e aditivos",
              "Avisos e comunicados oficiais",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-gray-600">
                <span className="mt-1.5 w-2 h-2 rounded-full bg-green-400 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* BOTÃO DE ACESSO */}
        <section className="bg-gradient-to-br from-[#173572] to-[#0f2847] rounded-2xl p-8 text-center space-y-5 shadow-lg">
          <Newspaper size={48} className="mx-auto text-[#FFE066]" />
          <h2 className="text-2xl font-extrabold text-white">
            Acesse o Diário Oficial
          </h2>
          <p className="text-gray-300 max-w-lg mx-auto">
            Consulte todas as publicações oficiais do município de Padre Marcos no portal do Diário Oficial dos Municípios do Piauí.
          </p>
          <a
            href="https://www.diarioficialdosmunicipios.org/consulta/ConPublicacaoGeral/ConPublicacaoGeral.php"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-8 py-4 bg-[#FFE066] text-[#173572] rounded-2xl font-black text-sm uppercase tracking-wider hover:bg-[#ffd633] transition-all shadow-lg hover:shadow-xl hover:scale-105"
          >
            <ExternalLink size={20} />
            Acessar DOE-PI
          </a>
        </section>

        {/* INFO */}
        <section className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-amber-50 text-amber-600 p-2.5 rounded-xl">
              <Info size={22} />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Informações importantes</h2>
          </div>
          <ul className="space-y-2">
            {[
              "O acesso ao Diário Oficial é público e gratuito.",
              "Não é necessário cadastro para consultar as publicações.",
              "As edições são disponibilizadas diariamente em dias úteis.",
              "Para pesquisar publicações específicas, utilize a busca por palavra-chave ou data no portal do DOE-PI.",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-gray-600">
                <span className="mt-1.5 w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </section>

      </div>
    </ContentPage>
  );
}
