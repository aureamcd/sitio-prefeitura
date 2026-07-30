import fs from "fs";
import pdfParse from "pdf-parse";

async function test() {
    try {
        const filePath = "C:\\Users\\Áurea Letícia\\Desktop\\contratos\\108 Widney.pdf";
        if (!fs.existsSync(filePath)) {
            console.log("File not found");
            return;
        }
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdfParse(dataBuffer, { max: 1 });
        console.log("Success:", data.text.substring(0, 100));
    } catch (e: any) {
        console.error("Error:", e.message);
    }
}
test();
