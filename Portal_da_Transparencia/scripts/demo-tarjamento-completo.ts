import fs from "fs";
import path from "path";
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { PDFDocument, rgb } from "pdf-lib";
import PDFParser from "pdf2json";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

          if (/\d{3}[.\s-]*\d{3}/.test(str)) {
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
  console.log("🛡️ INICIANDO TARJAMENTO COMPLETO DE CPFs (100% Gratuito e Preciso)...\n");

  const ids = [548, 559];
  const outDir = path.join(process.cwd(), "scratch_tarjados_completo");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  for (const id of ids) {
    const { data: p } = await supabase.from("legislacoes").select("*").eq("id", id).single();
    if (!p) continue;

    console.log(`📥 Processando Portaria ID ${p.id}: ${p.titulo}...`);
    const res = await fetch(p.arquivo_r2_url);
    const buffer = Buffer.from(await res.arrayBuffer());

    const sensiveis = await extrairPosicoesSensiveis(buffer);
    const pdfDoc = await PDFDocument.load(buffer);
    const pages = pdfDoc.getPages();

    for (const item of sensiveis) {
      if (item.pageIdx >= pages.length) continue;
      const page = pages[item.pageIdx];
      const { height } = page.getSize();

      const SCALE = 16;
      const startX = item.x * SCALE;
      const avgCharW = item.w / Math.max(item.text.length, 1);

      // Regex para encontrar o bloco do CPF (com 9 ou 11 dígitos no trecho)
      const regexCpf = /\d{3}[.\s-]*\d{3}[.\s-]*\d{3}(?:[.\s-]*\d{2})?/g;
      let match;
      while ((match = regexCpf.exec(item.text)) !== null) {
        const charIndex = match.index;
        const matchLen = match[0].length;
        
        // Posição X exata de onde o CPF completo começa
        const tarjaX = startX + (charIndex * avgCharW) - 1;
        // Largura cobrindo o CPF completo + margem de proteção
        const tarjaW = (matchLen * avgCharW) + 6;

        const boxY = height - (item.y * SCALE) - 9.5;

        page.drawRectangle({
          x: tarjaX,
          y: boxY,
          width: tarjaW,
          height: 11,
          color: rgb(0, 0, 0),
        });
        
        console.log(`   [Pág ${item.pageIdx + 1}] Tarjado COMPLETO "${match[0]}" em x=${tarjaX.toFixed(1)}, w=${tarjaW.toFixed(1)}`);
      }
    }

    const pdfBytes = await pdfDoc.save();
    const outPath = path.join(outDir, `Portaria_${p.id}_TARJA_COMPLETA.pdf`);
    fs.writeFileSync(outPath, pdfBytes);
    console.log(`   ✅ Arquivo completo salvo em: ${outPath}\n`);
  }

  console.log(`✨ Concluído!`);
}

main().catch(console.error);
