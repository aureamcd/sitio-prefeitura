const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

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
          filelist.push({ path: filepath, size: stat.size });
        }
      }
    } catch (e) {}
  }
  return filelist;
}

function md5FileSync(filePath) {
    const fileBuffer = fs.readFileSync(filePath);
    const hashSum = crypto.createHash('md5');
    hashSum.update(fileBuffer);
    return hashSum.digest('hex');
}

function run() {
    console.log(`Buscando PDFs na pasta: ${DESKTOP_FOLDER}`);
    const files = walkSync(DESKTOP_FOLDER);
    console.log(`Encontrados ${files.length} arquivos PDF.`);

    // Group by size first
    const sizeGroups = {};
    for (const file of files) {
        if (!sizeGroups[file.size]) sizeGroups[file.size] = [];
        sizeGroups[file.size].push(file.path);
    }

    const potentialDups = Object.values(sizeGroups).filter(group => group.length > 1);
    
    // Group by MD5
    const exactDups = {};
    let totalHashCalculated = 0;
    
    for (const group of potentialDups) {
        for (const filePath of group) {
            try {
                const hash = md5FileSync(filePath);
                totalHashCalculated++;
                if (!exactDups[hash]) exactDups[hash] = [];
                exactDups[hash].push(filePath);
            } catch (e) {
                console.error(`Erro ao ler ${filePath}: ${e.message}`);
            }
        }
    }
    
    const duplicateGroups = Object.values(exactDups).filter(group => group.length > 1);
    
    let totalDuplicatesToDelete = 0;
    console.log(`\n============================`);
    console.log(`RESULTADO: PDFs DUPLICADOS`);
    console.log(`============================`);
    
    for (const group of duplicateGroups) {
        console.log(`\nEncontrado grupo com ${group.length} PDFs IDÊNTICOS (mesmo conteúdo):`);
        for (let i = 0; i < group.length; i++) {
            const mark = i === 0 ? '[MANTER]' : '[APAGAR]';
            console.log(`  ${mark} ${path.basename(group[i])}  (${group[i]})`);
        }
        totalDuplicatesToDelete += (group.length - 1);
        
        // Uncomment to actually delete the duplicates
        // for (let i = 1; i < group.length; i++) {
        //    fs.unlinkSync(group[i]);
        // }
    }
    
    console.log(`\nTotal de PDFs repetidos (cópias que podem ser apagadas): ${totalDuplicatesToDelete}`);
}

run();
