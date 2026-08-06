import fs from "fs";
import path from "path";
import { PDFDocument, rgb } from "pdf-lib";
import PDFParser from "pdf2json";

interface AlvoTarja {
  pageIdx: number;
  x: number;
  y: number;
  w: number;
  text: string;
}

function extrairPosicoesSensiveis(buffer: Buffer): Promise<AlvoTarja[]> {
  return new Promise((resolve, reject) => {
    const parser = new PDFParser();
    const list: AlvoTarja[] = [];

    parser.on("pdfParser_dataError", (errData: any) => reject(errData.parserError));
    parser.on("pdfParser_dataReady", (pdfData: any) => {
      const pages = pdfData.Pages || [];
      for (let pIdx = 0; pIdx < pages.length; pIdx++) {
        const texts = pages[pIdx].Texts || [];
        for (const item of texts) {
          const str = decodeURIComponent(item.R?.[0]?.T || "").trim();
          if (!str) continue;

          // Regex to catch CPFs, RGs (approximate), and some address keywords
          // This is a basic demonstration of automatic detection as per the plan
          const hasCpf = /\d{3}[.\s-]*\d{3}[.\s-]*\d{3}/.test(str);
          // Simplified RG regex (very hard to get perfectly right without context)
          const hasRg = /\b(?:RG|R\.G\.)\s*[A-Z0-9-]+\b/i.test(str) || /(?<!\d)\d{1,2}[.\s-]?\d{3}[.\s-]?\d{3}[.\s-]?(?:\d|X|x)(?!\d)/.test(str);
          
          if (hasCpf || hasRg) {
            list.push({
              pageIdx: pIdx,
              x: item.x,
              y: item.y,
              w: item.w,
              text: str
            });
          }
        }
      }
      resolve(list);
    });

    parser.parseBuffer(buffer);
  });
}

async function main() {
  console.log("🛡️ INICIANDO TESTE LOCAL DE TARJAMENTO...\n");

  const desktopDir = "C:\\Users\\Áurea Letícia\\Desktop\\contratos";
  const filesToTest = ["Contrato 004-2018.pdf", "Contrato 010-2018.pdf"];
  
  const outDir = path.join(process.cwd(), "scratch_tarjados_local");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  for (const filename of filesToTest) {
    const filePath = path.join(desktopDir, filename);
    if (!fs.existsSync(filePath)) {
      console.log(`❌ Arquivo não encontrado: ${filePath}`);
      continue;
    }

    console.log(`📥 Processando Arquivo: ${filename}...`);
    const buffer = fs.readFileSync(filePath);

    const sensiveis = await extrairPosicoesSensiveis(buffer);
    const pdfDoc = await PDFDocument.load(buffer);
    const pages = pdfDoc.getPages();

    for (const item of sensiveis) {
      if (item.pageIdx >= pages.length) continue;
      const page = pages[item.pageIdx];
      const { height } = page.getSize();

      const SCALE = 16; // pdf2json scale
      const startX = item.x * SCALE;
      // Largura cobrindo o texto + margem de proteção
      const tarjaW = (item.w * SCALE) + 4;
      const boxY = height - (item.y * SCALE) - 9.5;

      page.drawRectangle({
        x: startX - 2,
        y: boxY,
        width: tarjaW,
        height: 12,
        color: rgb(0, 0, 0), // PRETO
      });
      
      console.log(`   [Pág ${item.pageIdx + 1}] Tarjado: "${item.text}"`);
    }

    const pdfBytes = await pdfDoc.save();
    const outPath = path.join(outDir, `${filename.replace('.pdf', '_TARJADO.pdf')}`);
    fs.writeFileSync(outPath, pdfBytes);
    console.log(`   ✅ Arquivo tarjado salvo em: ${outPath}\n`);
  }

  console.log(`✨ Concluído! Vá verificar os arquivos na pasta 'scratch_tarjados_local'.`);
}

main().catch(console.error);
