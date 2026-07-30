import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

async function check() {
  const res = await fetch("https://pub-dc316bdb1d204c4fa9d36b369c385b97.r2.dev/publicacoes/2025/processos-seletivos-132-2025.pdf");
  const buffer = new Uint8Array(await res.arrayBuffer());
  const loadingTask = pdfjsLib.getDocument({ data: buffer });
  const pdfDoc = await loadingTask.promise;
  const page = await pdfDoc.getPage(1);
  const textContent = await page.getTextContent();

  for (const item of textContent.items as any[]) {
    const str = item.str;
    if (str.includes("015.087") || str.includes("037.516") || str.includes("352.270") || str.includes("CPF")) {
      console.log(`str: "${str}", transform: [tx=${item.transform[4].toFixed(1)}, ty=${item.transform[5].toFixed(1)}], width=${item.width?.toFixed(1)}`);
    }
  }
}

check().catch(console.error);
