import fs from "fs";
import path from "path";
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME || "transparencia";
const PUBLIC_URL = process.env.R2_PUBLIC_URL || "https://pub-dc316bdb1d204c4fa9d36b369c385b97.r2.dev";

function normalizarModalidade(texto: string): string {
  if (!texto) return "outros";
  const t = texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (t.includes("concorrencia")) return "concorrencia";
  if (t.includes("chamada")) return "chamada";
  if (t.includes("adesao")) return "adesao";
  return "outros";
}

function ehProcessoCompleto(nomeArq: string, sizeBytes: number): boolean {
  const n = nomeArq.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (n.includes("processo completo") || n.includes("processo_completo") || n.includes("autos") || n.includes("inteiro teor") || n.includes("integra")) {
    return true;
  }
  if (sizeBytes > 35 * 1024 * 1024) {
    return true;
  }
  return false;
}

function classificarTipoDoc(nome: string): string {
  const n = nome.toLowerCase();
  if (n.includes("edital")) return "Edital";
  if (n.includes("aviso")) return "Aviso de Licitação";
  if (n.includes("ata") || n.includes("proposta") || n.includes("sessao")) return "Ata / Propostas";
  if (n.includes("homolog") || n.includes("adjudic")) return "Homologação / Adjudicação";
  if (n.includes("termo") || n.includes("referencia")) return "Termo de Referência";
  return "Anexo Complementar";
}

async function uploadR2(filePath: string, r2Key: string): Promise<string> {
  const fileStream = fs.createReadStream(filePath);
  await s3Client.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: r2Key,
    Body: fileStream,
    ContentType: "application/pdf",
  }));
  return `${PUBLIC_URL}/${r2Key}`;
}

async function fetchAll(client: any, schema: string, table: string) {
  let all: any[] = [];
  let from = 0;
  const step = 1000;
  while (true) {
    const { data, error } = await client.schema(schema).from(table).select("*").range(from, from + step - 1);
    if (error || !data || data.length === 0) break;
    all = all.concat(data);
    if (data.length < step) break;
    from += step;
  }
  return all;
}

