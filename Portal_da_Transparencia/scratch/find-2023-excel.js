const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

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
        if (file.toLowerCase().endsWith('.xlsx') || file.toLowerCase().endsWith('.csv')) {
          filelist.push(filepath);
        }
      }
    } catch (e) {}
  }
  return filelist;
}

const allFiles = walkSync('C:\\Users\\Áurea Letícia\\Documents\\sitio-prefeitura\\Portal_da_Transparencia\\scripts\\sync-api\\csv');

for (const file of allFiles) {
  try {
    const workbook = xlsx.readFile(file);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet, { defval: '' });

    const count2023 = data.filter(d => {
        const ano = d['Ano'] || (d['dt assinatura'] && d['dt assinatura'].includes('2023')) || (d['dt cadastro'] && d['dt cadastro'].includes('2023'));
        return ano && ano.toString().includes('2023');
    }).length;
    
    if (count2023 > 0) {
      console.log(`${file}: ${count2023} rows for 2023.`);
    }
  } catch (err) {
  }
}
