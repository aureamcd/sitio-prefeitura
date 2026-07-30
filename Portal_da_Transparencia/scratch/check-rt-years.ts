import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function checkYears() {
  const years = [2026, 2025, 2024, 2023];
  for (const yr of years) {
    const { data: rt } = await s
      .schema('transparencia')
      .from('receitas_transferencias')
      .select('tipo, codigo, especificacao, previsao_inicial, previsao_atualizada, arrecadado_periodo, arrecadado_total')
      .eq('exercicio', yr);
    
    const uniao = rt?.filter(r => r.tipo?.toLowerCase() === 'uniao') || [];
    const estado = rt?.filter(r => r.tipo?.toLowerCase() === 'estado') || [];
    
    const uTotalPI = uniao.filter(r => r.codigo === '1710.00.0.0.00' || r.codigo === '2410.00.0.0.00' || r.codigo === '1710' || r.codigo === '2410').reduce((acc, r) => acc + Number(r.previsao_inicial || 0), 0);
    const uTotalAT = uniao.filter(r => r.codigo === '1710.00.0.0.00' || r.codigo === '2410.00.0.0.00' || r.codigo === '1710' || r.codigo === '2410').reduce((acc, r) => acc + Number(r.arrecadado_total || 0), 0);
    
    const eTotalPI = estado.filter(r => r.codigo === '1720.00.0.0.00' || r.codigo === '2420.00.0.0.00' || r.codigo === '1720' || r.codigo === '2420').reduce((acc, r) => acc + Number(r.previsao_inicial || 0), 0);
    const eTotalAT = estado.filter(r => r.codigo === '1720.00.0.0.00' || r.codigo === '2420.00.0.0.00' || r.codigo === '1720' || r.codigo === '2420').reduce((acc, r) => acc + Number(r.arrecadado_total || 0), 0);
    
    console.log(`[Year ${yr}] UNIAO count=${uniao.length} | root PI=${uTotalPI} | root AT=${uTotalAT}`);
    console.log(`[Year ${yr}] ESTADO count=${estado.length} | root PI=${eTotalPI} | root AT=${eTotalAT}`);
  }
}

checkYears().catch(console.error);
