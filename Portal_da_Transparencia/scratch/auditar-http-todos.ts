import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import * as path from "path";
import * as dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
async function main() {
  const { data: docs } = await supabase.schema("transparencia").from("planejamento_documentos").select("titulo, tipo, exercicio, arquivo_url, ativo");
  const ativos = (docs || []).filter((d: any) => d.ativo !== false);
  let ok = 0, falha = 0, vazio = 0;
  const problemas: any[] = [];
  for (const d of ativos) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 7000);
      const res = await fetch(d.arquivo_url, { method: "HEAD", signal: ctrl.signal, redirect: "follow" });
      clearTimeout(t);
      const cl = res.headers.get("content-length");
      const bytes = cl ? parseInt(cl) : -1;
      if (res.status >= 400 || bytes === 0) {
        if (res.status >= 400) falha++; else vazio++;
        problemas.push({ status: res.status, bytes, tipo: d.tipo, exercicio: d.exercicio, titulo: String(d.titulo).slice(0, 60) });
      } else ok++;
    } catch (e: any) {
      falha++;
      problemas.push({ status: "ERR", bytes: -1, tipo: d.tipo, exercicio: d.exercicio, titulo: String(d.titulo).slice(0, 60) });
    }
  }
  console.log(`TOTAL ATIVOS=${ativos.length} ok=${ok} falha404=${falha} vazio0=${vazio}`);
  console.log("\n=== PROBLEMAS ===");
  problemas.forEach((p) => console.log(`${p.status} | ${p.bytes} | ${p.tipo} ${p.exercicio} | ${p.titulo}`));
  // tambem verificar inativos
  const inativos = (docs || []).filter((d: any) => d.ativo === false);
  console.log(`\nInativos no banco: ${inativos.length}`);
}
main();
