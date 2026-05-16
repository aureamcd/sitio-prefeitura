import { notFound } from "next/navigation";
import ContentPage from "@/components/layout/ContentPage";
import portalData from "@/lib/data/portal.json";
import { 
  Mail, 
  Phone, 
  Clock, 
  MapPin, 
  ChevronRight, 
  CheckCircle2, 
  FileText,
  User
} from "lucide-react";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function SecretariaPage({ params }: Props) {
  const { slug } = await params;
  
  // Busca em secretarias e órgãos
  const item = [...portalData.secretarias, ...portalData.orgaos].find(
    (s) => s.slug === slug
  );

  if (!item) return notFound();

  return (
    <ContentPage
      title={item.nome}
      description={`Informações institucionais, competências e serviços da unidade.`}
      breadcrumb={[
        { label: "Início", href: "/" },
        { label: "Gestão", href: "/info-institucional/gestao" },
        { label: item.nome },
      ]}
      lastUpdate="2026-05-04"
    >
      <div className="space-y-10">
        
        {/* CARD PRINCIPAL - RESPONSÁVEL E CONTATOS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 bg-blue-50 border border-blue-100 rounded-3xl p-8 flex flex-col items-center text-center">
            <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center text-white mb-4 shadow-xl shadow-blue-200">
               <User size={48} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 leading-tight mb-1">{item.responsavel}</h2>
            <p className="text-sm font-bold text-blue-600 uppercase tracking-widest">Responsável</p>
          </div>

          <div className="md:col-span-2 bg-white border border-gray-200 rounded-3xl p-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
             <div className="space-y-4">
                <div className="flex items-start gap-3">
                   <div className="bg-gray-100 p-2 rounded-lg text-gray-500">
                      <Mail size={18} />
                   </div>
                   <div className="overflow-hidden">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">E-mail</p>
                      <a href={`mailto:${item.email}`} className="text-sm font-bold text-blue-600 hover:underline break-all">
                        {item.email}
                      </a>
                   </div>
                </div>
                <div className="flex items-start gap-3">
                   <div className="bg-gray-100 p-2 rounded-lg text-gray-500">
                      <Phone size={18} />
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Telefone</p>
                      <p className="text-sm font-bold text-gray-700">{item.telefone}</p>
                   </div>
                </div>
             </div>
             <div className="space-y-4">
                <div className="flex items-start gap-3">
                   <div className="bg-gray-100 p-2 rounded-lg text-gray-500">
                      <Clock size={18} />
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Horário de Atendimento</p>
                      <p className="text-sm font-bold text-gray-700">{item.horario}</p>
                   </div>
                </div>
                <div className="flex items-start gap-3">
                   <div className="bg-gray-100 p-2 rounded-lg text-gray-500">
                      <MapPin size={18} />
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Endereço</p>
                      <p className="text-sm font-bold text-gray-700 leading-relaxed">{item.endereco}</p>
                   </div>
                </div>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* COMPETÊNCIAS */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
               <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
               <h2 className="text-2xl font-bold text-gray-900">Competências</h2>
            </div>
            <ul className="space-y-4">
              {item.competencias.map((comp, i) => (
                <li key={i} className="flex items-start gap-3 group">
                   <div className="mt-1 bg-blue-100 text-blue-600 p-1 rounded-full group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <ChevronRight size={14} />
                   </div>
                   <span className="text-gray-700 leading-relaxed font-medium">{comp}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* SERVIÇOS */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
               <div className="w-1.5 h-6 bg-green-600 rounded-full" />
               <h2 className="text-2xl font-bold text-gray-900">Principais Serviços</h2>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {item.servicos.map((serv, i) => (
                <div key={i} className="bg-gray-50 border border-gray-100 p-4 rounded-2xl flex items-center gap-3">
                   <CheckCircle2 size={20} className="text-green-600" />
                   <span className="text-gray-700 font-bold text-sm">{serv}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* PLANOS E DOCUMENTOS */}
        {item.planos && item.planos.length > 0 && (
          <div className="pt-10 border-t border-gray-100 space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Planos e Documentos Setoriais</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {item.planos.map((plano, i) => (
                <a
                  key={i}
                  href={plano.link}
                  className="flex items-center gap-4 p-5 bg-white border border-gray-200 rounded-2xl hover:border-blue-500 hover:shadow-lg transition-all group"
                >
                   <div className="bg-gray-100 p-3 rounded-xl text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                      <FileText size={24} />
                   </div>
                   <span className="text-sm font-bold text-gray-700 group-hover:text-blue-700">{plano.nome}</span>
                </a>
              ))}
            </div>
          </div>
        )}

      </div>
    </ContentPage>
  );
}