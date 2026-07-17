import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  { db: { schema: "transparencia" } }
);

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

function split(str?: string): [string | null, string | null] {
  if (!str) return [null, null];
  const p = str.indexOf(" - ");
  if (p !== -1) return [str.substring(0, p).trim(), str.substring(p + 3).trim()];
  return [null, str.trim()];
}

async function run() {
  const { data } = await supabase
    .from("despesas")
    .select("*")
    .eq("ano", 2026)
    .or("orgao_codigo.is.null,natureza_codigo.is.null");

  console.log(`🔍 Encontrados ${data?.length || 0} empenhos faltando classificação em 2026...`);

  for (const item of data || []) {
    try {
      const url = `https://contreina.padremarcos.pi.gov.br/transparencia/VersaoJson/Despesas/?ConectarExercicio=2026&Listagem=DetalhesEmpenhoPorNumeroEmpenho&intNumeroEmpenho=${item.numero_empenho}&strTipoEmpenho=${item.tipo_empenho}&Empresa=${item.empresa}&bolMostrarFornecedor=False`;
      const r = await fetch(url);
      if (!r.ok) {
        if (r.status === 429) await sleep(2000);
        continue;
      }
      const j = await r.json();
      if (Array.isArray(j) && j.length > 0) {
        const det = j[0];
        const [oCod, oNom] = split(det.ORGAO);
        const [uCod, uNom] = split(det.UNIDADE);
        const [fCod, fNom] = split(det.FUNCAO);
        const [sfCod, sfNom] = split(det.SUBFUNCAO);
        const [nCod, nNom] = split(det.NATUREZA);
        const [fnCod, fnNom] = split(det.FONTE_STN || det.FONCODIGO);

        await supabase.from("despesas").update({
          orgao_codigo: oCod || null,
          orgao_nome: oNom || det.ORGAO || null,
          unidade_codigo: uCod || null,
          unidade_nome: uNom || det.UNIDADE || null,
          funcao_codigo: fCod || null,
          funcao_nome: fNom || det.FUNCAO || null,
          subfuncao_codigo: sfCod || null,
          subfuncao_nome: sfNom || det.SUBFUNCAO || null,
          natureza_codigo: nCod || null,
          natureza_nome: nNom || det.NATUREZA || null,
          fonte_stn_codigo: fnCod || null,
          fonte_stn_nome: fnNom || det.FONTE_STN || null,
          ficha: det.FICHA || item.ficha
        }).eq("id", item.id);
      }
      await sleep(50);
    } catch (e: any) {
      console.error(`Erro em ${item.numero_empenho}:`, e.message);
    }
  }
  console.log("✅ Varredura e preenchimento concluídos!");
}

run();
