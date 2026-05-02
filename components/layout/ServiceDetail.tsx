"use client";

import {
    FileText,
    Users,
    ClipboardList,
    Clock,
    MousePointer2,
    MessageSquare,
    Building2
} from "lucide-react";

type Service = {
    nome: string;
    descricao: string;
    quemPode: string;
    documentos: string[];
    etapas: string[];
    prazo: string;
    forma: string;
    canais?: string;
    responsavel?: string;
};

type Props = {
    service: Service;
};

export default function ServiceDetail({ service }: Props) {
    return (
        <article className="border border-gray-200 rounded-3xl p-6 md:p-8 shadow-sm bg-white hover:shadow-md transition-shadow">

            {/* TÍTULO */}
            <header className="mb-8 border-b pb-6">
                <h2 className="text-2xl font-bold text-[#173572] leading-tight">
                    {service.nome}
                </h2>
            </header>

            <div className="grid gap-8 md:grid-cols-2">

                {/* COLUNA ESQUERDA: INFOS PRINCIPAIS */}
                <div className="space-y-8">
                    {/* DESCRIÇÃO */}
                    <section>
                        <div className="flex items-center gap-2 mb-3">
                            <div className="p-1.5 bg-blue-50 text-[#173572] rounded-lg">
                                <FileText size={18} />
                            </div>
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
                                O que é este serviço?
                            </h3>
                        </div>
                        <p className="text-gray-700 leading-relaxed pl-9">
                            {service.descricao}
                        </p>
                    </section>

                    {/* QUEM PODE */}
                    <section>
                        <div className="flex items-center gap-2 mb-3">
                            <div className="p-1.5 bg-blue-50 text-[#173572] rounded-lg">
                                <Users size={18} />
                            </div>
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
                                Quem pode solicitar
                            </h3>
                        </div>
                        <p className="text-gray-700 pl-9 font-medium">
                            {service.quemPode}
                        </p>
                    </section>

                    {/* DOCUMENTOS */}
                    <section>
                        <div className="flex items-center gap-2 mb-3">
                            <div className="p-1.5 bg-blue-50 text-[#173572] rounded-lg">
                                <ClipboardList size={18} />
                            </div>
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
                                Documentos necessários
                            </h3>
                        </div>
                        <div className="pl-9">
                            {service.documentos.length > 0 ? (
                                <ul className="grid gap-2">
                                    {service.documentos.map((doc, i) => (
                                        <li key={i} className="flex items-start gap-2 text-gray-700 text-sm">
                                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-300 shrink-0" />
                                            {doc}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-gray-400 italic text-sm">Não há exigência de documentos.</p>
                            )}
                        </div>
                    </section>
                </div>

                {/* COLUNA DIREITA: PROCESSO E PRAZOS */}
                <div className="space-y-8">
                    {/* ETAPAS */}
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-1.5 bg-blue-50 text-[#173572] rounded-lg">
                                <ClipboardList size={18} />
                            </div>
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
                                Etapas do processo
                            </h3>
                        </div>
                        <div className="pl-9 space-y-4">
                            {service.etapas.map((etapa, i) => (
                                <div key={i} className="relative flex gap-4">
                                    <div className="flex flex-col items-center">
                                        <div className="w-6 h-6 rounded-full bg-[#173572] text-white text-[10px] flex items-center justify-center font-bold z-10 shrink-0">
                                            {i + 1}
                                        </div>
                                        {i < service.etapas.length - 1 && (
                                            <div className="w-px h-full bg-gray-200 absolute top-3" />
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-700 pb-2">{etapa}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* PRAZO E FORMA */}
                    <div className="grid grid-cols-2 gap-4 pl-9">
                        <section className="bg-gray-50 p-4 rounded-2xl">
                            <div className="flex items-center gap-2 mb-2 text-[#173572]">
                                <Clock size={16} />
                                <span className="text-[10px] font-bold uppercase">Prazo</span>
                            </div>
                            <p className="text-sm font-bold text-gray-900">{service.prazo}</p>
                        </section>

                        <section className="bg-gray-50 p-4 rounded-2xl">
                            <div className="flex items-center gap-2 mb-2 text-[#173572]">
                                <MousePointer2 size={16} />
                                <span className="text-[10px] font-bold uppercase">Como</span>
                            </div>
                            <p className="text-sm font-bold text-gray-900">{service.forma}</p>
                        </section>
                    </div>
                </div>
            </div>

            {/* RODAPÉ DO CARD: CANAIS E RESPONSÁVEL */}
            <footer className="mt-10 pt-8 border-t flex flex-col gap-6">
                {service.canais && (
                    <div className="bg-[#173572] bg-opacity-[0.03] border border-[#173572] border-opacity-10 rounded-2xl p-5 flex gap-4">
                        <div className="p-2 bg-white rounded-xl text-[#173572] shadow-sm shrink-0 h-fit">
                            <MessageSquare size={20} />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-[#173572] mb-1">
                                Canais de Manifestação e Ouvidoria
                            </h3>
                            <p className="text-gray-600 text-sm leading-relaxed">
                                {service.canais}
                            </p>
                        </div>
                    </div>
                )}

                {service.responsavel && (
                    <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 self-start px-4 py-2 rounded-full">
                        <Building2 size={14} />
                        <strong>Unidade responsável:</strong> {service.responsavel}
                    </div>
                )}
            </footer>

        </article>
    );
}