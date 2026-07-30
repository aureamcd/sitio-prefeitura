import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function checkEntidades() {
  const { data: recs } = await s
    .schema('transparencia')
    .from('transferencias_entre_entidades')
    .select('entidade_pagadora, entidade_recebedora')
    .limit(100);

  if (recs) {
    const pagadoras = new Set(recs.map(r => r.entidade_pagadora));
    const recebedoras = new Set(recs.map(r => r.entidade_recebedora));
    console.log("Pagadoras:", Array.from(pagadoras));
    console.log("Recebedoras:", Array.from(recebedoras));
  }
}

checkEntidades().catch(console.error);
