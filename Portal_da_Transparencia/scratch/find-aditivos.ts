import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const _dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(_dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('ERRO: credentials missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function findAditivos() {
  console.log("Checking licitacoes_documentos...");
  const { data: d1, error: e1 } = await supabase
    .schema('transparencia')
    .from('licitacoes_documentos')
    .select('*')
    .or('tipo_documento.ilike.%aditivo%,nome_arquivo.ilike.%aditivo%');
    
  if (e1) console.error(e1.message);
  else console.log(`Found ${d1.length} aditivos attached to licitacoes.`);

  console.log("\nChecking contratos_documentos...");
  const { data: d2, error: e2 } = await supabase
    .schema('transparencia')
    .from('contratos_documentos')
    .select('*')
    .or('tipo_documento.ilike.%aditivo%,nome_arquivo.ilike.%aditivo%');
    
  if (e2) console.error(e2.message);
  else console.log(`Found ${d2.length} aditivos attached to contratos.`);
}

findAditivos();
