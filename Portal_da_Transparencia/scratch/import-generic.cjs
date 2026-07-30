const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const fs = require("fs");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { createClient } = require("@supabase/supabase-js");
const pdfParse = require("pdf-parse");

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});
const BUCKET = process.env.R2_BUCKET;
const PUBLIC_URL = process.env.R2_PUBLIC_URL;

const YEAR = process.argv[2];
if (!YEAR) {
  console.error("ERRO: Forneça um ano como argumento. Ex: node import-generic.cjs 2023");
  process.exit(1);
}

const DESKTOP_FOLDER = `C:\\Users\\Áurea Letícia\\Desktop\\contratos\\Contratos\\${YEAR}`;

const normalizeStr = (s) => s.replace(/[^0-9A-Z]/gi, '').toUpperCase();

function walkSync(dir, filelist = []) {
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
    }
  }
  return filelist;
}

async function run() {
  try {
      if (!fs.existsSync(DESKTOP_FOLDER)) {
        console.error(`Pasta não encontrada: ${DESKTOP_FOLDER}`);
        return;
      }

      console.log(`Baixando contratos e documentos do banco de dados para ${YEAR}...`);
      
      let offset = 0;
      let limit = 1000;
      let contratos = [];
      while(true) {
         const { data } = await supabase.schema('transparencia').from('contratos_v2').select('id, numero, processo').eq('ano', YEAR).range(offset, offset + limit - 1);
         if (!data || data.length === 0) break;
         contratos = contratos.concat(data);
         offset += limit;
      }
      
      const { data: documentos } = await supabase.schema('transparencia').from('contratos_documentos').select('id, nome_arquivo, contrato_id');

      const existingDocs = new Set(documentos.map(d => d.nome_arquivo.toUpperCase()));

      const filesPaths = walkSync(DESKTOP_FOLDER);
      console.log(`Encontrados ${filesPaths.length} arquivos PDF na pasta ${YEAR}.`);

      let uploadCount = 0;
      let dupCount = 0;
      let orphanCount = 0;
      let renamedCount = 0;
      let deletedCount = 0;

      for (const filePath of filesPaths) {
        let currentFilename = path.basename(filePath);
        const folderDir = path.dirname(filePath);
        
        console.log(`\nAnalisando: ${currentFilename}`);

        let match = identifyContract(currentFilename, contratos);

        if (!match) {
           console.log(`Nome genérico. Tentando ler o conteúdo do PDF...`);
           try {
               const dataBuffer = fs.readFileSync(filePath);
               const data = await pdfParse(dataBuffer, { max: 3 }); 
               const text = data.text;
               
               const regex = /(?:CONTRATO|ADITIVO).*?(?:N[º°]?\s*)?([0-9]{2,4}[-\/][0-9]{4})/i;
               const textMatch = text.match(regex);
               
               if (textMatch) {
                   const numExtraido = textMatch[1].replace('/', '-'); 
                   const isAditivo = text.toUpperCase().includes('ADITIVO');
                   
                   const novoNome = isAditivo ? `ADITIVO AO CONTRATO ${numExtraido}.pdf` : `CONTRATO ${numExtraido}.pdf`;
                   
                   const novoPath = path.join(folderDir, novoNome);
                   if (!fs.existsSync(novoPath) && novoNome !== currentFilename) {
                       fs.renameSync(filePath, novoPath);
                       console.log(`RENOMEADO de [${currentFilename}] para [${novoNome}]`);
                       currentFilename = novoNome;
                       renamedCount++;
                   }
                   
                   match = identifyContract(currentFilename, contratos);
               } else {
                   console.log("Sem texto reconhecível (possível imagem).");
               }
           } catch (err) {
               console.log(`Erro ao ler PDF ${currentFilename}: ${err.message}`);
           }
        }

        if (!match) {
            console.log(`❌ Órfão: Não foi possível identificar o contrato no BD.`);
            orphanCount++;
            continue;
        }

        if (existingDocs.has(currentFilename.toUpperCase())) {
            console.log(`⚠️ Duplicado exato por nome: O arquivo ${currentFilename} já está no banco de dados. EXCLUINDO da pasta local.`);
            try {
                const currentPath = path.join(folderDir, currentFilename);
                fs.unlinkSync(currentPath);
                deletedCount++;
            } catch (err) {
                console.log(`Erro ao excluir ${currentFilename}:`, err.message);
            }
            dupCount++;
            continue;
        }

        try {
            console.log(`Identificado Contrato ID: ${match.id} | Subindo para R2...`);
            const novoPath = path.join(folderDir, currentFilename);
            const fileStream = fs.createReadStream(novoPath);
            // Replace non-ascii chars to avoid S3 bugs and spaces to dashes
            const safeName = currentFilename.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9.\-]/g, '-');
            const r2Key = `portal-transparencia/contratos/${YEAR}/${safeName}`;

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
                origem: `importacao-desktop-${YEAR}`
            });

            if (insErr) {
                 console.log(`❌ Erro no BD:`, insErr.message);
                 continue;
            }

            console.log(`✅ Inserido no BD. EXCLUINDO da pasta local.`);
            try {
                fs.unlinkSync(novoPath);
                deletedCount++;
            } catch (err) {
                console.log(`Erro ao excluir:`, err.message);
            }
            
            existingDocs.add(currentFilename.toUpperCase()); 
            uploadCount++;
        } catch (err) {
            console.log(`❌ Erro upload: ${err.message}`);
        }
      }

      console.log("\n=================================");
      console.log(`RESUMO DA MIGRAÇÃO (PASTA ${YEAR})`);
      console.log("=================================");
      console.log(`Total analisado: ${filesPaths.length}`);
      console.log(`Renomeados por OCR: ${renamedCount}`);
      console.log(`Novos Uploads para R2: ${uploadCount}`);
      console.log(`Duplicados ignorados (mesmo nome): ${dupCount}`);
      console.log(`Arquivos Apagados do Computador: ${deletedCount}`);
      console.log(`Arquivos Órfãos Restantes: ${orphanCount}`);
  } catch (err) {
      console.error("Critical error:", err);
  }
}

