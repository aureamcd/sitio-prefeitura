import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  { db: { schema: "transparencia" } }
);

async function check() {
  const { data } = await supabase.from("despesas").select("numero_empenho, tipo_empenho, empresa").eq("ano", 2026).limit(150);
  let count = 0;
  for (const item of data || []) {
    try {
      const url = `https://contreina.padremarcos.pi.gov.br/transparencia/VersaoJson/Despesas/?ConectarExercicio=2026&Listagem=DetalhesEmpenhoPorNumeroEmpenho&intNumeroEmpenho=${item.numero_empenho}&strTipoEmpenho=${item.tipo_empenho}&Empresa=${item.empresa}&bolMostrarFornecedor=False`;
      const r = await fetch(url);
      const j = await r.json();
      if (Array.isArray(j) && j.length > 0) {
        const d = j[0];
        if (d.LICIT && d.LICIT !== "OUTRO NÃO APLICÁVEL" && d.LICIT !== "Não se Aplica") {
          console.log("Encontrado na API:", JSON.stringify({
            EMP: item.numero_empenho,
            LICIT: d.LICIT,
            NUMLIC: d.NUMLIC,
            PROCLIC: d.PROCLIC,
            PROC: d.PROC,
            NUMCONTRATO: d.NUMCONTRATO
          }, null, 2));
          count++;
          if (count >= 5) break;
        }
      }
    } catch (e) {}
  }
}
check();
