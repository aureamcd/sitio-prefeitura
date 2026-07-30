const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { createClient } = require("@supabase/supabase-js");
const fs = require('fs');

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function scanYear(year) {
  console.log(`\n=== VARREDURA DE CONTRATOS DO ANO ${year} ===`);

  // 1. Consultar contratos no banco
  const { data: contratos, error } = await supabase
    .schema('transparencia')
    .from('contratos_v2')
    .select('*, documentos:contratos_documentos(*)')
    .eq('ano', year);

  if (error) {
    console.error(`Erro ao buscar contratos de ${year}:`, error.message);
    return;
  }

  console.log(`📌 Total de contratos no banco: ${contratos.length}`);

  // 2. Análise de anexos
  const comAnexos = contratos.filter(c => c.documentos && c.documentos.length > 0);
  const semAnexos = contratos.filter(c => !c.documentos || c.documentos.length === 0);
  console.log(`✅ Contratos com anexos: ${comAnexos.length}`);
  console.log(`⚠️ Contratos SEM anexos: ${semAnexos.length}`);

  // 3. Verificar contratos fantasma / duplicados
  const genericos = contratos.filter(c => c.valor === 0 || c.valor === '0.00' || c.valor === '0');
  if (genericos.length > 0) {
    console.log(`⚠️ ATENÇÃO: Encontrados ${genericos.length} contratos com valor R$ 0,00 (Possíveis duplicatas)`);
  } else {
    console.log(`✅ Nenhum contrato fantasma (R$ 0,00) encontrado!`);
  }

  // 4. Verificar anexos repetidos
  let totalAnexos = 0;
  let anexosRepetidos = 0;
  const hashSet = new Set();
  
  comAnexos.forEach(c => {
    c.documentos.forEach(doc => {
      totalAnexos++;
      const uniqueId = `${c.id}-${doc.nome_arquivo}`;
      if (hashSet.has(uniqueId)) {
        anexosRepetidos++;
      } else {
        hashSet.add(uniqueId);
      }
    });
  });
  
  if (anexosRepetidos > 0) {
    console.log(`⚠️ ATENÇÃO: Encontrados ${anexosRepetidos} anexos duplicados dentro do mesmo contrato.`);
  } else {
    console.log(`✅ Nenhum anexo duplicado encontrado nos contratos!`);
  }

  // 5. Verificar arquivos na pasta local
  const folderPath = `C:\\Users\\Áurea Letícia\\Desktop\\contratos\\Contratos\\${year}`;
  try {
    const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.pdf'));
    console.log(`📁 Arquivos sobrando na pasta local de ${year}: ${files.length} arquivos.`);
    if (files.length > 0) {
      console.log(`   Nomes: ${files.slice(0, 5).join(', ')}${files.length > 5 ? '...' : ''}`);
    }
  } catch (err) {
    console.log(`📁 Pasta local de ${year} não encontrada ou inacessível.`);
  }
}

async function run() {
  await scanYear(2017);
  await scanYear(2018);
}

run();
