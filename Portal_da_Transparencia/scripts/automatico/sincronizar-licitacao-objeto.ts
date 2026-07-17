import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  { db: { schema: "transparencia" } }
);

async function sincronizarLicitacoesObjeto() {
  console.log("🔍 Buscando despesas de 2026 para extração de licitação/contrato do objeto...");
  const { data } = await supabase.from("despesas").select("id, numero_empenho, objeto, licitacao_numero, licitacao_modalidade").eq("ano", 2026);
  
  let atualizados = 0;
  const regexLic = /(?:(preg[ãa]o\s*elet[rôo]nico|preg[ãa]o|dispensa|inexigibilidade|concorr[êe]ncia|tomada\s*de\s*pre[çc]os|edital))[^\d]*(\d{1,4}[\/\.\-_]\d{4}|\d{1,4}\/\d{2})/i;

  for (const item of data || []) {
    if (!item.objeto) continue;
    
    // Se o licitacao_numero já está preenchido e não é vazio, não mexer
    if (item.licitacao_numero && item.licitacao_numero.trim() !== "") continue;

    const m = item.objeto.match(regexLic);
    if (m) {
      const modBruta = m[1].toUpperCase().replace("PREGAO", "PREGÃO").replace("ELETRONICO", "ELETRÔNICO").replace("CONCORRENCIA", "CONCORRÊNCIA").replace("PRECOS", "PREÇOS");
      const numBruto = m[2];

      await supabase.from("despesas").update({
        licitacao_numero: numBruto,
        licitacao_modalidade: modBruta
      }).eq("id", item.id);
      
      atualizados++;
    }
  }

  console.log(`✅ Concluído! Extraídas e vinculadas licitações em ${atualizados} empenhos do banco.`);
}

sincronizarLicitacoesObjeto();
