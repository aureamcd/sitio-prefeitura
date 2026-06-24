import { createClient } from "@supabase/supabase-js";
import * as xlsx from "xlsx";
import * as fs from "fs";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env", override: false });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

function parseDate(raw: string): string | null {
  if (!raw) return null;
  const parts = raw.trim().split(" ");
  const datePart = parts[0];
  const timePart = parts[1] || "00:00";
  
  const dateParts = datePart.split("/");
  if (dateParts.length === 3) {
    const day = dateParts[0].padStart(2, '0');
    const month = dateParts[1].padStart(2, '0');
    const year = dateParts[2];
    
    const timeParts = timePart.split(":");
    const hour = (timeParts[0] || "00").padStart(2, '0');
    const minute = (timeParts[1] || "00").padStart(2, '0');
    
    return `${year}-${month}-${day}T${hour}:${minute}:00.000Z`;
  }
  return null;
}

async function run() {
  console.log("Iniciando parse da planilha...");
  const filePath = "c:/Users/Áurea Letícia/Downloads/licitações (2).xlsx";
  const buffer = fs.readFileSync(filePath);
  const wb = xlsx.read(buffer, { type: "buffer" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json<any>(ws);
  console.log(`Lidas ${rows.length} linhas.`);

  const { data: dbRecords, error } = await supabase
    .schema("transparencia")
    .from("licitacoes_v2")
    .select("id, proclic, link_tce, objeto, data_abertura");

  if (error) {
    console.error("Erro ao ler DB:", error);
    return;
  }
  console.log(`Lidos ${dbRecords.length} registros do BD.`);

  const mapByProclic = new Map<string, any>();
  const mapByLink = new Map<string, any>();
  const mapByObjeto = new Map<string, any>();
  for (const r of dbRecords) {
    if (r.proclic) mapByProclic.set(r.proclic.trim(), r);
    if (r.link_tce) mapByLink.set(r.link_tce.trim(), r);
    if (r.objeto) mapByObjeto.set(r.objeto.trim().substring(0, 100).toLowerCase(), r);
  }

  let updatedCount = 0;
  let notFound = 0;

  for (const row of rows) {
    const proclic = row["N° proc. TCE"]?.toString().trim();
    const linkTce = row["Caminho detalhamento licitação"]?.toString().trim();
    const rawDate = row["Dt Abert/Julg"]?.toString().trim();
    const objeto = row["Objeto"]?.toString().trim().substring(0, 100).toLowerCase();
    
    if (!rawDate) continue;

    let dbRecord = null;
    if (proclic) dbRecord = mapByProclic.get(proclic);
    if (!dbRecord && linkTce) dbRecord = mapByLink.get(linkTce);
    if (!dbRecord && objeto) dbRecord = mapByObjeto.get(objeto);

    if (!dbRecord) {
      notFound++;
      continue;
    }

    const correctDate = parseDate(rawDate);
    if (correctDate) {
      console.log(`Atualizando ${dbRecord.id} para ${correctDate}`);
      await supabase
        .schema("transparencia")
        .from("licitacoes_v2")
        .update({ data_abertura: correctDate })
        .eq("id", dbRecord.id);
      updatedCount++;
    }
  }

  console.log(`Registros de data_abertura atualizados: ${updatedCount}`);
  console.log(`Não encontrados no banco para atualização de data: ${notFound}`);
}

run();
