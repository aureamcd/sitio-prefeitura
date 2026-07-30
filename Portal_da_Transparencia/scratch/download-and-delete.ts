import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import fs from 'fs';

const _dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(_dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function downloadAndDelete() {
  console.log("Fetching the remaining 11 aditivos from licitacoes_documentos...");
  const { data: aditivos, error: e1 } = await supabase
    .schema('transparencia')
    .from('licitacoes_documentos')
    .select('*')
    .or('tipo_documento.ilike.%aditivo%,nome_arquivo.ilike.%aditivo%');

  if (e1) {
    console.error("Error fetching aditivos:", e1);
    return;
  }

  if (aditivos.length === 0) {
      console.log("No aditivos found to process!");
      return;
  }

  console.log(`Found ${aditivos.length} aditivos to process.`);

  const downloadFolder = path.resolve(_dirname, 'aditivos_restantes');
  if (!fs.existsSync(downloadFolder)) {
      fs.mkdirSync(downloadFolder);
  }

  let deletedCount = 0;

  for (const doc of aditivos) {
      const filename = doc.nome_arquivo;
      const url = doc.url_arquivo;
      
      console.log(`\nProcessing: ${filename}`);
      
      try {
          // 1. Download
          const response = await fetch(url);
          if (!response.ok) {
              throw new Error(`Failed to download: ${response.statusText}`);
          }
          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          
          const filePath = path.join(downloadFolder, filename.replace(/[/\\?%*:|"<>]/g, '-'));
          fs.writeFileSync(filePath, buffer);
          console.log(`✅ Downloaded to ${filePath}`);

          // 2. Delete from DB
          const { error: delErr } = await supabase
            .schema('transparencia')
            .from('licitacoes_documentos')
            .delete()
            .eq('id', doc.id);

          if (delErr) {
              console.error(`❌ Failed to delete from DB:`, delErr.message);
          } else {
              console.log(`✅ Deleted from licitacoes_documentos.`);
              deletedCount++;
          }
      } catch (err: any) {
          console.error(`❌ Error processing ${filename}:`, err.message);
      }
  }

  console.log(`\nFinished! Downloaded and deleted ${deletedCount} out of ${aditivos.length} aditivos.`);
}

downloadAndDelete();
