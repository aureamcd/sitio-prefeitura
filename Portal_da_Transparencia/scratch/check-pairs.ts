import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function check() {
  const { data: ent } = await s
    .schema('transparencia')
    .from('transferencias_entre_entidades')
    .select('*')
    .eq('exercicio', 2026);

  const pairs = new Map();
  ent?.forEach((r: any) => {
    const pag = r.entidade_pagadora || '';
    const rec = r.entidade_recebedora || '';
    if (pag.toLowerCase().includes('camara') || rec.toLowerCase().includes('camara') || pag.toLowerCase().includes('câmara') || rec.toLowerCase().includes('câmara')) return;
    const k = pag + ' -> ' + rec;
    if (!pairs.has(k)) pairs.set(k, { count: 0, prevs: new Set(), repSum: 0, devSum: 0 });
    const g = pairs.get(k);
    g.count++;
    g.prevs.add(Number(r.previsto || 0));
    g.repSum += Number(r.repasse || 0);
    g.devSum += Number(r.devolucao || 0);
  });

  pairs.forEach((v, k) => {
    console.log(k, '| rows:', v.count, '| prevs:', Array.from(v.prevs), '| repSum:', v.repSum, '| devSum:', v.devSum);
  });
}

check();
