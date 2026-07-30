import fs from 'fs';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

async function debug() {
  const uint8 = new Uint8Array(fs.readFileSync('C:/Users/Áurea Letícia/Downloads/Emendas_2024_2026_Extracted/EMENDA 2024 PADRE MARCOS.pdf'));
  const doc = await pdfjsLib.getDocument({ data: uint8 }).promise;
  const page = await doc.getPage(1);
  const c = await page.getTextContent();
  
  console.log('--- ITEMS ---');
  for (const item of (c.items as any[]).slice(0, 15)) {
    console.log(`str: "${item.str}" | fontName: ${item.fontName} | transform: [${item.transform.slice(4,6).join(', ')}]`);
  }

  console.log('\n--- COMMON OBJS FONTS ---');
  const fontObj = page.commonObjs.get((c.items[0] as any).fontName);
  console.log('Font name:', fontObj?.name, 'type:', fontObj?.type, 'toUnicode:', !!fontObj?.toUnicode);
}

debug().catch(console.error);
