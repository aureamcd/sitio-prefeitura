import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const _dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(_dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLinks() {
  console.log("Fetching licitacoes_documentos...");
  const { data: documentos, error } = await supabase
    .schema('transparencia')
    .from('licitacoes_documentos')
    .select('id, nome_arquivo, url_arquivo');

  if (error) {
    console.error("Error:", error.message);
    return;
  }

  console.log(`Found ${documentos.length} documents in licitações.`);
  if (documentos.length === 0) return;

  // Let's sample 20 random documents to check if the URLs are physically reachable
  const sampleSize = Math.min(20, documentos.length);
  const shuffled = documentos.sort(() => 0.5 - Math.random());
  const sample = shuffled.slice(0, sampleSize);
  
  console.log(`\nPinging ${sampleSize} random URLs to ensure they exist on the server (HTTP 200)...`);
  
  let successCount = 0;
  let failCount = 0;

  for (const doc of sample) {
      if (!doc.url_arquivo) {
          console.log(`❌ FAIL: Missing URL for ${doc.nome_arquivo}`);
          failCount++;
          continue;
      }

      try {
          // Use HEAD request to not download the whole file
          const response = await fetch(doc.url_arquivo, { method: 'HEAD' });
          if (response.ok) {
              successCount++;
          } else {
              console.log(`❌ FAIL (${response.status}): ${doc.url_arquivo}`);
              failCount++;
          }
      } catch (err: any) {
          console.log(`❌ ERROR connecting to ${doc.url_arquivo}:`, err.message);
          failCount++;
      }
  }

  console.log(`\nResults of Ping Test:`);
  console.log(`✅ ${successCount} URLs returned HTTP 200 OK`);
  console.log(`❌ ${failCount} URLs failed`);
}

checkLinks();
