const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

const dirPath = 'C:\\Users\\Áurea Letícia\\Documents\\sitio-prefeitura\\Portal_da_Transparencia\\scripts\\sync-api\\csv\\contratos';
const files = fs.readdirSync(dirPath);

for (const file of files) {
  if (!file.endsWith('.xlsx')) continue;
  try {
    const workbook = xlsx.readFile(path.join(dirPath, file));
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet, { defval: '' });

    const count2023 = data.filter(d => {
        const ano = d['Ano'] || (d['dt assinatura'] && d['dt assinatura'].includes('2023')) || (d['dt cadastro'] && d['dt cadastro'].includes('2023'));
        return ano && ano.toString().includes('2023');
    }).length;
    
    console.log(`${file}: ${count2023} rows for 2023.`);
  } catch (err) {
    console.error(`Error reading ${file}`);
  }
}
