const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
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

const DESKTOP_FOLDER = `C:\\Users\\Áurea Letícia\\Desktop\\contratos\\Contratos`;

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

const normalizeStr = (s) => s.replace(/[^0-9A-Z]/gi, '').toUpperCase();
function extractBaseNumber(numStr) {
  if (!numStr) return null;
  const match = numStr.match(/0*(\d+(?:-[A-Za-z]+)?)/);
  if (match) return match[1].toUpperCase();
  return null;
}

async function run() {
  const filesPaths = walkSync(DESKTOP_FOLDER);
  console.log(`Encontrados ${filesPaths.length} arquivos PDF na pasta ${DESKTOP_FOLDER}.`);

  // Load all existing contracts to memory for quick match
  let offset = 0;
  let limit = 1000;
  let allContratos = [];
  while(true) {
      const { data } = await supabase.schema('transparencia').from('contratos_v2').select('id, numero, ano, processo').range(offset, offset + limit - 1);
      if (!data || data.length === 0) break;
      allContratos = allContratos.concat(data);
      offset += limit;
  }
  
  const { data: documentos } = await supabase.schema('transparencia').from('contratos_documentos').select('nome_arquivo');
  const existingDocs = new Set(documentos.map(d => d.nome_arquivo.toUpperCase()));

  let uploadCount = 0;
  let newContractsCount = 0;
  let unreadableCount = 0;

  for (const filePath of filesPaths) {
    const currentFilename = path.basename(filePath);
    const folderDir = path.dirname(filePath);
    
    // Extrai ano do caminho da pasta (ex: .../Contratos/2024/...)
    let folderYear = null;
    const yearMatch = folderDir.match(/\\(20[1-2][0-9])(?:\\|$)/);
    if (yearMatch) {
        folderYear = parseInt(yearMatch[1], 10);
    }
    
    // Tentar ler o PDF
    let text = "";
    try {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdfParse(dataBuffer, { max: 3 }); 
        text = data.text;
    } catch (err) {
        console.log(`❌ Erro ao ler PDF ${currentFilename}: ${err.message}`);
        unreadableCount++;
        continue;
    }

    if (!text || text.trim().length < 50) {
        console.log(`⚠️ PDF parece ser uma imagem ou está vazio: ${currentFilename}. Deixando na pasta.`);
        unreadableCount++;
        continue;
    }

    // Tentar achar numero e ano no texto
    const regex = /(?:CONTRATO|ADITIVO).*?(?:N[º°]?\s*)?([0-9]{2,4}[-\/][0-9]{4})/i;
    const textMatch = text.match(regex) || currentFilename.match(regex);
    
    let numeroFormatado = null;
    let year = folderYear;
    let isAditivo = text.toUpperCase().includes('ADITIVO') || currentFilename.toUpperCase().includes('ADITIVO');

    if (textMatch) {
        numeroFormatado = textMatch[1].replace('/', '-'); // ex: 001-2023
        const parts = textMatch[1].split(/[-\/]/);
        if (parts.length === 2 && parts[1].length === 4) {
             year = parseInt(parts[1], 10);
        }
    } else {
        // Fallback: tentar pegar só o número no nome do arquivo (ex: "001.pdf")
        const fallbackMatch = currentFilename.match(/^([0-9]{1,4})(?:[^0-9]|$)/);
        if (fallbackMatch) {
            numeroFormatado = fallbackMatch[1];
        }
    }

    if (!numeroFormatado || !year) {
        console.log(`⚠️ Não foi possível extrair número/ano de ${currentFilename}. Deixando na pasta.`);
        unreadableCount++;
        continue;
    }

    const cleanNum = numeroFormatado.replace(/[-\/]\d{4}$/, ''); // remove o ano do numero se tiver

    // Buscar correspondência no BD
    let match = allContratos.find(c => c.ano === year && (
        (c.numero && extractBaseNumber(c.numero) === extractBaseNumber(cleanNum)) || 
        (c.processo && extractBaseNumber(c.processo) === extractBaseNumber(cleanNum))
    ));

    if (!match) {
        // Criar novo contrato
        console.log(`Criando NOVO contrato para ${cleanNum}/${year} no BD...`);
        const novoNumero = isAditivo ? `Termo Aditivo ${cleanNum}/${year}` : `Termo de contrato ${cleanNum}/${year}`;
        const record = {
            ano: year,
            numero: novoNumero,
            origem: 'LEITURA_PDF_AUTO'
        };
        const { data: inserted, error } = await supabase.schema('transparencia').from('contratos_v2').insert([record]).select('id, numero, ano, processo').single();
        if (error) {
            console.error(`Erro ao criar contrato:`, error.message);
            continue;
        }
        match = inserted;
        allContratos.push(inserted); // adicionar no cache local
        newContractsCount++;
    }

    if (existingDocs.has(currentFilename.toUpperCase())) {
        console.log(`Já existe documento com nome ${currentFilename}, pulando upload e removendo local...`);
        try { fs.unlinkSync(filePath); } catch (e) {}
        continue;
    }

    // Upload
    const safeName = currentFilename.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9.\-]/g, '-');
    const r2Key = `portal-transparencia/contratos/${year}/${safeName}`;

    try {
        const fileStream = fs.createReadStream(filePath);
        await s3.send(
            new PutObjectCommand({
                Bucket: BUCKET,
                Key: r2Key,
                Body: fileStream,
                ContentType: "application/pdf",
            })
        );

        const urlArquivo = `${PUBLIC_URL}/${r2Key}`;
        const tipoDoc = isAditivo ? 'Aditivo' : 'Contrato';

        const { error: insErr } = await supabase.schema('transparencia').from('contratos_documentos').insert({
            contrato_id: match.id,
            tipo_documento: tipoDoc,
            nome_arquivo: currentFilename,
            url_arquivo: urlArquivo,
            caminho_r2: r2Key,
            origem: `leitura-pdf-auto`
        });

        if (insErr) {
            console.log(`❌ Erro no BD:`, insErr.message);
        } else {
            console.log(`✅ Upload e link sucesso: ${currentFilename}. Apagando local.`);
            try { fs.unlinkSync(filePath); } catch(e) {}
            existingDocs.add(currentFilename.toUpperCase());
            uploadCount++;
        }
    } catch (err) {
        console.log(`❌ Erro upload: ${err.message}`);
    }
  }

  console.log(`\n=================================`);
  console.log(`RESUMO DA VARREDURA PDF COMPLETA`);
  console.log(`=================================`);
  console.log(`Novos Uploads p/ R2: ${uploadCount}`);
  console.log(`Novos Contratos Criados no BD: ${newContractsCount}`);
  console.log(`Arquivos Ilegíveis (Imagem/Vazios): ${unreadableCount}`);
}

run();
