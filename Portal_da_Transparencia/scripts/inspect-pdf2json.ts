import PDFParser from "pdf2json";

async function check() {
  const res = await fetch("https://pub-dc316bdb1d204c4fa9d36b369c385b97.r2.dev/publicacoes/2025/processos-seletivos-132-2025.pdf");
  const buffer = Buffer.from(await res.arrayBuffer());
  const parser = new PDFParser();

  parser.on("pdfParser_dataReady", (pdfData: any) => {
    const texts = pdfData.Pages[0].Texts || [];
    for (const t of texts) {
      const str = decodeURIComponent(t.R?.[0]?.T || "");
      if (str.includes("Thuanny") || str.includes("Raimundo") || str.includes("Iraci")) {
        console.log(JSON.stringify(t, null, 2));
      }
    }
  });

  parser.parseBuffer(buffer);
}

check();
