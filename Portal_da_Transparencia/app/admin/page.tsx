"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createBrowserClient } from "@/lib/supabase/client";
import {
  DollarSign, Gavel, FileText, Handshake,
  Scale, Users, Loader2, ArrowRight, Receipt
} from "lucide-react";

type CardData = {
  label: string;
  href: string;
  icon: typeof DollarSign;
  color: string;
  bg: string;
  count: number;
  schema: string;
  table: string;
};

export default function AdminDashboard() {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const supabase = createBrowserClient();

  useEffect(() => {
    async function load() {
      const cards: CardData[] = [
        { label: "Diárias", href: "/admin/diarias", icon: DollarSign, color: "text-green-600", bg: "bg-green-50", count: 0, schema: "transparencia", table: "diarias" },
        { label: "Licitações", href: "/admin/licitacoes", icon: Gavel, color: "text-orange-600", bg: "bg-orange-50", count: 0, schema: "transparencia", table: "licitacoes" },
        { label: "Contratos", href: "/admin/contratos", icon: FileText, color: "text-blue-600", bg: "bg-blue-50", count: 0, schema: "transparencia", table: "contratos" },
        { label: "Convênios", href: "/admin/transferencias", icon: Handshake, color: "text-purple-600", bg: "bg-purple-50", count: 0, schema: "transparencia", table: "transferencias" },
        { label: "Leis e Normas", href: "/admin/legislacoes", icon: Scale, color: "text-emerald-600", bg: "bg-emerald-50", count: 0, schema: "public", table: "legislacoes" },
        { label: "Publicações", href: "/admin/publicacoes", icon: Users, color: "text-cyan-600", bg: "bg-cyan-50", count: 0, schema: "public", table: "publicacoes" },
      ];

      const results = await Promise.all(
        cards.map(c =>
          supabase
            .schema(c.schema)
            .from(c.table)
            .select("id", { count: "exact", head: true })
        )
      );

      const newCounts: Record<string, number> = {};
      cards.forEach((c, i) => {
        newCounts[c.table] = results[i].count || 0;
      });
      setCounts(newCounts);
      setLoading(false);
    }
    load();
  }, [supabase]);

  const cards: CardData[] = [
    { label: "Diárias", href: "/admin/diarias", icon: DollarSign, color: "text-green-600", bg: "bg-green-50", count: counts.diarias || 0, schema: "transparencia", table: "diarias" },
    { label: "Licitações", href: "/admin/licitacoes", icon: Gavel, color: "text-orange-600", bg: "bg-orange-50", count: counts.licitacoes || 0, schema: "transparencia", table: "licitacoes" },
    { label: "Contratos", href: "/admin/contratos", icon: FileText, color: "text-blue-600", bg: "bg-blue-50", count: counts.contratos || 0, schema: "transparencia", table: "contratos" },
    { label: "Convênios", href: "/admin/transferencias", icon: Handshake, color: "text-purple-600", bg: "bg-purple-50", count: counts.transferencias || 0, schema: "transparencia", table: "transferencias" },
    { label: "Leis e Normas", href: "/admin/legislacoes", icon: Scale, color: "text-emerald-600", bg: "bg-emerald-50", count: counts.legislacoes || 0, schema: "public", table: "legislacoes" },
    { label: "Publicações", href: "/admin/publicacoes", icon: Users, color: "text-cyan-600", bg: "bg-cyan-50", count: counts.publicacoes || 0, schema: "public", table: "publicacoes" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-gray-300 animate-spin" />
      </div>
    );
  }

  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-[#173572] rounded-2xl flex items-center justify-center">
            <Receipt className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900">
              Painel da Transparência
            </h1>
            <p className="text-sm text-gray-500">
              {total} registros no total · Gerencie os dados do portal
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.table}
              href={card.href}
              className="group bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-md hover:border-gray-300 transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl ${card.bg}`}>
                  <Icon className={`w-6 h-6 ${card.color}`} />
                </div>
                <span className="text-3xl font-black text-gray-800 tabular-nums">
                  {card.count}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <p className="font-bold text-gray-900">{card.label}</p>
                <ArrowRight size={16} className="text-gray-300 group-hover:text-[#173572] group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Links rápidos */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4">
          Links Rápidos
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Nova Legislação", href: "/admin/legislacoes/nova", icon: Scale },
            { label: "Adicionar Publicação", href: "/admin/publicacoes/nova", icon: Users },
            { label: "Ir para o Portal", href: "/", icon: Receipt },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition text-sm font-medium text-gray-700"
              >
                <Icon size={18} className="text-gray-500" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
