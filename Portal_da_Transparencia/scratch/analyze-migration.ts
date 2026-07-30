import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const _dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(_dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function parseAndMatch() {
  const { data: aditivos, error: e1 } = await supabase
    .schema('transparencia')
    .from('licitacoes_documentos')
    .select('*, licitacoes:licitacoes_v2(id, numero, processo)')
    .or('tipo_documento.ilike.%aditivo%,nome_arquivo.ilike.%aditivo%');

  if (e1) {
    console.error(e1);
    return;
  }

  const { data: contratos, error: e2 } = await supabase
    .schema('transparencia')
    .from('contratos_v2')
    .select('id, numero, processo, ano');

  if (e2) {
    console.error(e2);
    return;
  }

  let mappedByLicitacao = 0;
  let mappedByFilename = 0;
  let unmapped = 0;
  
  let unmappedFiles = [];

  for (const doc of aditivos) {
      const lic = doc.licitacoes;
      
      let match = null;

      if (lic && lic.processo) {
          match = contratos.find(c => c.processo === lic.processo || c.processo === lic.numero);
          if (match) {
              mappedByLicitacao++;
              continue;
          }
      }

      const filename = doc.nome_arquivo.toUpperCase();
      
      // More aggressive regex: CONTRATO (ADM) 032-A-2021
      const regexContrato = /CONTRATO(?:S)?\s+(?:ADM(?:INISTRATIVO)?\s+)?([0-9A-Z\-\/]+)/;
      const parsedContrato = filename.match(regexContrato);
      
      if (parsedContrato) {
          let numContrato = parsedContrato[1].replace('.PDF', '').trim();
          const normalize = (s: string) => s.replace(/[^0-9A-Z]/g, '');
          const normNumContrato = normalize(numContrato);

          match = contratos.find(c => c.numero && normalize(c.numero) === normNumContrato);
          
          if (match) {
              mappedByFilename++;
              continue;
          }
      }

      const regexPA = /PA\s+([0-9A-Z\-\/]+)/;
      const parsedPA = filename.match(regexPA);
      if (parsedPA) {
          let numPA = parsedPA[1].replace('.PDF', '').trim();
          const normalize = (s: string) => s.replace(/[^0-9A-Z]/g, '');
          const normNumPA = normalize(numPA);

          match = contratos.find(c => c.processo && normalize(c.processo) === normNumPA);
          
          if (match) {
              mappedByFilename++;
              continue;
          }
      }
      
      // If still not matched, maybe it says "CONTRATUAL 012-2021"
      const regexContratual = /CONTRATUAL\s+([0-9A-Z\-\/]+)/;
      const parsedContratual = filename.match(regexContratual);
      if (parsedContratual) {
          let numContrato = parsedContratual[1].replace('.PDF', '').trim();
          const normalize = (s: string) => s.replace(/[^0-9A-Z]/g, '');
          match = contratos.find(c => c.numero && normalize(c.numero) === normalize(numContrato));
          if (match) {
              mappedByFilename++;
              continue;
          }
      }

      unmapped++;
      unmappedFiles.push(filename);
  }

  console.log(`Mapped by Licitacao Processo: ${mappedByLicitacao}`);
  console.log(`Mapped by Filename parsing: ${mappedByFilename}`);
  console.log(`Still Unmapped: ${unmapped}`);
  if (unmapped > 0) {
      console.log("Unmapped files:");
      console.log(unmappedFiles);
  }
}

parseAndMatch();
