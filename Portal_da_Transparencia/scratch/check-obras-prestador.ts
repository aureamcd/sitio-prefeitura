/**
 * READ-ONLY: busca obras no banco pelo nome do prestador (empresa_responsavel)
 * para as 3 obras da pasta "atualizar obras".
 */
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Prestadores identificados nos PDFs (nome como está no banco)
const PRESTADORES = [
  "BERNARDO GRANJA",
  "S2E",
  "FAG",
];

async function main() {
  for (const p of PRESTADORES) {
    console.log("=".repeat(90));
    console.log(`🔎 Prestador: "${p}"`);
    console.log("=".repeat(90));
    const { data, error } = await supabase
      .schema("transparencia")
      .from("obras")
      .select("*")
      .ilike("empresa_responsavel", `%${p}%`);
    if (error) {
      console.log("Erro:", error.message);
      continue;
    }
    if (!data || data.length === 0) {
      console.log("  Nenhuma obra encontrada.\n");
      continue;
    }
    for (const o of data) {
      console.log(`  ┌ id: ${o.id}`);
      console.log(`  │ objeto: ${String(o.objeto || "").substring(0, 110)}`);
      console.log(`  │ situacao: ${o.situacao} | ano: ${o.ano}`);
      console.log(`  │ contrato: ${o.contrato_numero || "-"} | licitacao: ${o.licitacao || "-"}`);
      console.log(`  │ valor_total: ${o.valor_total ?? "-"} | valor_executado: ${o.valor_executado ?? "-"} | %: ${o.percentual_executado ?? "-"}`);
      console.log(`  │ empresa: ${o.empresa_responsavel}`);
      console.log(`  │ data_inicio: ${o.data_inicio} | fim: ${o.data_previsao_fim || "-"}`);
      console.log(`  │ arquivo_nome: ${o.arquivo_nome || "-"}`);
      console.log(`  │ arquivo_r2_url: ${o.arquivo_r2_url || "-"}`);
      console.log(`  │ link_tce: ${o.link_tce || "-"}`);
      console.log(`  └ updated_at: ${o.updated_at}\n`);
    }
  }
}

main().catch(console.error);
