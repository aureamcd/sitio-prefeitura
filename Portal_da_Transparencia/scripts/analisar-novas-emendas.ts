import fs from 'fs';
import path from 'path';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

async function analisar() {
  const dir = 'C:/Users/Áurea Letícia/Downloads/Emendas_2024_2026_Extracted';
  const files = fs.readdirSync(dir);

  console.log(`=== ANALISANDO ${files.length} ARQUIVOS NO DIRETÓRIO ===`);

  for (const f of files) {
    console.log(`\n========================================`);
    console.log(`ARQUIVO: ${f}`);
    console.log(`========================================`);

    const uint8 = new Uint8Array(fs.readFileSync(path.join(dir, f)));
    const doc = await pdfjsLib.getDocument({ data: uint8 }).promise;
    
    let rawText = '';
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      rawText += content.items.map((it: any) => it.str).join(' ') + '\n';
    }

    console.log('--- Texto original (primeiros 400 caracteres) ---');
    console.log(rawText.replace(/\s+/g, ' ').slice(0, 400));

    // Testar se os caracteres originais já têm números/palavras legíveis
    const regexNumeros = /\b\d{4,}\b/g;
    const numeros = rawText.match(regexNumeros) || [];
    console.log('Números grandes encontrados no texto original:', Array.from(new Set(numeros)).slice(0, 10));

    // Tentar shifts de 1 a 93 para ver se destrava fontes com ToUnicode ausente ou deslocado
    for (let shift = 1; shift < 94; shift++) {
      const decoded = rawText.split('').map(c => {
        const code = c.charCodeAt(0);
        if (code >= 33 && code <= 126) return String.fromCharCode((code - 33 + shift) % 94 + 33);
        return c;
      }).join('');

      if (/PROPOSTA|EMENDA|SAUDE|MINISTERIO|FUNDO|VALOR|PADRE MARCOS|CUSTEIO|BANCADA|PARLAMENTAR|PLANO DE TRABALHO/i.test(decoded)) {
        console.log(`\n---> SHIFT ENCONTRADO (+${shift})! ---`);
        console.log(decoded.replace(/\s+/g, ' ').slice(0, 500));
        break;
      }
    }
  }
}

analisar().catch(console.error);
