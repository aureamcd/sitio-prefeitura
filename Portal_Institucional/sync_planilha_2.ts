import { createClient } from "@supabase/supabase-js";
import * as xlsx from "xlsx";
import * as fs from "fs";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env", override: false });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

function getCleanNumber(raw: string): string | null {
  if (!raw) return null;
  const match = raw.match(/(\d+)[/-](\d{4})/);
  if (match) {
    return `${match[1].padStart(3, '0')}/${match[2]}`;
  }
  return raw.trim();
}

function getYear(raw: string): number | null {
  const match = raw.match(/\/(\d{4})$/);
  if (match) return parseInt(match[1], 10);
  return null;
}

async function run() {
  const filePath = "c:/Users/Áurea Letícia/Downloads/licitações (2).xlsx";
  const buffer = fs.readFileSync(filePath);
  const wb = xlsx.read(buffer, { type: "buffer" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json<any>(ws);

  const { data: dbRecords, error } = await supabase
    .schema("transparencia")
    .from("licitacoes_v2")
    .select("id, proclic, link_tce, numero, processo, ano");

  if (error) {
    console.error("Erro ao ler DB:", error);
    return;
  }

  const mapByProclic = new Map<string, any>();
  const mapByLink = new Map<string, any>();
  for (const r of dbRecords) {
    if (r.proclic) mapByProclic.set(r.proclic.trim(), r);
    if (r.link_tce) mapByLink.set(r.link_tce.trim(), r);
  }

  let updatedCount = 0;
  let notFound = 0;

  for (const row of rows) {
    const proclic = row["N° proc. TCE"]?.toString().trim();
    const linkTce = row["Caminho detalhamento licitação"]?.toString().trim();
    const rawNumero = row["Nº Procedimento"]?.toString().trim();
    
    if (!rawNumero) continue;

    let dbRecord = null;
    if (proclic) dbRecord = mapByProclic.get(proclic);
    if (!dbRecord && linkTce) dbRecord = mapByLink.get(linkTce);

    if (!dbRecord) {
      notFound++;
      continue;
    }

    const cleanNumber = getCleanNumber(rawNumero);
    let correctYear = getYear(cleanNumber || "");
    
    if (!correctYear && row["Dt Abert/Julg"]) {
      const dt = row["Dt Abert/Julg"].toString();
      const matchDt = dt.match(/\d{2}\/\d{2}\/(\d{4})/);
      if (matchDt) correctYear = parseInt(matchDt[1], 10);
    }

    if (!correctYear) correctYear = 2026;

    const updates: any = {};
    if (dbRecord.numero !== cleanNumber) updates.numero = cleanNumber;
    if (dbRecord.processo !== cleanNumber) updates.processo = cleanNumber;
    if (dbRecord.ano !== correctYear) updates.ano = correctYear;

    if (Object.keys(updates).length > 0) {
      await supabase
        .schema("transparencia")
        .from("licitacoes_v2")
        .update(updates)
        .eq("id", dbRecord.id);
      updatedCount++;
    }
  }

  console.log(`Registros atualizados com sucesso (passo 2): ${updatedCount}`);
  console.log(`Não encontrados no banco (passo 2): ${notFound}`);
}

run();
