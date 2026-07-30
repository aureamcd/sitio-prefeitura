import fs from 'fs';
import path from 'path';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

async function testarCids() {
  const dir = 'C:/Users/Áurea Letícia/Downloads/Emendas_2024_2026_Extracted';
  const f = 'EXTRATO 2026.pdf';
  const uint8 = new Uint8Array(fs.readFileSync(path.join(dir, f)));
  const doc = await pdfjsLib.getDocument({ data: uint8 }).promise;
  const page = await doc.getPage(1);
  const content = await page.getTextContent();
  
  // Pegar os primeiros 50 itens
  for (const item of (content.items as any[]).slice(0, 50)) {
    if (!item.str.trim()) continue;
    const codes = item.str.split('').map((c: string) => c.charCodeAt(0));
    console.log(`str: "${item.str}" -> codes: [${codes.join(', ')}] (font: ${item.fontName})`);
  }
}

testarCids().catch(console.error);
