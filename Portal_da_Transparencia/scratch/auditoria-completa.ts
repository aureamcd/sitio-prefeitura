import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import * as path from "path";
import * as dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
async function main() {
  console.log("=== 1. PLANEJAMENTO_DOCUMENTOS: distribuicao por categoria/tipo ===");
  const { data: docs } = await supabase.schema("transparencia").from("planejamento_documentos").select("categoria, tipo, exercicio, ativo, arquivo_url");
  if (docs) {
    const porCat: Record<string, number> = {};
    const semUrl: any[] = [];
    docs.forEach((d: any) => {
      const k = `${d.categoria || "SEM_CAT"}/${d.tipo || "SEM_TIPO"}`;
      porCat[k] = (porCat[k] || 0) + 1;
      if (!d.arquivo_url) semUrl.push(d);
    });
    Object.entries(porCat).sort().forEach(([k, v]) => console.log(`  ${v.toString().padStart(4)} | ${k}`));
    console.log(`\n  TOTAL: ${docs.length} | sem arquivo_url: ${semUrl.length}`);
    if (semUrl.length > 0) console.log("  Exemplos sem URL:", semUrl.slice(0, 8).map((d: any) => `${d.categoria}/${d.tipo}/${d.exercicio}`).join(" | "));
  }

  console.log("\n=== 2. PLANEJAMENTO: tipos por exercicio ===");
  const tipos = ["PPA", "LDO", "LOA", "RGF", "RREO", "BALAN", "PARECER", "PRESTAC", "DEMONSTRA", "RELAT"];
  for (const t of tipos) {
    const { data, count } = await supabase.schema("transparencia").from("planejamento_documentos").select("exercicio", { count: "exact" }).ilike("tipo", `%${t}%`);
    if (count && count > 0) {
      const anos: Record<number, number> = {};
      (data || []).forEach((d: any) => { anos[d.exercicio] = (anos[d.exercicio] || 0) + 1; });
      console.log(`  ${t}: total=${count} | anos: ` + Object.entries(anos).sort().map(([a, c]) => `${a}(${c})`).join(" "));
    }
  }

  console.log("\n=== 3. LICITACOES_DOCUMENTOS: total e sem URL ===");
  const { data: licDocs, count: licDocsCount } = await supabase.schema("transparencia").from("licitacoes_documentos").select("url_arquivo, caminho_r2", { count: "exact" });
  const semLic = (licDocs || []).filter((d: any) => !d.url_arquivo && !d.caminho_r2);
  console.log(`  total=${licDocsCount}, sem url/caminho: ${semLic.length}`);

  console.log("\n=== 4. CONTRATOS_DOCUMENTOS: total e sem URL ===");
  const { data: contDocs, count: contDocsCount } = await supabase.schema("transparencia").from("contratos_documentos").select("url_arquivo, caminho_r2", { count: "exact" });
  const semCont = (contDocs || []).filter((d: any) => !d.url_arquivo && !d.caminho_r2);
  console.log(`  total=${contDocsCount}, sem url/caminho: ${semCont.length}`);

  console.log("\n=== 5. OBRAS ===");
  const { data: obras } = await supabase.schema("transparencia").from("obras").select("objeto, situacao, ano, valor_total, percentual_executado, arquivo_r2_url, link_tce, motivo_paralisacao");
  (obras || []).forEach((o: any) => console.log(`  ${o.ano} | ${String(o.situacao).slice(0, 25).padEnd(25)} | R$ ${o.valor_total} | ${o.percentual_executado}% | ${String(o.objeto).slice(0, 50)} | doc:${o.arquivo_r2_url ? "sim" : "NAO"} | tce:${o.link_tce ? "sim" : "NAO"} | paralisada:${o.motivo_paralisacao ? "sim" : "nao"}`));

  console.log("\n=== 6. EMENDAS ===");
  const { data: emd, count: emdCount } = await supabase.schema("transparencia").from("cadastro_emendas").select("ano, valor_previsto, pdf_url", { count: "exact" });
  const semPdf = (emd || []).filter((e: any) => !e.pdf_url);
  console.log(`  cadastro_emendas: ${emdCount} | sem pdf: ${semPdf.length} | anos: ` + (emd ? [...new Set(emd.map((e: any) => e.ano))].join(", ") : ""));
  const { data: emd2, count: emd2Count } = await supabase.schema("transparencia").from("emendas_impositivas").select("ano", { count: "exact" });
  console.log(`  emendas_impositivas: ${emd2Count} | anos: ` + (emd2 ? [...new Set(emd2.map((e: any) => e.ano))].join(", ") : ""));

  console.log("\n=== 7. DIARIAS por ano ===");
  const { data: diarias } = await supabase.schema("transparencia").from("diarias").select("ano");
  const porAno: Record<number, number> = {};
  (diarias || []).forEach((d: any) => { porAno[d.ano] = (porAno[d.ano] || 0) + 1; });
  console.log("  " + Object.entries(porAno).sort().map(([a, c]) => `${a}:${c}`).join(" | "));

  console.log("\n=== 8. SERVIDORES / REMUNERACOES / ESTAGIARIOS / TERCEIRIZADOS ===");
  const { count: servCount } = await supabase.schema("transparencia").from("servidores").select("id", { count: "exact", head: true });
  const { count: remCount } = await supabase.schema("transparencia").from("remuneracoes").select("id", { count: "exact", head: true });
  const { count: estCount } = await supabase.schema("transparencia").from("estagiarios").select("id", { count: "exact", head: true });
  const { count: tercCount } = await supabase.schema("transparencia").from("terceirizados").select("id", { count: "exact", head: true });
  console.log(`  servidores=${servCount} | remuneracoes=${remCount} | estagiarios=${estCount} | terceirizados=${tercCount}`);
  const { data: remMes } = await supabase.schema("transparencia").from("remuneracoes").select("ano, mes").limit(2000);
  if (remMes) {
    const combos = new Set((remMes as any[]).map((r: any) => `${r.ano}-${String(r.mes).padStart(2, "0")}`));
    console.log("  remuneracoes meses disponiveis:", [...combos].sort().slice(0, 40).join(" "));
  }

  console.log("\n=== 9. RECEITAS / DESPESAS por ano ===");
  const { data: rec } = await supabase.schema("transparencia").from("receitas").select("ano");
  const porAnoR: Record<number, number> = {};
  (rec || []).forEach((d: any) => { porAnoR[d.ano] = (porAnoR[d.ano] || 0) + 1; });
  console.log("  receitas: " + Object.entries(porAnoR).sort().map(([a, c]) => `${a}:${c}`).join(" | "));
  const { data: desp } = await supabase.schema("transparencia").from("despesas").select("ano");
  const porAnoD: Record<number, number> = {};
  (desp || []).forEach((d: any) => { porAnoD[d.ano] = (porAnoD[d.ano] || 0) + 1; });
  console.log("  despesas: " + Object.entries(porAnoD).sort().map(([a, c]) => `${a}:${c}`).join(" | "));

  console.log("\n=== 10. LICITACOES_V2 e CONTRATOS_V2 por ano ===");
  const { data: lics } = await supabase.schema("transparencia").from("licitacoes_v2").select("ano, origem");
  const porAnoL: Record<number, number> = {};
  (lics || []).forEach((d: any) => { porAnoL[d.ano] = (porAnoL[d.ano] || 0) + 1; });
  console.log("  licitacoes_v2: " + Object.entries(porAnoL).sort().map(([a, c]) => `${a}:${c}`).join(" | "));
  const { data: conts } = await supabase.schema("transparencia").from("contratos_v2").select("ano");
  const porAnoC: Record<number, number> = {};
  (conts || []).forEach((d: any) => { porAnoC[d.ano] = (porAnoC[d.ano] || 0) + 1; });
  console.log("  contratos_v2: " + Object.entries(porAnoC).sort().map(([a, c]) => `${a}:${c}`).join(" | "));

  console.log("\n=== 11. TRANSFERENCIAS ===");
  const { count: t1 } = await supabase.schema("transparencia").from("receitas_transferencias").select("id", { count: "exact", head: true });
  const { count: t2 } = await supabase.schema("transparencia").from("transferencias_entre_entidades").select("id", { count: "exact", head: true });
  console.log(`  receitas_transferencias=${t1} | transferencias_entre_entidades=${t2}`);

  console.log("\n=== 12. EXTRA ORCAMENTARIAS / RESTOS A PAGAR ===");
  const { count: e1 } = await supabase.schema("transparencia").from("receitas_extra_orcamentarias").select("id", { count: "exact", head: true });
  const { count: e2 } = await supabase.schema("transparencia").from("despesas_extra_orcamentarias").select("id", { count: "exact", head: true });
  const { count: e3 } = await supabase.schema("transparencia").from("restos_pagar").select("id", { count: "exact", head: true });
  console.log(`  receitas_extra=${e1} | despesas_extra=${e2} | restos_pagar=${e3}`);
}
main();
