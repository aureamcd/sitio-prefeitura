import PDFParser from "pdf2json";

async function chk() {
  const res = await fetch("https://pub-dc316bdb1d204c4fa9d36b369c385b97.r2.dev/publicacoes/2025/publicacao-01-2025.pdf");
  const buf = Buffer.from(await res.arrayBuffer());
  const parser = new PDFParser();
  parser.on("pdfParser_dataReady", (pdfData: any) => {
    const texts = pdfData.Pages[0].Texts;
    for (const t of texts) {
      const s = decodeURIComponent(t.R[0].T);
      if (s.includes("Jasmira") || s.includes("527") || s.includes("Membro")) {
        console.log(`x=${t.x} y=${t.y} w=${t.w} text="${s}"`);
      }
    }
  });
  parser.parseBuffer(buf);
}
chk();
