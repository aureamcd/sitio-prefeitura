import fs from "fs";
import path from "path";
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function processarPdf(buffer: Buffer, outPath: string) {
  const uint8 = new Uint8Array(buffer);
  const loadingTask = pdfjsLib.getDocument({ data: uint8 });
  const pdfjsDoc = await loadingTask.promise;

  const pdfDoc = await PDFDocument.load(buffer);
  const fontTimes = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const pages = pdfDoc.getPages();

  for (let pIdx = 0; pIdx < pdfjsDoc.numPages; pIdx++) {
    if (pIdx >= pages.length) continue;
    const page = pages[pIdx];
    const pdfjsPage = await pdfjsDoc.getPage(pIdx + 1);
    const textContent = await pdfjsPage.getTextContent();

    for (const item of textContent.items as any[]) {
      const str = item.str || "";
      const regexCpf = /\d{3}[.\s-]*\d{3}[.\s-]*\d{3}(?:[.\s-]*\d{2})?/g;
      let match;
      while ((match = regexCpf.exec(str)) !== null) {
        const matchStr = match[0];
        const prefix = str.substring(0, match.index);

        // tx e ty são coordenadas exatas no canto inferior esquerdo do item
        const tx = item.transform[4];
        const ty = item.transform[5];

        // A escala de altura da fonte está no elemento transform[0] ou transform[3]
        const fontSize = Math.abs(item.transform[0]) || 11;

        // Largura exata do prefixo em pontos usando métricas da fonte PDF
        const prefixWidth = fontTimes.widthOfTextAtSize(prefix, fontSize);
        const matchWidth = fontTimes.widthOfTextAtSize(matchStr, fontSize);

        const tarjaX = tx + prefixWidth - 1;
        const tarjaY = ty - 2; // ty é a linha de base (baseline), descendo 2 pontos cobre perfeitamente a descrita dos números
        const tarjaW = matchWidth + 2;
        const tarjaH = fontSize + 3;

        page.drawRectangle({
          x: tarjaX,
          y: tarjaY,
          width: tarjaW,
          height: tarjaH,
          color: rgb(0, 0, 0),
        });

        console.log(`[Pág ${pIdx + 1}] Tarjado "${matchStr}" em x=${tarjaX.toFixed(1)}, y=${tarjaY.toFixed(1)}, w=${tarjaW.toFixed(1)}, h=${tarjaH.toFixed(1)}`);
      }
    }
  }

  fs.writeFileSync(outPath, await pdfDoc.save());
}

async function main() {
  console.log("🛡️ INICIANDO MOTOR MILIMÉTRICO (pdfjs-dist + métricas de fonte nativas)...\n");

  const ids = [548, 559];
  const outDir = path.join(process.cwd(), "scratch_tarjados_pdfjs");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  for (const id of ids) {
    const { data: p } = await supabase.from("legislacoes").select("*").eq("id", id).single();
    if (!p) continue;

    console.log(`📥 Processando Portaria ID ${p.id}: ${p.titulo}...`);
    const res = await fetch(p.arquivo_r2_url);
    const buffer = Buffer.from(await res.arrayBuffer());

    const outPath = path.join(outDir, `Portaria_${p.id}_PERFEITO.pdf`);
    await processarPdf(buffer, outPath);
    console.log(`✅ Arquivo salvo: ${outPath}\n`);
  }
}

main().catch(console.error);
