import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import * as path from "path";
import * as dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
async function checar(urls: string[], rotulo: string, max = 40) {
  const unicas = [...new Set(urls.filter(Boolean))].slice(0, max);
  let ok = 0, falha = 0, vazio = 0;
  const falhas: string[] = [];
  for (const u of unicas) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 8000);
      const res = await fetch(u, { method: "HEAD", signal: ctrl.signal, redirect: "follow" });
      clearTimeout(t);
      const cl = res.headers.get("content-length");
      const bytes = cl ? parseInt(cl) : -1;
      if (res.status >= 400) { falha++; falhas.push(`${res.status} ${u.slice(0, 100)}`); }
      else if (bytes === 0) { vazio++; falhas.push(`0bytes ${u.slice(0, 100)}`); }
      else ok++;
    } catch (e: any) {
      falha++; falhas.push(`ERR ${String(e.message).slice(0, 30)} ${u.slice(0, 100)}`);
    }
  }
  console.log(`[${rotulo}] amostra=${unicas.length} ok=${ok} falha=${falha} vazio0=${vazio}`);
  if (falhas.length > 0) { console.log("  ex falhas:"); falhas.slice(0, 10).forEach((f) => console.log("   - " + f)); }
}
async function main() {
  // planejamento
  const { data: docs } = await supabase.schema("transparencia").from("planejamento_documentos").select("arquivo_url");
  await checar((docs || []).map((d: any) => d.arquivo_url), "planejamento_documentos");
  // licitacoes_documentos
  const { data: licDocs } = await supabase.schema("transparencia").from("licitacoes_documentos").select("url_arquivo, caminho_r2");
  await checar((licDocs || []).map((d: any) => d.url_arquivo || d.caminho_r2), "licitacoes_documentos");
  // contratos_documentos
  const { data: contDocs } = await supabase.schema("transparencia").from("contratos_documentos").select("url_arquivo, caminho_r2");
  await checar((contDocs || []).map((d: any) => d.url_arquivo || d.caminho_r2), "contratos_documentos");
  // obras
  const { data: obras } = await supabase.schema("transparencia").from("obras").select("arquivo_r2_url");
  await checar((obras || []).map((d: any) => d.arquivo_r2_url), "obras", 20);
  // emendas
  const { data: emd } = await supabase.schema("transparencia").from("cadastro_emendas").select("pdf_url");
  await checar((emd || []).map((d: any) => d.pdf_url), "cadastro_emendas", 20);
}
main();
