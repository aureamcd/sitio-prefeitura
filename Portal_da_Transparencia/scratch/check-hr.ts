import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function checkHR() {
  const { data: servs, error: errS } = await s.schema('transparencia').from('servidores').select('*').limit(3);
  const { data: folhas, error: errF } = await s.schema('transparencia').from('folha_pagamento').select('*').limit(3);
  
  console.log("Servidores:", servs?.length);
  console.log("Folhas:", folhas?.length);
  if (servs && servs.length > 0) console.log("Servidor Ex:", servs[0]);
}

checkHR().catch(console.error);
