"use client";

import { Calendar } from "lucide-react";
import { useRouter } from "next/navigation";

type LeiFiltersProps = {
    tipo: string;
    ano: string;
    busca: string;
    anosDisponiveis: string[];
};

export default function LeiAnoSelect({ tipo, ano, busca, anosDisponiveis }: LeiFiltersProps) {
    const router = useRouter();

    return (
        <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <select
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 appearance-none text-sm font-bold cursor-pointer"
                value={ano}
                onChange={(e) => {
                    router.push(`/leis-normas?tipo=${tipo}&ano=${e.target.value}&busca=${busca}`);
                }}
            >
                <option value="">Todos os anos</option>
                {anosDisponiveis.map(a => (
                    <option key={a} value={a}>{a}</option>
                ))}
            </select>
        </div>
    );
}
