const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const fs = require("fs");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { createClient } = require("@supabase/supabase-js");
const pdfParse = require("pdf-parse");

// Setup Supabase
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Setup R2
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

const DESKTOP_FOLDER = "C:\\Users\\Áurea Letícia\\Desktop\\contratos";
const ORPHANS_FILE = "C:\\Users\\Áurea Letícia\\Desktop\\contratos_nao_identificados.txt";

const normalizeStr = (s) => s.replace(/[^0-9A-Z]/gi, '').toUpperCase();

// Recursivamente busca todos os arquivos
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
      // Ignore
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
      
      fs.writeFileSync(ORPHANS_FILE, "RELATÓRIO DE ARQUIVOS NÃO IDENTIFICADOS NAS SUBPASTAS DA ÁREA DE TRABALHO\n\n");

      // Buscar recursivamente
      const filesPaths = walkSync(DESKTOP_FOLDER);
      console.log(`Encontrados ${filesPaths.length} arquivos PDF na Área de Trabalho e suas subpastas.`);

      let uploadCount = 0;
      let dupCount = 0;
      let orphanCount = 0;
      let renamedCount = 0;
      let deletedCount = 0;

      for (const filePath of filesPaths) {
        let currentFilename = path.basename(filePath);
        const folderDir = path.dirname(filePath);
        
        console.log(`\nAnalisando: ${currentFilename} (Pasta: ${path.basename(folderDir)})`);

        // Fase 1: Identificação pelo Nome
        let match = identifyContract(currentFilename, contratos);

        // Fase 2: Leitura Profunda
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
            console.log(`❌ Órfão: Não foi possível identificar o contrato.`);
            fs.appendFileSync(ORPHANS_FILE, `- ${currentFilename} (Pasta: ${path.basename(folderDir)})\n`);
            orphanCount++;
            continue;
        }

        // Fase Anti-Duplicidade e Exclusão
        if (existingDocs.has(currentFilename.toUpperCase())) {
            console.log(`⚠️ Duplicado: O arquivo ${currentFilename} já está no banco de dados. EXCLUINDO da pasta local.`);
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

        // Fase 3: Upload, Inserção e Exclusão
        try {
            console.log(`Identificado Contrato ID: ${match.id} | Subindo para R2...`);
            const novoPath = path.join(folderDir, currentFilename);
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
                origem: 'importacao-desktop-subpastas'
            });

            if (insErr) {
                 console.log(`❌ Erro no banco de dados ao salvar ${currentFilename}:`, insErr);
                 continue;
            }

            console.log(`✅ Sucesso! Inserido no BD como ${tipoDoc}. EXCLUINDO da pasta local.`);
            try {
                fs.unlinkSync(novoPath);
                deletedCount++;
            } catch (err) {
                console.log(`Erro ao excluir arquivo enviado ${currentFilename}:`, err.message);
            }
            
            existingDocs.add(currentFilename.toUpperCase()); 
            uploadCount++;
        } catch (err) {
            console.log(`❌ Erro no upload de ${currentFilename}: ${err.message}`);
        }
      }

      console.log("\n=================================");
      console.log("RESUMO DA MIGRAÇÃO E LIMPEZA (DESKTOP + SUBPASTAS)");
      console.log("=================================");
      console.log(`Total analisado: ${filesPaths.length}`);
      console.log(`Renomeados internamente pelo PDF: ${renamedCount}`);
      console.log(`Arquivos subidos p/ Nuvem: ${uploadCount}`);
      console.log(`Arquivos duplicados ignorados: ${dupCount}`);
      console.log(`Arquivos Excluídos do Computador (Limpeza): ${deletedCount}`);
      console.log(`Arquivos Órfãos: ${orphanCount}`);
  } catch (err) {
      console.error("Critical error:", err);
  }
}

function identifyContract(filename, contratos) {
    const fn = filename.toUpperCase();
    
    // Regra 1: "CONTRATO Nº 045-2023" ou "CONTRATO 045-2023"
    const regex1 = /CONTRATO(?:S)?\s+(?:ADM(?:INISTRATIVO)?\s+)?(?:N[º°]?\s*)?([0-9A-Z\-\/]+)/;
    const p1 = fn.match(regex1);
    if (p1) {
        const num = p1[1].replace('.PDF', '').trim();
        // Remove traços/barras extras no final que podem ter sido capturados (ex: 046-2020-)
        const cleanNum = num.replace(/[-\/]$/, '');
        const m = contratos.find(c => c.numero && normalizeStr(c.numero) === normalizeStr(cleanNum));
        if (m) return m;
    }

    // Regra 2: "PA 077-2020"
    const regex2 = /PA\s+([0-9A-Z\-\/]+)/;
    const p2 = fn.match(regex2);
    if (p2) {
        const num = p2[1].replace('.PDF', '').trim();
        const cleanNum = num.replace(/[-\/]$/, '');
        const m = contratos.find(c => c.processo && normalizeStr(c.processo) === normalizeStr(cleanNum));
        if (m) return m;
    }
    
    // Regra 3: "CONTRATUAL 012-2021"
    const regex3 = /CONTRATUAL\s+(?:N[º°]?\s*)?([0-9A-Z\-\/]+)/;
    const p3 = fn.match(regex3);
    if (p3) {
        const num = p3[1].replace('.PDF', '').trim();
        const cleanNum = num.replace(/[-\/]$/, '');
        const m = contratos.find(c => c.numero && normalizeStr(c.numero) === normalizeStr(cleanNum));
        if (m) return m;
    }

    // Regra 4: "ADITIVO... 010-2023"
    const regex4 = /ADITIVO.*?(?:N[º°]?\s*)?([0-9]{2,4}[-\/][0-9]{4})/i;
    const p4 = fn.match(regex4);
    if (p4) {
        const num = p4[1].replace('/', '-').replace('.PDF', '').trim();
        const cleanNum = num.replace(/[-\/]$/, '');
        const m = contratos.find(c => c.numero && normalizeStr(c.numero) === normalizeStr(cleanNum));
        if (m) return m;
    }

    return null;
}

run();
