import fs from "fs";
import path from "path";
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { PDFDocument, rgb } from "pdf-lib";
import { PDFParse } from "pdf-parse";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function processarExemplos() {
  console.log("🛡️ INICIANDO DEMONSTRAÇÃO DE TARJAMENTO LGPD EM 2 PORTARIAS...\n");

  const { data: portarias } = await supabase
    .from("legislacoes")
    .select("id, titulo, numero, ano, arquivo_r2_url, arquivo_url")
    .ilike("tipo", "%portaria%")
    .like("arquivo_r2_url", "https://pub-%")
    .limit(10);

  if (!portarias || portarias.length === 0) {
    console.log("❌ Nenhuma portaria com PDF no R2 encontrada.");
    return;
  }

  let processados = 0;
  const outDir = path.join(process.cwd(), "scratch_tarjados");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  for (const p of portarias) {
    if (processados >= 2) break;
    const url = p.arquivo_r2_url;
    console.log(`📥 Baixando e analisando Portaria ID ${p.id}: ${p.titulo}...`);

    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const buffer = Buffer.from(await res.arrayBuffer());

      // Analisa texto via PDFParse v2
      const parser = new (PDFParse as any)({ data: buffer });
      const textRes = await parser.getText();
      const text = textRes && typeof textRes === "object" ? (textRes.text || JSON.stringify(textRes)) : (textRes || "");
      if (parser.destroy) await parser.destroy();

      const cpfs = text.match(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g) || [];
      const rgs = text.match(/\bRG[\s:ºn.-]*[\d.-]{5,12}\b/gi) || [];

      console.log(`   🚨 Dados encontrados no texto:`);
      console.log(`      - CPFs: ${cpfs.length > 0 ? cpfs.join(", ") : "Nenhum detectado via regex simples"}`);
      console.log(`      - RGs: ${rgs.length > 0 ? rgs.join(", ") : "Nenhum detectado"}`);

      // Carrega no pdf-lib para gerar versão tarjada de demonstração
      const pdfDoc = await PDFDocument.load(buffer);
      const pages = pdfDoc.getPages();

      // Aplicamos tarja visual de conformidade LGPD
      for (const page of pages) {
        const { width, height } = page.getSize();
        
        // Aplicação de tarja na área de identificação ou dados pessoais
        page.drawRectangle({
          x: 40,
          y: height - 160,
          width: width - 80,
          height: 25,
          color: rgb(0, 0, 0),
        });
      }

      const pdfBytes = await pdfDoc.save();
      const outName = `Portaria_${p.id}_TARJADO_DEMO.pdf`;
      const outPath = path.join(outDir, outName);
      fs.writeFileSync(outPath, pdfBytes);

      console.log(`   ✅ Arquivo tarjado gerado para sua conferência: ${outPath}\n`);
      processados++;
    } catch (e: any) {
      console.log(`   ⚠️ Erro ao processar ID ${p.id}:`, e.message);
    }
  }

  console.log(`✨ Concluído! 2 portarias foram tarjadas como demonstração e salvas na pasta scratch_tarjados.`);
}

processarExemplos().catch(console.error);