function findMatch(cleanNum, contratos) {
    let m = contratos.find(c => c.numero && normalizeStr(c.numero) === normalizeStr(cleanNum));
    if (m) return m;
    
    // Tentar sem o ano (ex: 051-2021 tenta achar 051) se a string original tinha -YYYY
    const parts = cleanNum.split('-');
    if (parts.length > 1) {
        const baseNum = parts[0];
        m = contratos.find(c => c.numero && normalizeStr(c.numero) === normalizeStr(baseNum));
        if (m) return m;
    }
    return null;
}

function identifyContract(filename, contratos) {
    const fn = filename.toUpperCase();
    
    // "CONTRATO 051-2021" ou "CONT 038"
    const regex1 = /(?:CONTRATO(?:S)?|CONT|CT)\s+(?:ADM(?:INISTRATIVO)?\s+)?(?:N[º°]?\s*)?([0-9A-Z\-\/]+)/;
    const p1 = fn.match(regex1);
    if (p1) {
        const num = p1[1].replace('.PDF', '').trim();
        const cleanNum = num.replace(/[-\/]$/, '');
        const m = findMatch(cleanNum, contratos);
        if (m) return m;
    }

    const regex2 = /PA\s+([0-9A-Z\-\/]+)/;
    const p2 = fn.match(regex2);
    if (p2) {
        const num = p2[1].replace('.PDF', '').trim();
        const cleanNum = num.replace(/[-\/]$/, '');
        const m = contratos.find(c => c.processo && normalizeStr(c.processo) === normalizeStr(cleanNum));
        if (m) return m;
    }
    
    const regex3 = /CONTRATUAL\s+(?:N[º°]?\s*)?([0-9A-Z\-\/]+)/;
    const p3 = fn.match(regex3);
    if (p3) {
        const num = p3[1].replace('.PDF', '').trim();
        const cleanNum = num.replace(/[-\/]$/, '');
        const m = findMatch(cleanNum, contratos);
        if (m) return m;
    }

    const regex4 = /ADITIVO.*?(?:N[º°]?\s*)?([0-9]{2,4}[-\/][0-9]{4})/i;
    const p4 = fn.match(regex4);
    if (p4) {
        const num = p4[1].replace('/', '-').replace('.PDF', '').trim();
        const cleanNum = num.replace(/[-\/]$/, '');
        const m = findMatch(cleanNum, contratos);
        if (m) return m;
    }

    // Regra para capturar "CONTRATO Nº 2021-002.pdf" -> Inverter para 002-2021
    const regex5 = /CONTRATO(?:S)?\s+(?:N[º°]?\s*)?([0-9]{4})[-\/]([0-9]{2,4})/;
    const p5 = fn.match(regex5);
    if (p5) {
        const year = p5[1];
        const num = p5[2];
        const cleanNum = `${num}-${year}`;
        const m = findMatch(cleanNum, contratos);
        if (m) return m;
    }
    
    // Tenta apenas pegar os números se for do tipo XXX-YYYY
    const regex6 = /^([0-9]{2,4}[-\/][0-9]{4})\b/;
    const p6 = fn.match(regex6);
    if (p6) {
        const num = p6[1].replace('/', '-').trim();
        const m = findMatch(num, contratos);
        if (m) return m;
    }

    return null;
}

run();
