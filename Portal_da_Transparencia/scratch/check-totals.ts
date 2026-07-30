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

  console.log('Total rows 2026 transferencias_entre_entidades:', ent?.length);
  let c = 0, r = 0, p = 0;
  let cNoCam = 0, rNoCam = 0, pNoCam = 0;

  ent?.forEach((row: any) => {
    const rep = Number(row.repasse || 0);
    const dev = Number(row.devolucao || 0);
    const prv = Number(row.previsto || 0);
    c += rep;
    r += dev;
    p += prv;

    const pag = (row.entidade_pagadora || '').toLowerCase();
    const rec = (row.entidade_recebedora || '').toLowerCase();
    if (!pag.includes('camara') && !pag.includes('câmara') && !rec.includes('camara') && !rec.includes('câmara')) {
      cNoCam += rep;
      rNoCam += dev;
      pNoCam += prv;
    }
  });

  console.log('ENTIDADES ALL:', { repasse: c, devolucao: r, previsto: p });
  console.log('ENTIDADES SEM CAMARA:', { repasse: cNoCam, devolucao: rNoCam, previsto: pNoCam });

  const map = new Map();
  ent?.forEach((item: any) => {
    const mes = Number(item.mes) || 1;
    const pag = item.entidade_pagadora || 'Não informado';
    const rec = item.entidade_recebedora || 'Não informado';
    const key = `${mes}:::${pag}:::${rec}`;
    if (!map.has(key)) {
      map.set(key, { repasse: 0, devolucao: 0, previsto: Number(item.previsto) || 0 });
    }
    const g = map.get(key);
    g.repasse += Number(item.repasse) || 0;
    g.devolucao += Number(item.devolucao) || 0;
  });
  let gRep = 0, gDev = 0, gPrv = 0;
  Array.from(map.values()).forEach((g: any) => {
    gRep += g.repasse;
    gDev += g.devolucao;
    gPrv += g.previsto;
  });
  console.log('GroupedList sum in EntidadesTreeTable:', { repasse: gRep, devolucao: gDev, previsto: gPrv });
}

check();
