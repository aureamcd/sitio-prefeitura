import ContentPage from "@/components/layout/ContentPage";
import { Phone, Mail, MapPin, Clock } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contatos Institucionais e Horários",
  description: "Endereços, telefones, e-mails e horários de atendimento da Prefeitura e Secretarias.",
};

export default function ContatosPage() {
  const contatos = [
    {
      setor: "Sede da Prefeitura (Gabinete)",
      endereco: "Praça Principal, 123 - Centro, Padre Marcos - PI, 64680-000",
      telefone: "(89) 3456-1234",
      email: "gabinete@padremarcos.pi.gov.br",
      horario: "Segunda a Sexta, das 08:00 às 13:00",
    },
    {
      setor: "Secretaria de Saúde",
      endereco: "Rua da Saúde, 45 - Centro, Padre Marcos - PI, 64680-000",
      telefone: "(89) 3456-1236",
      email: "saude@padremarcos.pi.gov.br",
      horario: "Segunda a Sexta, das 08:00 às 13:00 e 14:00 às 17:00",
    },
    {
      setor: "Secretaria de Finanças (Tributação)",
      endereco: "Praça Principal, 123 (Anexo) - Centro, Padre Marcos - PI, 64680-000",
      telefone: "(89) 3456-1235",
      email: "financas@padremarcos.pi.gov.br",
      horario: "Segunda a Sexta, das 08:00 às 13:00",
    },
  ];

  return (
    <ContentPage
      title="Contatos Institucionais e Horários"
      description="Consulte os meios de contato oficiais com a Prefeitura Municipal e suas Secretarias."
      breadcrumb={[
        { label: "Início", href: "/" },
        { label: "Transparência", href: "/transparencia" },
        { label: "Contatos" },
      ]}
      lastUpdate="24/05/2026"
    >
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {contatos.map((contato, idx) => (
          <div key={idx} className="bg-white p-6 border border-gray-200 rounded-lg shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b">
              {contato.setor}
            </h3>
            <ul className="space-y-4 text-gray-700">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <span>{contato.endereco}</span>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <span>{contato.telefone}</span>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                <a href={`mailto:${contato.email}`} className="text-blue-600 hover:underline">
                  {contato.email}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span>{contato.horario}</span>
              </li>
            </ul>
          </div>
        ))}
      </div>
    </ContentPage>
  );
}
