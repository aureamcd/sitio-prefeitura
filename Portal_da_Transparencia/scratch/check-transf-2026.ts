import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function checkTransf2026() {
  const { data, error } = await s
    .schema('transparencia')
    .from('transferencias_entre_entidades')
    .select('repasse, previsto, devolucao, mes')
    .eq('exercicio', 2026);

  if (error) {
    console.error(error);
    return;
  }
  
  const totalRepasse = data.reduce((acc, row) => acc + Number(row.repasse), 0);
  const totalDevolucao = data.reduce((acc, row) => acc + Number(row.devolucao), 0);
  const totalPrevistoOldSystem = data.reduce((acc, row) => acc + Number(row.previsto), 0);

  console.log("Total Repasse 2026:", totalRepasse);
  console.log("Total Devolucao 2026:", totalDevolucao);
  console.log("Total Previsto (if summed blindly like old system):", totalPrevistoOldSystem);
  console.log("Number of transactions:", data.length);
}

checkTransf2026().catch(console.error);
