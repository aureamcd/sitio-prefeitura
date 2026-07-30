import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function addConstraint() {
    // try to add a unique constraint so upsert works
    const { error } = await s.rpc('exec_sql', {
        sql_string: `ALTER TABLE transparencia.remuneracoes ADD CONSTRAINT remuneracoes_unico_idx UNIQUE (matricula, ano, mes, tipo);`
    });
    if (error) {
        console.log("Error adding constraint using RPC. Let's try inserting without onConflict to see if it works, or using delete-then-insert.");
    }
}
addConstraint();
