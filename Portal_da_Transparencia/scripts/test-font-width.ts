import PDFParser from "pdf2json";
import { PDFDocument, StandardFonts } from "pdf-lib";

async function check() {
  const res = await fetch("https://pub-dc316bdb1d204c4fa9d36b369c385b97.r2.dev/publicacoes/2025/processos-seletivos-132-2025.pdf");
  const buffer = Buffer.from(await res.arrayBuffer());
  const parser = new PDFParser();

  const pdfDoc = await PDFDocument.load(buffer);
  const timesFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const helvFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  parser.on("pdfParser_dataReady", (pdfData: any) => {
    const texts = pdfData.Pages[0].Texts || [];
    for (const t of texts) {
      const str = decodeURIComponent(t.R?.[0]?.T || "");
      if (str.includes("037.516") || str.includes("015.087") || str.includes("352.270")) {
        console.log(`--- Item str: "${str}" ---`);
        console.log(`x: ${t.x} (${t.x * 16} pt), w: ${t.w}`);
        
        // Se tem CPF dentro
        const match = /\d{3}[.\s-]*\d{3}/.exec(str);
        if (match) {
          const prefix = str.substring(0, match.index);
          const wTimes = timesFont.widthOfTextAtSize(prefix, 11);
          const wHelv = helvFont.widthOfTextAtSize(prefix, 11);
          console.log(`Prefix: "${prefix}" (len=${prefix.length})`);
          console.log(`Times prefix width @11pt: ${wTimes.toFixed(1)} pt`);
          console.log(`Helv prefix width @11pt: ${wHelv.toFixed(1)} pt`);
          console.log(`Avg calculation prefix width: ${(match.index * (t.w / str.length)).toFixed(1)} pt`);
        }
      }
    }
  });

  parser.parseBuffer(buffer);
}

check();
