'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import { useMemo } from 'react';
import type { ReceitaNode } from '@/lib/receitas/types';
import { formatBRL } from '@/lib/receitas/types';

interface CategoryBarChartProps {
  tree: ReceitaNode[];
  loading: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const tickFormat = (value: any) => {
  const num = Number(value) || 0;
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
};

export default function CategoryBarChart({ tree, loading }: CategoryBarChartProps) {
  const chartData = useMemo(() => {
    return tree.slice(0, 10).map((node) => ({
      name: node.descricao.length > 28 ? node.descricao.slice(0, 26) + '…' : node.descricao,
      Previsto: node.previsto,
      Arrecadado: node.arrecadado,
    }));
  }, [tree]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="h-4 w-48 bg-gray-200 animate-pulse rounded mb-4" />
        <div className="h-[280px] bg-gray-50 animate-pulse rounded-lg" />
      </div>
    );
  }

  if (chartData.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h3 className="text-base font-semibold text-gray-800 mb-1">Arrecadação por Categoria</h3>
      <p className="text-xs text-gray-500 mb-5">Valores previstos vs. arrecadados — top 10 categorias</p>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 20, left: 120, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis type="number" tickFormatter={tickFormat} tick={{ fontSize: 11, fill: '#6b7280' }} />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 11, fill: '#374151' }}
            width={130}
          />
          <Tooltip
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(value: any) => formatBRL(Number(value) || 0)}
            labelStyle={{ fontWeight: 600, color: '#111827' }}
            contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
          />
          <Legend
            formatter={(value: string) => (
              <span className="text-xs text-gray-600">{value}</span>
            )}
          />
          <Bar dataKey="Previsto" fill="#0B3D91" radius={[0, 3, 3, 0]} />
          <Bar dataKey="Arrecadado" fill="#43A047" radius={[0, 3, 3, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
