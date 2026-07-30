import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function listTables() {
  const { data, error } = await s.rpc('get_tables_in_schema', { schema_name: 'transparencia' });
  if (error) {
    // try standard postgres query
    const res = await s.from('servidores').select('id').limit(1);
    console.log("Servidores exists:", !res.error);
    
    // just check common table names
    const names = ['folhas_pagamento', 'folha_pagamento', 'remuneracoes', 'vencimentos', 'servidores_folhas'];
    for(const name of names) {
        const { error } = await s.schema('transparencia').from(name).select('id').limit(1);
        console.log(name, ":", !error ? "EXISTS" : error.message);
    }
  }
}

listTables().catch(console.error);
