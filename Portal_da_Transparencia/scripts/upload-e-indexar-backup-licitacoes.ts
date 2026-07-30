import "dotenv/config";
import fs from "fs";
import path from "path";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});
const BUCKET = process.env.R2_BUCKET!;
const PUBLIC_URL = process.env.R2_PUBLIC_URL!;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const LOCAL_DIR = "C:\\Users\\Áurea Letícia\\Downloads\\Licitações-20260630T214820Z-3-001";
const R2_PREFIX = "backup licitações";

function detectarTipoDocumento(nome: string): string {
  const n = nome.toUpperCase();
  if (n.includes("EDITAL") || n.includes("TERMO DE REFER")) return "Edital";
  if (n.includes("ATA")) return "Ata de Registro de Preços";
  if (n.includes("HOMOLOGA") || n.includes("ADJUDICA") || n.includes("RESULTADO")) return "Homologação/Adjudicação";
  if (n.includes("CONTRATO") || n.includes("EMPENHO") || n.includes("EXTRATO CONTRATO")) return "Contrato";
  if (n.includes("AVISO") || n.includes("EXTRATO PUBLICA")) return "Aviso";
  if (n.includes("HABILITA") || n.includes("PROPOSTA") || n.includes("CND") || n.includes("CERTID")) return "Proposta/Habilitação";
  return "Outros";
}

function normalizarModalidade(mod: string): string {
  const m = mod.toUpperCase();
  if (m.includes("DISPENSA")) return "Dispensa";
  if (m.includes("PREG")) return "Pregão";
  if (m.includes("CONCORR")) return "Concorrência";
  if (m.includes("INEX")) return "Inexigibilidade";
  if (m.includes("LEIL")) return "Leilão";
  if (m.includes("TOMADA")) return "Tomada de Preços";
  if (m.includes("CONVITE")) return "Convite";
  if (m.includes("CHAMADA")) return "Chamada Pública";
  if (m.includes("CREDENCIAMENTO")) return "Credenciamento";
  return mod;
}

function extrairNumeroAnoModalidade(nomeArquivo: string, caminhoRelativo: string): { numero: string; ano: number; modalidade: string } | null {
  const texto = `${caminhoRelativo} ${nomeArquivo}`.toUpperCase();

  // Tenta detectar modalidade pela pasta ou nome
  let modalidade = "Pregão";
  if (texto.includes("CONCORR")) modalidade = "Concorrência";
  else if (texto.includes("DISPENSA")) modalidade = "Dispensa";
  else if (texto.includes("INEX")) modalidade = "Inexigibilidade";
  else if (texto.includes("LEIL")) modalidade = "Leilão";
  else if (texto.includes("TOMADA") || texto.includes("TP")) modalidade = "Tomada de Preços";
  else if (texto.includes("CONVITE")) modalidade = "Convite";

  // Busca padrões como Nº XXX/AAAA, XXX-AAAA, XXX-AA
  let m = texto.match(/(?:PE|PREG[ÃA]O|DL|DISPENSA|INEX|INEXIGIBILIDADE|CE|CONCORR[ÊE]NCIA|LEIL[ÃA]O|TP|TOMADA)\s*(?:PRESENCIAL|ELETR[ÔO]NICO)?\s*(?:[Nn][º°.]?\s*)?(\d{1,4})\s*[\-\/\_]\s*(201\d|202\d|\d{2})/);
  if (!m) {
    // Procura qualquer número XXX-20XX
    m = texto.match(/(?:N[º°.]?\s*)?(\d{1,4})\s*[\-\/\_]\s*(201\d|202\d)/);
  }
  if (!m) {
    // Procura XXX-18, XXX-19, XXX-20
    m = texto.match(/(?:N[º°.]?\s*)?(\d{1,4})\s*[\-\/\_]\s*(1[789]|2[0123456])/);
  }

  if (m) {
    const numRaw = parseInt(m[1], 10);
    let anoRaw = parseInt(m[2], 10);
    if (anoRaw < 100) anoRaw += 2000;
    return {
      numero: `${numRaw.toString().padStart(3, "0")}/${anoRaw}`,
      ano: anoRaw,
      modalidade: normalizarModalidade(modalidade),
    };
  }

  return null;
}

async function varrerArquivos(dir: string, baseDir: string): Promise<string[]> {
  const lista: string[] = [];
  const itens = fs.readdirSync(dir);
  for (const item of itens) {
    const full = path.join(dir, item);
    if (fs.statSync(full).isDirectory()) {
      const subs = await varrerArquivos(full, baseDir);
      lista.push(...subs);
    } else {
      // Ignora lixos de sistema
      const low = item.toLowerCase();
      if (low !== "desktop.ini" && low !== ".ds_store") {
        lista.push(full);
      }
    }
  }
  return lista;
}

