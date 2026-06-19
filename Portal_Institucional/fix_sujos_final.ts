import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env", override: false });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function fix() {
  const { data, error } = await supabase.schema("transparencia").from("licitacoes_v2").select("id, numero, ano");
  if (error) throw error;

  const sujos = data.filter(r => r.numero && !r.numero.match(/^\d{3,}\/\d{4}$/));
  console.log(`Limpando ${sujos.length} registros problemáticos finais...`);

  for (const row of sujos) {
    let limpo = row.numero;

    // Remove espaços vazios estranhos
    limpo = limpo.replace(" /", "/").trim();

    // 023 DE 30 DE SETEMBRO DE 2025 -> 023/2025
    if (limpo === "023 DE 30 DE SETEMBRO DE 2025") limpo = "023/2025";
    
    // Anos com digito faltando (typos na origem)
    if (limpo === "Convite nº 015/200") limpo = "015/2000"; // ou 200X, deixamos 2000
    if (limpo === "Tomada de preço nº 023/208") limpo = "023/2008";

    // Pega o que vier depois do "nº "
    const matchNo = limpo.match(/nº\s*(.+)/i);
    if (matchNo) {
      limpo = matchNo[1].trim();
    }

    // Se tiver formato tipo 002-A/2022
    const parts = limpo.split("/");
    if (parts.length === 2) {
       // Pad 3 zeros na primeira parte apenas se for numero puro (nao -A)
       let first = parts[0];
       if (/^\d+$/.test(first)) {
         first = first.padStart(3, '0');
       } else {
         // se for 001-A, 001-ELE. etc, apenas adiciona 0 se começar com número
         const numPrefix = first.match(/^(\d+)(.*)/);
         if (numPrefix) {
            first = numPrefix[1].padStart(3, '0') + numPrefix[2];
         }
       }
       
       let second = parts[1];
       if (second === "200") second = "2000";
       if (second === "208") second = "2008";
       
       limpo = `${first}/${second}`;
    }

    if (limpo !== row.numero) {
      console.log(`Corrigindo: ${row.numero} -> ${limpo}`);
      await supabase.schema("transparencia").from("licitacoes_v2").update({ numero: limpo, processo: limpo }).eq("id", row.id);
    } else {
      console.log(`Não conseguiu corrigir: ${row.numero}`);
    }
  }

  console.log("Correção finalizada!");
}

fix();
