const { PDFExtract } = require('pdf.js-extract');
const pdfExtract = new PDFExtract();
const fs = require('fs');

async function test() {
    try {
        const filePath = "C:\\Users\\Áurea Letícia\\Desktop\\contratos\\108 Widney.pdf";
        if (!fs.existsSync(filePath)) {
            console.log("Arquivo não existe no teste.");
            return;
        }
        const data = await pdfExtract.extract(filePath, {});
        console.log("SUCESSO:", data.pages[0].content.slice(0, 5).map(c => c.str).join(" "));
    } catch (e) {
        console.error("ERRO:", e.message);
    }
}
test();
