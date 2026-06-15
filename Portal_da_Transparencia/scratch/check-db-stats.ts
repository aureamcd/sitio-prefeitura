import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nuhkqmuccirxumhttsvk.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51aGtxbXVjY2lyeHVtaHR0c3ZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3NDY0NjYsImV4cCI6MjA1OTMyMjQ2Nn0.6C2Wh2n9jjSlGJQz1-MQJsNcvRZn6TSFqJq8F6gPYbY'
);

async function main() {
  console.log('═══════════════════════════════════════');
  console.log('  CHECKLIST PNTP 2026 — DADOS NO BANCO');
  console.log('═══════════════════════════════════════\n');

  // 1. CARONAS (8.5)
  const { data: caronas } = await supabase
    .schema('transparencia').from('licitacoes_v2')
    .select('id, numero, ano, objeto, modalidade, carona')
    .eq('carona', 'sim');
  console.log(`📋 8.5 - CARONAS: ${caronas?.length || 0} encontrada(s)`);
  if (caronas?.length) console.log(JSON.stringify(caronas, null, 2));
  else console.log('   Nenhuma carona registrada.');

  // 2. PCA (8.6)
  const { data: pca } = await supabase
    .schema('transparencia').from('plano_contratacoes_anual')
    .select('*').order('ano', { ascending: false });
  console.log(`\n📋 8.6 - PCA: ${pca?.length || 0} registro(s)`);
  if (pca?.length) console.log(JSON.stringify(pca, null, 2));

  // 3. SANCIONADOS (8.7)
  const { data: sanc } = await supabase
    .schema('transparencia').from('sancionados').select('*');
  console.log(`\n📋 8.7 - SANCIONADOS: ${sanc?.length || 0} registro(s)`);
  if (sanc?.length) console.log(JSON.stringify(sanc, null, 2));
  else console.log('   Nenhum sancionado registrado. Declaração de inexistência OK.');

  // 4. CONTRATOS (9.1-9.3)
  const { count: totalContratos } = await supabase
    .schema('transparencia').from('contratos_v2')
    .select('*', { count: 'exact', head: true });
  console.log(`\n📋 9.1 - TOTAL DE CONTRATOS: ${totalContratos || 0}`);

  // Contratos COM fiscal
  const { data: comFiscal } = await supabase
    .schema('transparencia').from('contratos_v2')
    .select('id, numero, ano, fiscal_nome, contratado')
    .not('fiscal_nome', 'is', null)
    .not('fiscal_nome', 'eq', '');
  console.log(`📋 9.3 - CONTRATOS COM FISCAL: ${comFiscal?.length || 0}`);

  // Contratos SEM fiscal
  const { data: semFiscal } = await supabase
    .schema('transparencia').from('contratos_v2')
    .select('id, numero, ano, contratado')
    .or('fiscal_nome.is.null,fiscal_nome.eq.""');
  console.log(`📋 9.3 - CONTRATOS SEM FISCAL: ${semFiscal?.length || 0}`);
  if (semFiscal?.length) {
    console.log('   Primeiros 5 sem fiscal:');
    semFiscal.slice(0, 5).forEach(c => console.log(`   - ${c.numero || 'N/I'}/${c.ano} — ${c.contratado || 'N/I'}`));
  }

  // 5. ORDEM CRONOLÓGICA (9.4)
  const { count: totalOcp } = await supabase
    .schema('transparencia').from('ordem_cronologica_pagamentos')
    .select('*', { count: 'exact', head: true });
  console.log(`\n📋 9.4 - ORDEM CRONOLÓGICA: ${totalOcp || 0} registro(s)`);

  if (totalOcp && totalOcp > 0) {
    // Por ano
    const { data: porAno } = await supabase
      .schema('transparencia').from('ordem_cronologica_pagamentos')
      .select('ano');
    const anos: Record<string, number> = {};
    porAno?.forEach(r => { anos[r.ano] = (anos[r.ano] || 0) + 1; });
    console.log('   Por ano:', JSON.stringify(anos));
  }

  // 6. LICITAÇÕES - total geral
  const { count: totalLicitacoes } = await supabase
    .schema('transparencia').from('licitacoes_v2')
    .select('*', { count: 'exact', head: true });
  console.log(`\n📋 TOTAL LICITAÇÕES: ${totalLicitacoes || 0}`);

  // Por ano
  const { data: licPorAno } = await supabase
    .schema('transparencia').from('licitacoes_v2')
    .select('ano');
  const licAnos: Record<string, number> = {};
  licPorAno?.forEach(r => { licAnos[r.ano] = (licAnos[r.ano] || 0) + 1; });
  console.log('   Por ano:', JSON.stringify(licAnos));

  console.log('\n═══════════════════════════════════════');
}

main().catch(console.error);
