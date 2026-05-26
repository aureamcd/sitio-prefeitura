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
import { formatBRL } from '@/lib/despesas/types';
import type { DespesaRow } from '@/lib/despesas/types';

interface MonthlyExpenseChartProps {
  data: DespesaRow[];
  loading: boolean;
}

const MESES_LABEL = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const tickFormat = (value: any) => {
  const num = Number(value) || 0;
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
};

export default function MonthlyExpenseChart({ data, loading }: MonthlyExpenseChartProps) {
  const chartData = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => ({
      mes: MESES_LABEL[i],
      Empenhado: 0,
      Pago: 0,
    }));

    for (const row of data) {
      if (!row.data_empenho) continue;
      const d = new Date(row.data_empenho);
      const monthIndex = d.getUTCMonth();
      months[monthIndex].Empenhado += Number(row.valor_empenhado) || 0;
      months[monthIndex].Pago += Number(row.valor_pago) || 0;
    }

    return months;
  }, [data]);

  const hasData = chartData.some((m) => m.Empenhado > 0 || m.Pago > 0);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="h-4 w-48 bg-gray-200 animate-pulse rounded mb-4" />
        <div className="h-[280px] bg-gray-50 animate-pulse rounded-lg" />
      </div>
    );
  }

  if (!hasData) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h3 className="text-base font-semibold text-gray-800 mb-1">Evolução Mensal</h3>
      <p className="text-xs text-gray-500 mb-5">Valores empenhados vs. pagos por mês</p>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#6b7280' }} />
          <YAxis tickFormatter={tickFormat} tick={{ fontSize: 11, fill: '#6b7280' }} width={80} />
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
          <Bar dataKey="Empenhado" fill="#0B3D91" radius={[3, 3, 0, 0]} />
          <Bar dataKey="Pago" fill="#16a34a" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