async function main() {
  console.log(`🚀 Iniciando processamento da pasta: ${LOCAL_DIR}`);
  if (!fs.existsSync(LOCAL_DIR)) {
    console.error("❌ Pasta não encontrada!");
    return;
  }

  const arquivos = await varrerArquivos(LOCAL_DIR, LOCAL_DIR);
  console.log(`📂 Encontrados ${arquivos.length} arquivos válidos para upload e indexação.`);

  // Carrega todas as licitações existentes no portal
  const { data: todasLics } = await supabase.schema("transparencia").from("licitacoes_v2").select("*");
  const licsMap = new Map<string, any>();
  (todasLics || []).forEach(l => {
    const k = `${l.numero}___${l.ano}___${normalizarModalidade(l.modalidade || "")}`.toUpperCase();
    if (!licsMap.has(k) || l.origem === "TCE-PI") {
      licsMap.set(k, l);
    }
  });

  // Carrega documentos já cadastrados
  const { data: todosDocs } = await supabase.schema("transparencia").from("licitacoes_documentos").select("caminho_r2");
  const docsR2Set = new Set((todosDocs || []).map(d => d.caminho_r2));

  let cadastrados = 0;
  let uploads = 0;

  for (const absPath of arquivos) {
    const relPath = path.relative(LOCAL_DIR, absPath).replace(/\\/g, "/");
    const nomeArquivo = path.basename(absPath);
    const r2Key = `${R2_PREFIX}/${relPath}`;
    const publicUrl = `${PUBLIC_URL}/${r2Key}`;

    // 1. Upload pro R2
    try {
      const fileBuffer = fs.readFileSync(absPath);
      await s3.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: r2Key,
        Body: fileBuffer,
        ContentType: nomeArquivo.endsWith(".pdf") ? "application/pdf" : "application/octet-stream",
      }));
      uploads++;
    } catch (e) {
      console.error(`Erro no upload de ${r2Key}:`, e);
      continue;
    }

    // 2. Indexação
    if (docsR2Set.has(r2Key)) {
      continue; // Já indexado
    }

    const info = extrairNumeroAnoModalidade(nomeArquivo, relPath);
    if (!info) {
      console.warn(`⚠️ Não foi possível identificar Nº/Ano de: ${relPath}`);
      continue;
    }

    const chave = `${info.numero}___${info.ano}___${info.modalidade}`.toUpperCase();
    let licAlvo = licsMap.get(chave);

    // Se não existe, cria 1 única linha histórica legítima
    if (!licAlvo) {
      const novaLic = {
        numero: info.numero,
        ano: info.ano,
        modalidade: info.modalidade,
        origem: "HISTORICO_DRIVE",
        objeto: `Processo Licitatório nº ${info.numero} (${info.modalidade}) - Município de Padre Marcos/PI.`,
        data_abertura: `${info.ano}-01-01`,
        possui_edital: false,
        possui_ata: false,
        possui_homologacao: false,
      };
      const { data: resIns, error: errIns } = await supabase
        .schema("transparencia")
        .from("licitacoes_v2")
        .insert(novaLic)
        .select()
        .single();

      if (errIns || !resIns) {
        console.error(`Erro ao criar licitação histórica ${chave}:`, errIns);
        continue;
      }
      licAlvo = resIns;
      licsMap.set(chave, licAlvo);
      console.log(`✨ Nova licitação histórica cadastrada: ${info.numero} (${info.ano}) [${info.modalidade}]`);
    }

    // Insere o documento
    const tipoDoc = detectarTipoDocumento(nomeArquivo);
    const { error: errDoc } = await supabase.schema("transparencia").from("licitacoes_documentos").insert({
      licitacao_id: licAlvo.id,
      nome_arquivo: nomeArquivo,
      url_arquivo: publicUrl,
      caminho_r2: r2Key,
      tipo_documento: tipoDoc,
      origem: "R2_BACKUP",
    });

    if (!errDoc) {
      cadastrados++;
      docsR2Set.add(r2Key);

      // Atualiza flags booleanas
      const updates: any = {};
      if (tipoDoc === "Edital" && !licAlvo.possui_edital) updates.possui_edital = true;
      if (tipoDoc === "Ata de Registro de Preços" && !licAlvo.possui_ata) updates.possui_ata = true;
      if (tipoDoc === "Homologação/Adjudicação" && !licAlvo.possui_homologacao) updates.possui_homologacao = true;
      if (Object.keys(updates).length > 0) {
        await supabase.schema("transparencia").from("licitacoes_v2").update(updates).eq("id", licAlvo.id);
        Object.assign(licAlvo, updates);
      }
    }
  }

  console.log(`🏆 Processamento finalizado! Uploads no R2: ${uploads} | Novos documentos cadastrados no portal: ${cadastrados}`);
}

main().catch(console.error);