async function main() {
  console.log("🚀 INICIANDO IMPORTAÇÃO DAS 3 ÚLTIMAS PASTAS (Concorrência, Chamada Pública e Adesão)...");
  console.log("📋 Regra da Lorena ativa: Ignorando PDFs de 'Processo Completo/Autos'.\n");

  const baseDownloads = "C:\\Users\\Áurea Letícia\\Downloads";
  const pastasAlvo: string[] = [];

  function varrerDiretorios(dir: string, depth: number) {
    if (depth > 3) return;
    try {
      const itens = fs.readdirSync(dir, { withFileTypes: true });
      for (const item of itens) {
        if (item.isDirectory()) {
          const nomeLow = item.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          const fullPath = path.join(dir, item.name);
          if (nomeLow === "concorrencia" || nomeLow === "chamada publica" || nomeLow === "adesao") {
            pastasAlvo.push(fullPath);
          } else {
            varrerDiretorios(fullPath, depth + 1);
          }
        }
      }
    } catch (e) {}
  }

  varrerDiretorios(baseDownloads, 0);
  console.log(`📁 Pastas mapeadas (${pastasAlvo.length}):`);
  pastasAlvo.forEach(p => console.log(`   - ${p}`));

  const destLic = await fetchAll(supabase, "transparencia", "licitacoes_v2");
  const destMap = new Map<string, any>();
  destLic.forEach(l => {
    const n = (l.numero_processo || l.numero_licitacao || "").toString().replace(/^0+/, "").trim();
    const mod = normalizarModalidade(l.modalidade || l.objeto || "");
    const k = `${n}___${l.ano}___${mod}`;
    destMap.set(k, l);
  });

  const destDocs = await fetchAll(supabase, "transparencia", "licitacoes_documentos");
  const docSet = new Set<string>();
  destDocs.forEach(d => {
    docSet.add(`${d.licitacao_id}___nome___${(d.nome_arquivo || "").trim().toLowerCase()}`);
  });

  let arquivosSubidos = 0;
  let ignoradosLorena = 0;
  let processosCriados = 0;

  for (const pasta of pastasAlvo) {
    console.log(`\n📂 Processando pasta: ${pasta}`);
    let modPasta = "Outros";
    const pLow = pasta.toLowerCase();
    if (pLow.includes("concorrencia")) modPasta = "Concorrência";
    if (pLow.includes("chamada")) modPasta = "Chamada Pública";
    if (pLow.includes("adesao")) modPasta = "Adesão";

    const pdfs: string[] = [];
    function coletarPdfs(dir: string) {
      const itens = fs.readdirSync(dir, { withFileTypes: true });
      for (const item of itens) {
        const full = path.join(dir, item.name);
        if (item.isDirectory()) coletarPdfs(full);
        else if (item.isFile() && item.name.toLowerCase().endsWith(".pdf")) pdfs.push(full);
      }
    }
    coletarPdfs(pasta);
    console.log(`   📑 PDFs encontrados em ${modPasta}: ${pdfs.length}`);

    for (const full of pdfs) {
      const nomeArq = path.basename(full);
      const stats = fs.statSync(full);
      if (ehProcessoCompleto(nomeArq, stats.size)) {
        ignoradosLorena++;
        continue;
      }

      let ano = 2024;
      const matchAno = full.match(/(201\d|202\d)/);
      if (matchAno) ano = parseInt(matchAno[1], 10);

      let num = "001";
      const matchNum = nomeArq.match(/(\d{1,3})/);
      if (matchNum) num = matchNum[1].padStart(3, "0");

      const modNorm = normalizarModalidade(modPasta);
      const nClean = num.replace(/^0+/, "");
      const k = `${nClean}___${ano}___${modNorm}`;
      let alvo = destMap.get(k);

      if (!alvo) {
        const novo = {
          numero_processo: `${num}/${ano}`,
          numero_licitacao: `${num}/${ano}`,
          ano: ano,
          modalidade: modPasta,
          objeto: `${modPasta} nº ${num}/${ano}`,
          situacao: "Concluída",
          origem: "IMPORTACAO_DOWNLOADS_MODALIDADES"
        };
        const { data: resIns } = await supabase.schema("transparencia").from("licitacoes_v2").insert(novo).select().single();
        if (resIns) {
          alvo = resIns;
          destMap.set(k, alvo);
          processosCriados++;
        }
      }

      if (!alvo) continue;

      const docKey = `${alvo.id}___nome___${nomeArq.trim().toLowerCase()}`;
      if (!docSet.has(docKey)) {
        const modSafe = modPasta.toLowerCase().replace(/[^\w]/g, "");
        const r2Key = `licitacoes/${ano}/${modSafe}/${nomeArq.replace(/\s+/g, "_")}`;
        const url = await uploadR2(full, r2Key);
        const tipoDoc = classificarTipoDoc(nomeArq);

        const { error: errDoc } = await supabase.schema("transparencia").from("licitacoes_documentos").insert({
          licitacao_id: alvo.id,
          nome_arquivo: nomeArq,
          url_arquivo: url,
          caminho_r2: r2Key,
          tipo_documento: tipoDoc,
          origem: "IMPORTACAO_DOWNLOADS_MODALIDADES"
        });

        if (!errDoc) {
          docSet.add(docKey);
          arquivosSubidos++;
        }
      }
    }
  }

  console.log(`\n✅ RESULTADO FINAL DA IMPORTAÇÃO DAS 3 PASTAS:`);
  console.log(`   ➕ Novos processos criados: ${processosCriados}`);
  console.log(`   📤 Arquivos PDFs enviados ao R2 e vinculados: ${arquivosSubidos}`);
  console.log(`   🛑 Arquivos gigantes/processos completos ignorados (Regra da Lorena): ${ignoradosLorena}`);
}

main().catch(console.error);
