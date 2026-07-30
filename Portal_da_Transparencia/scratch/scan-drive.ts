import fs from 'fs';
import path from 'path';

const TARGET_DIR = "G:\\.shortcut-targets-by-id\\0B9YMQ8K2UJUKd28ybG9UOW9WODg\\padremarcos.pi.gov.br";

function scanDirectory(dir: string, results: { [key: string]: number } = {}, totalFiles: { count: number } = { count: 0 }) {
    if (!fs.existsSync(dir)) {
        console.error("Directory does not exist:", dir);
        return results;
    }

    try {
        const items = fs.readdirSync(dir);
        
        for (const item of items) {
            const fullPath = path.join(dir, item);
            try {
                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory()) {
                    // Just count the top level directories for our summary
                    if (dir === TARGET_DIR) {
                        results[`FOLDER: ${item}`] = 0;
                    }
                    scanDirectory(fullPath, results, totalFiles);
                } else {
                    totalFiles.count++;
                    const ext = path.extname(item).toLowerCase();
                    results[ext] = (results[ext] || 0) + 1;
                    
                    // Increment the counter for the top level folder if applicable
                    const relPath = path.relative(TARGET_DIR, fullPath);
                    const topFolder = relPath.split(path.sep)[0];
                    if (topFolder && topFolder !== item) {
                        results[`FOLDER: ${topFolder}`] = (results[`FOLDER: ${topFolder}`] || 0) + 1;
                    }
                }
            } catch (err) {
                // Ignore stat errors (permissions, etc)
            }
        }
    } catch (err) {
        console.error("Error reading dir:", dir, err);
    }
    
    return { results, totalFiles };
}

console.log(`Scanning Google Drive folder: ${TARGET_DIR}`);
console.log("This might take a minute if there are thousands of files on the cloud...\n");

const { results, totalFiles } = scanDirectory(TARGET_DIR);

console.log(`\nScan Complete! Found ${totalFiles.count} total files.`);
console.log("\nBreakdown by Extension:");
for (const [key, value] of Object.entries(results)) {
    if (key.startsWith('.')) {
        console.log(`  ${key || '(No extension)'}: ${value} files`);
    }
}

console.log("\nBreakdown by Top-Level Folder:");
for (const [key, value] of Object.entries(results)) {
    if (key.startsWith('FOLDER: ')) {
        console.log(`  ${key.replace('FOLDER: ', '')}: ${value} files`);
    }
}
