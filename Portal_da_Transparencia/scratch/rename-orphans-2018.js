const fs = require('fs');
const path = require('path');

const dir = "C:\\Users\\Áurea Letícia\\Desktop\\contratos\\Contratos\\2018";

const actions = [
    // 1. GILMAR VICENTE29062018.pdf is CONTRATO 056-2018, which was ALREADY uploaded (we saw it in the script logs). 
    // So this is a duplicate on disk. Delete it.
    { file: "GILMAR VICENTE29062018.pdf", action: "delete" },
    
    // 2. DEUSMAR FRIOS04072018.pdf is CONTRATO 022/2018.
    // Let's rename it to CONTRATO Nº 022-2018.pdf so the script picks it up if it's missing, or deletes it if it's already there.
    { file: "DEUSMAR FRIOS04072018.pdf", action: "rename", newName: "CONTRATO Nº 022-2018.pdf" },
    
    // 3. Contrato Prestacao Servico S_N 2018.pdf and its copies
    // This has no number (Ana Kele). We'll rename one and delete the copies.
    { file: "Contrato Prestacao Servico S_N 2018.pdf", action: "rename", newName: "CONTRATO S_N Ana Kele 2018.pdf" },
    { file: "Contrato Prestacao Servico S_N 2018 (1).pdf", action: "delete" },
    { file: "Contrato Prestacao Servico S_N 2018(1).pdf", action: "delete" },
    { file: "Contrato Prestacao Servico S_N 2018(1) (1).pdf", action: "delete" },
    
    // 4. Distrato Contrato 2018.08.31.pdf and its copy (Elisangela Francisca)
    { file: "Distrato Contrato 2018.08.31.pdf", action: "rename", newName: "DISTRATO S_N Elisangela Francisca 2018.pdf" },
    { file: "Distrato Contrato 2018.08.31 (1).pdf", action: "delete" },
    
    // 5. Extrato Contrato Dispensa Nº 01-2018.pdf
    { file: "Extrato Contrato Dispensa Nº 01-2018.pdf", action: "rename", newName: "CONTRATO Nº 001-2018 Dispensa.pdf" },
    { file: "Extrato Contrato Dispensa Nº 01-2018 (1).pdf", action: "delete" }
];

for (const a of actions) {
    const filePath = path.join(dir, a.file);
    if (fs.existsSync(filePath)) {
        if (a.action === "delete") {
            fs.unlinkSync(filePath);
            console.log(`Deletado: ${a.file}`);
        } else if (a.action === "rename") {
            const newPath = path.join(dir, a.newName);
            fs.renameSync(filePath, newPath);
            console.log(`Renomeado: ${a.file} -> ${a.newName}`);
        }
    }
}
