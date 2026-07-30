import fs from 'fs';
import pdfParse from 'pdf-parse';

async function run() {
    try {
        const filePath = "C:\\Users\\Áurea Letícia\\Desktop\\contratos\\108 Widney.pdf";
        if (!fs.existsSync(filePath)) {
            console.log("Arquivo não existe no teste.");
            return;
        }
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdfParse(dataBuffer, { max: 1 });
        console.log("SUCESSO MJS:", data.text.substring(0, 50));
    } catch (e) {
        console.error("ERRO MJS:", e.message);
    }
}
run();
