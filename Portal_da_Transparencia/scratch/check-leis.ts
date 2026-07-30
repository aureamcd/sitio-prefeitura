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

async function checkLeis() {
  const { data, error } = await supabase
    .from('legislacoes') 
    .select('*');

  if (error) {
    console.error("Error fetching legislacoes:", error.message);
    return;
  }
  
  analyze(data, 'legislacoes');
}

function analyze(data: any[], tableName: string) {
    console.log(`Found ${data.length} records in ${tableName}.`);
    if (data.length === 0) return;
    
    let validR2 = 0;
    let driveLinks = 0;
    let errors = 0;
    let nullLinks = 0;
    
    for (const row of data) {
        const r2 = row.arquivo_r2_url;
        const drive = row.arquivo_url;
        
        if (r2 && r2.startsWith('http')) {
            validR2++;
        } else if (r2 && r2.startsWith('ERRO')) {
            errors++;
        } else if (drive && drive.startsWith('http')) {
            driveLinks++;
        } else {
            nullLinks++;
        }
    }
    
    console.log(`\nLink Analysis:`);
    console.log(`Valid R2 Links (Supabase Storage): ${validR2}`);
    console.log(`Legacy Drive Links (No R2): ${driveLinks}`);
    console.log(`Migration Errors (e.g. NOT_PDF): ${errors}`);
    console.log(`No Links at all: ${nullLinks}`);
}

checkLeis();
