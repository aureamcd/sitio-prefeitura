import * as path from 'path';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import fs from "fs";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";

const _dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(_dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

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

const DRIVE_FOLDER = "G:\\.shortcut-targets-by-id\\0B9YMQ8K2UJUKd28ybG9UOW9WODg\\padremarcos.pi.gov.br";
const ORPHANS_FILE = "C:\\Users\\Áurea Letícia\\Desktop\\contratos_perdidos_drive.txt";

const normalizeStr = (s: string) => s.replace(/[^0-9A-Z]/gi, '').toUpperCase();

// Faz varredura recursiva pegando apenas os PDFs
function walkSync(dir: string, filelist: string[] = []) {
  if (!fs.existsSync(dir)) return filelist;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filepath = path.join(dir, file);
    try {
      const stat = fs.statSync(filepath);
      if (stat.isDirectory()) {
        filelist = walkSync(filepath, filelist);
      } else {
        if (file.toLowerCase().endsWith('.pdf')) {
          filelist.push(filepath);
        }
      }
    } catch (e) {
      // Ignora arquivos inacessíveis
    }
  }
  return filelist;
}

async function run() {
  console.log("Iniciando varredura profunda no Drive...");
  if (!fs.existsSync(DRIVE_FOLDER)) {
    console.error("Disco G: não encontrado ou inacessível.");
    return;
  }

  const { data: contratos, error: e1 } = await supabase.schema('transparencia').from('contratos_v2').select('id, numero, processo');
  if (e1) { console.error(e1); return; }
  
  const { data: documentos, error: e2 } = await supabase.schema('transparencia').from('contratos_documentos').select('id, nome_arquivo');
  if (e2) { console.error(e2); return; }

  const existingDocs = new Set(documentos.map(d => d.nome_arquivo.toUpperCase()));
  console.log(`Carregados ${contratos.length} contratos e ${documentos.length} documentos já existentes.`);

  fs.writeFileSync(ORPHANS_FILE, "RELATÓRIO DE CONTRATOS/ADITIVOS PERDIDOS NO DRIVE QUE NÃO FORAM IDENTIFICADOS\n\n");

  const allPdfs = walkSync(DRIVE_FOLDER);
  console.log(`Encontrados ${allPdfs.length} PDFs no Drive total.`);

  let uploadCount = 0;
  let dupCount = 0;
  let orphanCount = 0;

  for (const filePath of allPdfs) {
    const filename = path.basename(filePath);
    const upperName = filename.toUpperCase();

    // Filtro básico: se não tiver palavras-chave no nome, a gente pula pra não sujar o log com Atas e Leis
    const isContratoLike = upperName.includes('CONTRATO') || upperName.includes('ADITIVO') || upperName.includes('TERMO') || upperName.includes('PA ') || upperName.includes('CONTRATUAL');
    
    if (!isContratoLike) continue;

    // Se já estiver no banco com ESSE exato nome, pula
    if (existingDocs.has(upperName)) {
        dupCount++;
        continue;
    }

    // Tenta identificar
    let match = identifyContract(filename, contratos);

    if (!match) {
        // É um contrato/aditivo perdido que o robô não soube ler o número
        fs.appendFileSync(ORPHANS_FILE, `- [Não Identificado] ${filename} (Local: ${filePath})\n`);
        orphanCount++;
        continue;
    }

    // É inédito e foi identificado!
    try {
        console.log(`\nAchamos um perdido! [${filename}] -> Contrato ID: ${match.id}`);
        const fileStream = fs.createReadStream(filePath);
        const r2Key = `portal-transparencia/contratos/recuperados/${filename.replace(/\s+/g, '-')}`;

        await s3.send(new PutObjectCommand({
            Bucket: BUCKET,
            Key: r2Key,
            Body: fileStream,
            ContentType: "application/pdf",
        }));

        const isAditivo = upperName.includes('ADITIVO');
        const tipoDoc = isAditivo ? 'Aditivo' : 'Contrato';

        const { error: insErr } = await supabase.schema('transparencia').from('contratos_documentos').insert({
            contrato_id: match.id,
            tipo_documento: tipoDoc,
            nome_arquivo: filename,
            url_arquivo: `${PUBLIC_URL}/${r2Key}`,
            caminho_r2: r2Key,
            origem: 'importacao-drive-profunda'
        });

        if (insErr) {
             console.log(`❌ Erro no banco de dados ao salvar ${filename}:`, insErr);
             continue;
        }

        console.log(`✅ Sucesso! Resgatado e inserido como ${tipoDoc}.`);
        existingDocs.add(upperName);
        uploadCount++;
    } catch (err: any) {
        console.log(`❌ Erro no upload de ${filename}: ${err.message}`);
    }
  }

  console.log("\n=================================");
  console.log("RESUMO DA VARREDURA NO DRIVE");
  console.log("=================================");
  console.log(`Total de PDFs varridos: ${allPdfs.length}`);
  console.log(`Repetidos ignorados: ${dupCount}`);
  console.log(`Arquivos INÉDITOS recuperados para a nuvem: ${uploadCount}`);
  console.log(`Arquivos Órfãos (Nomes suspeitos, mas sem número): ${orphanCount}`);
  console.log(`Arquivo de órfãos gerado em: ${ORPHANS_FILE}`);
}

function identifyContract(filename: string, contratos: any[]) {
    const fn = filename.toUpperCase();
    const regex1 = /CONTRATO(?:S)?\s+(?:ADM(?:INISTRATIVO)?\s+)?([0-9A-Z\-\/]+)/;
    const p1 = fn.match(regex1);
    if (p1) {
        const num = p1[1].replace('.PDF', '').trim();
        const m = contratos.find(c => c.numero && normalizeStr(c.numero) === normalizeStr(num));
        if (m) return m;
    }
    const regex2 = /PA\s+([0-9A-Z\-\/]+)/;
    const p2 = fn.match(regex2);
    if (p2) {
        const num = p2[1].replace('.PDF', '').trim();
        const m = contratos.find(c => c.processo && normalizeStr(c.processo) === normalizeStr(num));
        if (m) return m;
    }
    const regex3 = /CONTRATUAL\s+([0-9A-Z\-\/]+)/;
    const p3 = fn.match(regex3);
    if (p3) {
        const num = p3[1].replace('.PDF', '').trim();
        const m = contratos.find(c => c.numero && normalizeStr(c.numero) === normalizeStr(num));
        if (m) return m;
    }
    const regex4 = /ADITIVO.*?(?:N[º°]?)?\s*([0-9]{2,4}[-\/][0-9]{4})/i;
    const p4 = fn.match(regex4);
    if (p4) {
        const num = p4[1].replace('/', '-').replace('.PDF', '').trim();
        const m = contratos.find(c => c.numero && normalizeStr(c.numero) === normalizeStr(num));
        if (m) return m;
    }
    return null;
}

run();
