import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  { db: { schema: "transparencia" } }
);

async function check() {
  const { data } = await supabase.from("despesas").select("*").eq("ano", 2026);
  console.log(`Verificando ${data?.length || 0} empenhos do banco...`);
  const licitsDB = (data || []).filter(d => 
    (d.licitacao_numero && d.licitacao_numero !== "") ||
    (d.licitacao_modalidade && d.licitacao_modalidade !== "") ||
    (d.licitacao_descricao && d.licitacao_descricao !== "OUTRO NÃO APLICÁVEL" && d.licitacao_descricao !== "Não se Aplica") ||
    (d.processo && d.processo !== "")
  );
  console.log(`No banco agora com algum campo de licitação/processo preenchido: ${licitsDB.length}`);
  console.log("Amostra do banco:", JSON.stringify(licitsDB.slice(0, 5), null, 2));

  // Vamos testar 30 empenhos na API Contreina para ver se a API retorna NUMLIC / PROCLIC / etc
  console.log("\nTestando amostra na API Contreina para ver campos brutos de licitação...");
  let count = 0;
  for (const item of (data || []).slice(0, 60)) {
    try {
      const url = `https://contreina.padremarcos.pi.gov.br/transparencia/VersaoJson/Despesas/?ConectarExercicio=2026&Listagem=DetalhesEmpenhoPorNumeroEmpenho&intNumeroEmpenho=${item.numero_empenho}&strTipoEmpenho=${item.tipo_empenho}&Empresa=${item.empresa}&bolMostrarFornecedor=False`;
      const r = await fetch(url);
      const j = await r.json();
      if (Array.isArray(j) && j.length > 0) {
        const d = j[0];
        // Imprimir todos os campos que tenham 'licit', 'proc', 'num' no nome ou valor
        const keysOfInterest = Object.keys(d).filter(k => 
          k.includes("LIC") || k.includes("PROC") || k.includes("CONTR") || k.includes("MOD")
        );
        const objOfInterest: any = { EMP: item.numero_empenho };
        for (const k of keysOfInterest) {
          if (d[k] && d[k] !== "" && d[k] !== "OUTRO NÃO APLICÁVEL" && d[k] !== "Não se Aplica") {
            objOfInterest[k] = d[k];
          }
        }
        if (Object.keys(objOfInterest).length > 1) {
          console.log("API retornou:", JSON.stringify(objOfInterest, null, 2));
          count++;
          if (count >= 10) break;
        }
      }
    } catch (e) {}
  }
}
check();
