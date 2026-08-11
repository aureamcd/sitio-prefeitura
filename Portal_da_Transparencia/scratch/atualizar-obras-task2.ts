/**
 * TASK 2 - Atualizar Obras (349659, 360977, 360981)
 *
 * Atualiza as 3 obras existentes (localizadas por id) com:
 * - valor_total, valor_executado, percentual_executado (das medições)
 * - situacao (Escola Canto Alegre -> Concluída)
 * - arquivo_nome + arquivo_r2_url (link do Google Drive das medições)
 *
 * O usuário autorizou executar os UPDATEs ("Eu executo agora").
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

interface UpdateObra {
  id: string;
  objeto: string;
  patch: Record<string, unknown>;
}

const UPDATES: UpdateObra[] = [
  {
    id: "8f37c305-3baa-444a-ad6d-a033b2e8b959",
    objeto: "CRECHE TIPO 1 (349659)",
    patch: {
      valor_total: 5542800.0,
      valor_executado: 462133.73,
      percentual_executado: 8.3,
      situacao: "Em andamento",
      arquivo_nome: "Boletim 1ª Medição (contrato 098/2025).pdf",
      arquivo_r2_url: "https://drive.google.com/drive/folders/1Y3Qzf6xBkh7PhRS5bBP8JBQN2btoqMwI?usp=sharing",
    },
  },
  {
    id: "82a770b9-3b29-464b-98fc-0ed0173ab556",
    objeto: "ESCOLA CANTO ALEGRE (360977)",
    patch: {
      valor_total: 631044.53,
      valor_executado: 631044.53,
      percentual_executado: 100,
      situacao: "Concluída",
      arquivo_nome: "Medição Final (contrato 008/2026).pdf",
      arquivo_r2_url: "https://drive.google.com/drive/folders/12H_Wi3R24Zkes4D9Gnf4NrfoY-JPHHC5?usp=sharing",
    },
  },
  {
    id: "79e19784-f9a9-442e-8ef0-73e00e613fcf",
    objeto: "U.E. CÂNDIDA MACÊDO (360981)",
    patch: {
      valor_total: 1091077.19,
      valor_executado: 305550.6,
      percentual_executado: 28,
      situacao: "Em andamento",
      arquivo_nome: "BMS 1ª Medição (contrato 029/2026).pdf",
      arquivo_r2_url: "https://drive.google.com/drive/folders/14c2FnNeFlh7uHndnxLKA8TP85t9VnSTA?usp=sharing",
    },
  },
];

async function main() {
  console.log("🚀 Atualizando 3 obras...\n");
  for (const u of UPDATES) {
    const { data, error } = await supabase
      .schema("transparencia")
      .from("obras")
      .update({ ...u.patch, updated_at: new Date().toISOString() })
      .eq("id", u.id)
      .select();

    if (error) {
      console.log(`❌ ${u.objeto}: ERRO → ${error.message}`);
    } else {
      const row = data?.[0];
      console.log(`✅ ${u.objeto}`);
      console.log(`   valor_total: ${row?.valor_total}`);
      console.log(`   valor_executado: ${row?.valor_executado}`);
      console.log(`   %: ${row?.percentual_executado} | situacao: ${row?.situacao}`);
      console.log(`   arquivo: ${row?.arquivo_r2_url}\n`);
    }
  }

  // Confirmação
  const { data: confirm } = await supabase
    .schema("transparencia")
    .from("obras")
    .select("objeto, valor_total, valor_executado, percentual_executado, situacao, arquivo_nome, arquivo_r2_url")
    .in("id", UPDATES.map((u) => u.id));
  console.log("═══════════════════════════════════");
  console.log("📊 ESTADO FINAL NO BANCO:");
  (confirm || []).forEach((o: any) => {
    console.log(`  • ${String(o.objeto).substring(0, 60)}`);
    console.log(`    valor: ${o.valor_total} | exec: ${o.valor_executado} | %: ${o.percentual_executado} | ${o.situacao}`);
    console.log(`    doc: ${o.arquivo_nome}`);
  });
}

main().catch(console.error);
