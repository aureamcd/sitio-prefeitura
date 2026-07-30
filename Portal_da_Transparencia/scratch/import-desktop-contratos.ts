import * as path from 'path';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const _dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(_dirname, '../.env') });

import fs from "fs";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";

// Setup Supabase
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Setup R2
const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});
const BUCKET = process.env.R2_BUCKET!;
const PUBLIC_URL = process.env.R2_PUBLIC_URL!;

const DESKTOP_FOLDER = "C:\\Users\\Áurea Letícia\\Desktop\\contratos";
const ORPHANS_FILE = "C:\\Users\\Áurea Letícia\\Desktop\\contratos_nao_identificados.txt";

const normalizeStr = (s: string) => s.replace(/[^0-9A-Z]/gi, '').toUpperCase();

async function run() {
  try {
      if (!fs.existsSync(DESKTOP_FOLDER)) {
        console.error(`Pasta não encontrada: ${DESKTOP_FOLDER}`);
        return;
      }

      console.log("Baixando contratos e documentos do banco de dados...");
      
      const { data: contratos, error: e1 } = await supabase.schema('transparencia').from('contratos_v2').select('id, numero, processo');
      if (e1) {
          console.error("Erro no Supabase contratos_v2:", e1);
          return;
      }
      
      const { data: documentos, error: e2 } = await supabase.schema('transparencia').from('contratos_documentos').select('id, nome_arquivo, contrato_id');
      if (e2) {
          console.error("Erro no Supabase contratos_documentos:", e2);
          return;
      }

      const existingDocs = new Set(documentos.map(d => d.nome_arquivo.toUpperCase()));

      console.log(`Carregados ${contratos.length} contratos do banco.`);
      
      // Limpa o arquivo de órfãos
      fs.writeFileSync(ORPHANS_FILE, "RELATÓRIO DE ARQUIVOS NÃO IDENTIFICADOS\n\n");

      const files = fs.readdirSync(DESKTOP_FOLDER).filter(f => f.toLowerCase().endsWith('.pdf'));
      console.log(`Encontrados ${files.length} arquivos PDF na Área de Trabalho.`);

      let uploadCount = 0;
      let dupCount = 0;
      let orphanCount = 0;
      let renamedCount = 0;

      for (const filename of files) {
        const filePath = path.join(DESKTOP_FOLDER, filename);
        let currentFilename = filename;
        
        console.log(`\nAnalisando: ${currentFilename}`);

        // Fase 1: Identificação pelo Nome
        let match = identifyContract(currentFilename, contratos);

        if (!match) {
            console.log(`❌ Órfão: O arquivo não tem um nome válido de contrato.`);
            fs.appendFileSync(ORPHANS_FILE, `- ${currentFilename}\n`);
            orphanCount++;
            continue;
        }

        // Fase Anti-Duplicidade
        if (existingDocs.has(currentFilename.toUpperCase())) {
            console.log(`⚠️ Duplicado: O arquivo ${currentFilename} já está no banco de dados. Ignorando.`);
            dupCount++;
            continue;
        }

        // Fase 3: Upload e Inserção
        try {
            console.log(`Identificado Contrato ID: ${match.id} | Subindo para R2...`);
            const novoPath = path.join(DESKTOP_FOLDER, currentFilename);
            const fileStream = fs.createReadStream(novoPath);
            const r2Key = `portal-transparencia/contratos/${currentFilename.replace(/\s+/g, '-')}`;

            await s3.send(
                new PutObjectCommand({
                    Bucket: BUCKET,
                    Key: r2Key,
                    Body: fileStream,
                    ContentType: "application/pdf",
                })
            );

            const urlArquivo = `${PUBLIC_URL}/${r2Key}`;

            const isAditivo = currentFilename.toUpperCase().includes('ADITIVO');
            const tipoDoc = isAditivo ? 'Aditivo' : 'Contrato';

            const { error: insErr } = await supabase.schema('transparencia').from('contratos_documentos').insert({
                contrato_id: match.id,
                tipo_documento: tipoDoc,
                nome_arquivo: currentFilename,
                url_arquivo: urlArquivo,
                caminho_r2: r2Key,
                origem: 'importacao-desktop'
            });

            if (insErr) {
                 console.log(`❌ Erro no banco de dados ao salvar ${currentFilename}:`, insErr);
                 continue;
            }

            console.log(`✅ Sucesso! Inserido no BD como ${tipoDoc}.`);
            existingDocs.add(currentFilename.toUpperCase()); 
            uploadCount++;
        } catch (err: any) {
            console.log(`❌ Erro no upload de ${currentFilename}: ${err.message}`);
        }
      }

      console.log("\n=================================");
      console.log("RESUMO DA MIGRAÇÃO (DESKTOP)");
      console.log("=================================");
      console.log(`Total analisado: ${files.length}`);
      console.log(`Arquivos subidos p/ Nuvem: ${uploadCount}`);
      console.log(`Arquivos duplicados ignorados: ${dupCount}`);
      console.log(`Arquivos Órfãos: ${orphanCount} (Veja contratos_nao_identificados.txt)`);
  } catch (err) {
      console.error("Critical error:", err);
  }
}

function identifyContract(filename: string, contratos: any[]) {
    const fn = filename.toUpperCase();
    
    // Regra 1: "CONTRATO 045-2023" ou "ADITIVO CONTRATO 045-2023"
    const regex1 = /CONTRATO(?:S)?\s+(?:ADM(?:INISTRATIVO)?\s+)?([0-9A-Z\-\/]+)/;
    const p1 = fn.match(regex1);
    if (p1) {
        const num = p1[1].replace('.PDF', '').trim();
        const m = contratos.find(c => c.numero && normalizeStr(c.numero) === normalizeStr(num));
        if (m) return m;
    }

    // Regra 2: "PA 077-2020"
    const regex2 = /PA\s+([0-9A-Z\-\/]+)/;
    const p2 = fn.match(regex2);
    if (p2) {
        const num = p2[1].replace('.PDF', '').trim();
        const m = contratos.find(c => c.processo && normalizeStr(c.processo) === normalizeStr(num));
        if (m) return m;
    }
    
    // Regra 3: "CONTRATUAL 012-2021"
    const regex3 = /CONTRATUAL\s+([0-9A-Z\-\/]+)/;
    const p3 = fn.match(regex3);
    if (p3) {
        const num = p3[1].replace('.PDF', '').trim();
        const m = contratos.find(c => c.numero && normalizeStr(c.numero) === normalizeStr(num));
        if (m) return m;
    }

    return null;
}

run();
