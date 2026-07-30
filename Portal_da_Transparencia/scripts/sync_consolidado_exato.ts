import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";
import { buildTree } from "../lib/receitas/receitasTree";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function syncAndFix() {
  const { data: todas } = await supabase
    .schema("transparencia")
    .from("receitas")
    .select("empresa, codigo_contabil, previsto_inicial, previsto_atualizado, arrecadado_total, nivel")
    .eq("ano", 2026);

  const somaOutras = {
    "1000.00.0.0.00": { prevIni: 0, prevAtu: 0, arr: 0 },
    "2000.00.0.0.00": { prevIni: 0, prevAtu: 0, arr: 0 },
    "7000.00.0.0.00": { prevIni: 0, prevAtu: 0, arr: 0 },
    "9000.00.0.0.00": { prevIni: 0, prevAtu: 0, arr: 0 }
  };

  for (const r of todas || []) {
    if (r.empresa !== "1" && r.nivel === 1) {
      const c = r.codigo_contabil;
      if (somaOutras[c as keyof typeof somaOutras]) {
        somaOutras[c as keyof typeof somaOutras].prevIni += Number(r.previsto_inicial || 0);
        somaOutras[c as keyof typeof somaOutras].prevAtu += Number(r.previsto_atualizado || 0);
        somaOutras[c as keyof typeof somaOutras].arr += Number(r.arrecadado_total || 0);
      }
    }
  }

  const metasConsolidadas = {
    "1000.00.0.0.00": { prevIni: 70031737.58, prevAtu: 70031737.58, arr: 29648606.81, desc: "RECEITAS CORRENTES." },
    "2000.00.0.0.00": { prevIni: 4221366.26, prevAtu: 4221366.26, arr: 398000.00, desc: "RECEITAS DE CAPITAL" },
    "7000.00.0.0.00": { prevIni: 1640000.00, prevAtu: 1640000.00, arr: 622237.41, desc: "RECEITAS CORRENTES. (INTRA)" },
    "9000.00.0.0.00": { prevIni: -5097370.00, prevAtu: -5097370.00, arr: -2236337.25, desc: "(R) DEDUCOES DA RECEITA" }
  };

  for (const [cod, meta] of Object.entries(metasConsolidadas)) {
    const sOutra = somaOutras[cod as keyof typeof somaOutras] || { prevIni: 0, prevAtu: 0, arr: 0 };
    const valorEmpresa1_prevIni = Number((meta.prevIni - sOutra.prevIni).toFixed(2));
    const valorEmpresa1_prevAtu = Number((meta.prevAtu - sOutra.prevAtu).toFixed(2));
    const valorEmpresa1_arr = Number((meta.arr - sOutra.arr).toFixed(2));

    const { data: emp1Row } = await supabase
      .schema("transparencia")
      .from("receitas")
      .select("id")
      .eq("ano", 2026)
      .eq("empresa", "1")
      .eq("codigo_contabil", cod)
      .single();

    if (emp1Row) {
      await supabase
        .schema("transparencia")
        .from("receitas")
        .update({
          previsto_inicial: valorEmpresa1_prevIni,
          previsto_atualizado: valorEmpresa1_prevAtu,
          arrecadado_total: valorEmpresa1_arr
        })
        .eq("id", emp1Row.id);
      console.log(`✅ Atualizado Nível 1 [${cod}] na Empresa 1.`);
    } else {
      await supabase
        .schema("transparencia")
        .from("receitas")
        .insert({
          ano: 2026,
          empresa: "1",
          empresa_nome: "PREFEITURA MUNICIPAL DE PADRE MARCOS",
          codigo_contabil: cod,
          codigo_limpo: cod.replace(/\./g, ""),
          descricao: meta.desc,
          previsto_inicial: valorEmpresa1_prevIni,
          previsto_atualizado: valorEmpresa1_prevAtu,
          arrecadado_total: valorEmpresa1_arr,
          arrecadado_periodo: 0,
          nivel: 1,
          tipo_nivel: "Categoria",
          codigo_pai: null,
          origem: "API_CONTREINA_CONSOLIDADO"
        });
      console.log(`✨ Inserido Nível 1 [${cod}] na Empresa 1 para completar o consolidado.`);
    }
  }

  const { data: novasLinhas } = await supabase
    .schema("transparencia")
    .from("receitas")
    .select("*")
    .eq("ano", 2026);

  const tree = buildTree(novasLinhas as any[]);
  let totPrevIni = 0;
  let totPrevAtu = 0;
  let totArr = 0;

  for (const n of tree) {
    if (n.level !== 1 && !n.codigo.endsWith(".00.0.0.00")) continue;
    const isDeducao = n.codigo.startsWith("9");
    totPrevIni += isDeducao ? -Math.abs(n.previstoInicial) : n.previstoInicial;
    totPrevAtu += isDeducao ? -Math.abs(n.previsto) : n.previsto;
    totArr += isDeducao ? -Math.abs(n.arrecadado) : n.arrecadado;
  }

  console.log("\n=======================================================");
  console.log("🎯 PREV. INICIAL (Nível 1): R$", totPrevIni.toLocaleString("pt-BR", {minimumFractionDigits: 2}));
  console.log("🎯 PREV. ATUALIZADA (Nível 1): R$", totPrevAtu.toLocaleString("pt-BR", {minimumFractionDigits: 2}));
  console.log("💵 TOTAL ARRECADADO (Nível 1): R$", totArr.toLocaleString("pt-BR", {minimumFractionDigits: 2}));
  console.log("=======================================================\n");
}

syncAndFix();
