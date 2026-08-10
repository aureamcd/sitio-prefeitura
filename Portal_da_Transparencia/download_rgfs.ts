import xlsx from 'xlsx';
import fs from 'fs';
import path from 'path';
import https from 'https';

const downloadFile = (url: string, dest: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        fs.unlink(dest, () => reject(new Error(`Failed to get '${url}' (${response.statusCode})`)));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => reject(err));
    });
  });
};

async function main() {
  const excelPath = 'C:/Users/Áurea Letícia/Downloads/ConPublicacaoGeral (3).xls';
  const outDir = 'C:/Users/Áurea Letícia/Downloads/rgf';
  
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  console.log('Lendo planilha:', excelPath);
  const wb = xlsx.readFile(excelPath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json<any>(ws);
  
  console.log(`Encontrados ${data.length} registros. Iniciando download...`);
  
  let success = 0;
  let failed = 0;

  for (const row of data) {
    let edicao = row['N° Edição'];
    let arquivo = row['Arquivo'];
    
    // Tratamento basico para evitar quebras
    if (!edicao || !arquivo) continue;
    edicao = String(edicao).trim();
    arquivo = String(arquivo).trim();
    
    // As pastas do diario costumam manter o _B se a edicao tiver
    const url = `https://www.diarioficialdosmunicipios.org/intranet/_lib/file/doc/pdfs/novo/${edicao}/${arquivo}`;
    const dest = path.join(outDir, arquivo);
    
    try {
      await downloadFile(url, dest);
      console.log(`Baixado: ${arquivo}`);
      success++;
    } catch (e) {
      console.error(`Erro ao baixar ${arquivo} de ${url}:`, (e as Error).message);
      
      // Tentativa de fallback sem o _B na pasta, as vezes a pasta e so o numero
      if (edicao.includes('_')) {
        const edicaoBase = edicao.split('_')[0];
        const fallbackUrl = `https://www.diarioficialdosmunicipios.org/intranet/_lib/file/doc/pdfs/novo/${edicaoBase}/${arquivo}`;
        try {
          await downloadFile(fallbackUrl, dest);
          console.log(`Baixado (fallback): ${arquivo}`);
          success++;
        } catch (e2) {
          failed++;
        }
      } else {
        failed++;
      }
    }
  }

  console.log(`\nConcluído! Sucesso: ${success}, Falhas: ${failed}`);
}

main().catch(console.error);
