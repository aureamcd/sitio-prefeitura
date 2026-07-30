import fs from "fs";
import path from "path";
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
const { PDFParse } = require("pdf-parse");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function extrairTudo() {
  const folder = "C:\\Users\\Áurea Letícia\\Downloads\\WhatsApp_Emendas_Extracted";
  const files = fs.readdirSync(folder).filter(f => f.endsWith(".pdf"));

  console.log("=== EXTRAINDO TODAS AS LINHAS E PROPOSTAS ===");
  for (const f of files) {
    const fullPath = path.join(folder, f);
    const parser = new PDFParse({ data: fs.readFileSync(fullPath) });
    const text = await parser.getText();
    const str = typeof text === "string" ? text : (text.text || "");
    console.log(`\n==================================================`);
    console.log(`ARQUIVO: ${f}`);
    console.log(`==================================================`);
    console.log(str.trim());
  }
}

extrairTudo();
