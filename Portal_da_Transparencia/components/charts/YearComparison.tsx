'use client';

import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { createBrowserClient } from '@/lib/supabase/client';

interface YearComparisonProps {
  supabaseTable: string;
  valueColumn: string;
  title: string;
  description: string;
  barName?: string;
  barColor?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const tickFormat = (value: any) => {
  const num = Number(value) || 0;
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
};

export default function YearComparison({
  supabaseTable,
  valueColumn,
  title,
  description,
  barName = 'Total',
  barColor = '#0B3D91',
}: YearComparisonProps) {
  const [data, setData] = useState<{ ano: number; total: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient();

  useEffect(() => {
    let cancelled = false;

    async function fetchYearlyTotals() {
      setLoading(true);

      try {
        const { data: result } = await supabase
          .schema('transparencia')
          .from(supabaseTable)
          .select(`ano, ${valueColumn}`)
          .not('ano', 'is', null);

        if (cancelled) return;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rows = (result ?? []) as any[];

        const yearMap = new Map<number, number>();
        for (const row of rows) {
          const year = Number(row.ano);
          const value = Number(row[valueColumn]) || 0;
          yearMap.set(year, (yearMap.get(year) || 0) + value);
        }

        const aggregated = Array.from(yearMap.entries())
          .map(([ano, total]) => ({ ano, total }))
          .sort((a, b) => a.ano - b.ano);

        setData(aggregated);
      } catch {
        if (!cancelled) setData([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchYearlyTotals();
    return () => { cancelled = true; };
  }, [supabaseTable, valueColumn, supabase]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="h-4 w-40 bg-gray-200 animate-pulse rounded mb-4" />
        <div className="h-[240px] bg-gray-50 animate-pulse rounded-lg" />
      </div>
    );
  }

  if (data.length < 2) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h3 className="text-base font-semibold text-gray-800 mb-1">{title}</h3>
      <p className="text-xs text-gray-500 mb-5">{description}</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
        {data.map((year) => (
          <div
            key={year.ano}
            className="bg-gray-50 rounded-xl px-3 py-2.5 text-center border border-gray-100"
          >
            <p className="text-xs font-semibold text-gray-500">{year.ano}</p>
            <p className="text-sm font-bold text-gray-800 tabular-nums mt-0.5">
              {tickFormat(year.total)}
            </p>
          </div>
        ))}
      </div>

      {data.length >= 3 && (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="ano" tick={{ fontSize: 11, fill: '#6b7280' }} />
            <YAxis tickFormatter={tickFormat} tick={{ fontSize: 11, fill: '#6b7280' }} width={80} />
            <Tooltip
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any) => tickFormat(value)}
              labelStyle={{ fontWeight: 600, color: '#111827' }}
              contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
            />
            <Bar dataKey="total" name={barName} fill={barColor} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
