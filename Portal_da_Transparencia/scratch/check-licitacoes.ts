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

async function checkLicitacoesDocs() {
  const { data, error } = await supabase
    .schema('transparencia')
    .from('licitacoes_documentos') 
    .select('*');

  if (error) {
    console.error("Error fetching licitacoes_documentos:", error.message);
    return;
  }
  
  analyze(data, 'licitacoes_documentos');
}

function analyze(data: any[], tableName: string) {
    console.log(`Found ${data.length} records in ${tableName}.`);
    if (data.length === 0) return;
    
    let validR2 = 0;
    let driveLinks = 0;
    let relativeLinks = 0;
    let errors = 0;
    let nullLinks = 0;
    
    for (const row of data) {
        // The column in licitacoes_documentos is url_arquivo
        const url = row.url_arquivo;
        
        if (!url) {
            nullLinks++;
        } else if (url.includes('.r2.dev') || url.includes('supabase')) {
            validR2++;
        } else if (url.includes('drive.google.com')) {
            driveLinks++;
        } else if (url.startsWith('ERRO')) {
            errors++;
        } else if (url.startsWith('/')) {
            relativeLinks++;
        } else if (url.startsWith('http')) {
            validR2++; // Other valid absolute URLs
        } else {
            errors++; // Unrecognized format
        }
    }
    
    console.log(`\nLink Analysis:`);
    console.log(`Valid Absolute Links (R2/Cloud/Supabase): ${validR2}`);
    console.log(`Legacy Drive Links: ${driveLinks}`);
    console.log(`Relative Paths (e.g. /uploads): ${relativeLinks}`);
    console.log(`Errors (e.g. NOT_PDF or unrecognized): ${errors}`);
    console.log(`No Links at all (NULL): ${nullLinks}`);
}

checkLicitacoesDocs();
