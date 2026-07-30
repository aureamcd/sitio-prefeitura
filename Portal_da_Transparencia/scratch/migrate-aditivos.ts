import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const _dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(_dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateAditivos() {
  console.log("Fetching aditivos from licitacoes_documentos...");
  const { data: aditivos, error: e1 } = await supabase
    .schema('transparencia')
    .from('licitacoes_documentos')
    .select('*, licitacoes:licitacoes_v2(id, numero, processo)')
    .or('tipo_documento.ilike.%aditivo%,nome_arquivo.ilike.%aditivo%');

  if (e1) {
    console.error("Error fetching aditivos:", e1);
    return;
  }

  console.log("Fetching contratos...");
  const { data: contratos, error: e2 } = await supabase
    .schema('transparencia')
    .from('contratos_v2')
    .select('id, numero, processo, ano');

  if (e2) {
    console.error("Error fetching contratos:", e2);
    return;
  }

  let mappedDocs = [];
  let unmappedDocs = [];

  for (const doc of aditivos) {
      const lic = doc.licitacoes;
      let match = null;

      if (lic && lic.processo) {
          match = contratos.find(c => c.processo === lic.processo || c.processo === lic.numero);
      }

      if (!match) {
          const filename = doc.nome_arquivo.toUpperCase();
          
          const regexContrato = /CONTRATO(?:S)?\s+(?:ADM(?:INISTRATIVO)?\s+)?([0-9A-Z\-\/]+)/;
          const parsedContrato = filename.match(regexContrato);
          if (parsedContrato) {
              let numContrato = parsedContrato[1].replace('.PDF', '').trim();
              const normalize = (s: string) => s.replace(/[^0-9A-Z]/g, '');
              const normNumContrato = normalize(numContrato);
              match = contratos.find(c => c.numero && normalize(c.numero) === normNumContrato);
          }

          if (!match) {
              const regexPA = /PA\s+([0-9A-Z\-\/]+)/;
              const parsedPA = filename.match(regexPA);
              if (parsedPA) {
                  let numPA = parsedPA[1].replace('.PDF', '').trim();
                  const normalize = (s: string) => s.replace(/[^0-9A-Z]/g, '');
                  const normNumPA = normalize(numPA);
                  match = contratos.find(c => c.processo && normalize(c.processo) === normNumPA);
              }
          }

          if (!match) {
              const regexContratual = /CONTRATUAL\s+([0-9A-Z\-\/]+)/;
              const parsedContratual = filename.match(regexContratual);
              if (parsedContratual) {
                  let numContrato = parsedContratual[1].replace('.PDF', '').trim();
                  const normalize = (s: string) => s.replace(/[^0-9A-Z]/g, '');
                  match = contratos.find(c => c.numero && normalize(c.numero) === normalize(numContrato));
              }
          }
      }

      if (match) {
          mappedDocs.push({ originalDoc: doc, contrato: match });
      } else {
          unmappedDocs.push(doc.nome_arquivo);
      }
  }

  console.log(`Ready to migrate ${mappedDocs.length} aditivos. Leaving ${unmappedDocs.length} unmapped.`);

  // Perform migration
  let successCount = 0;
  for (const item of mappedDocs) {
      const { originalDoc, contrato } = item;
      
      // Prepare new record for contratos_documentos
      const newRecord = {
          contrato_id: contrato.id,
          tipo_documento: 'Aditivo',
          nome_arquivo: originalDoc.nome_arquivo,
          url_arquivo: originalDoc.url_arquivo,
          caminho_r2: originalDoc.caminho_r2,
          origem: originalDoc.origem,
          tamanho: originalDoc.tamanho,
          created_at: originalDoc.created_at
      };

      // 1. Insert into contratos_documentos
      const { error: insErr } = await supabase
          .schema('transparencia')
          .from('contratos_documentos')
          .insert(newRecord);
          
      if (insErr) {
          console.error(`Failed to insert ${originalDoc.nome_arquivo}:`, insErr.message);
          continue; // skip deletion if insert fails
      }

      // 2. Delete from licitacoes_documentos
      const { error: delErr } = await supabase
          .schema('transparencia')
          .from('licitacoes_documentos')
          .delete()
          .eq('id', originalDoc.id);
          
      if (delErr) {
          console.error(`Failed to delete ${originalDoc.nome_arquivo} from licitacoes_documentos:`, delErr.message);
      } else {
          successCount++;
      }
  }

  console.log(`\nMigration completed! Successfully moved ${successCount} aditivos.`);
  console.log(`\nHere are the ${unmappedDocs.length} files that need manual fixing:\n`);
  unmappedDocs.forEach(f => console.log(`- ${f}`));
}

migrateAditivos();
