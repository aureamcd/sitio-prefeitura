import fs from 'fs';
import path from 'path';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { createCanvas } from 'canvas';

class NodeCanvasFactory {
  create(width: number, height: number) {
    const canvas = createCanvas(width, height);
    const context = canvas.getContext('2d');
    (canvas as any).canvas = canvas;
    (canvas as any).context = context;
    return canvas;
  }
  reset(canvasAndContext: any, width: number, height: number) {
    canvasAndContext.width = width;
    canvasAndContext.height = height;
  }
  destroy(canvasAndContext: any) {
    canvasAndContext.width = 0;
    canvasAndContext.height = 0;
  }
}

async function renderAll() {
  const dir = 'C:/Users/Áurea Letícia/Downloads/Emendas_2024_2026_Extracted';
  const outDir = path.join(dir, 'pngs');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const files = fs.readdirSync(dir).filter(f => f.endsWith('.pdf'));
  console.log(`=== RENDERIZANDO ${files.length} ARQUIVOS EM PNG ===`);

  const factory = new NodeCanvasFactory();

  for (const f of files) {
    try {
      const uint8 = new Uint8Array(fs.readFileSync(path.join(dir, f)));
      const doc = await pdfjsLib.getDocument({ data: uint8 }).promise;
      const page = await doc.getPage(1);
      const viewport = page.getViewport({ scale: 2.0 });

      const canvas = factory.create(viewport.width, viewport.height) as any;

      await page.render({
        canvasContext: canvas.context as any,
        viewport: viewport,
        canvasFactory: factory as any
      }).promise;

      const pngPath = path.join(outDir, f.replace('.pdf', '.png'));
      fs.writeFileSync(pngPath, canvas.toBuffer('image/png'));
      console.log(`✅ Gerado: ${pngPath}`);
    } catch (err: any) {
      console.error(`❌ Erro ao renderizar ${f}:`, err.message);
    }
  }
}

renderAll().catch(console.error);
