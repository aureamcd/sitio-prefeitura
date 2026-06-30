import "dotenv/config";
import fs from "fs";
import path from "path";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";

// ─── Config ─────────────────────────────────────────────────────────────────
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
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── Caminho base dos downloads ─────────────────────────────────────────────
const DOWNLOADS = "C:\\Users\\Áurea Letícia\\Downloads";
const CONTREINA = path.join(DOWNLOADS, "Contreina");

// ─── Mapeamento: pasta → categoria + tipo ───────────────────────────────────
interface CategoriaMap {
  categoria: string;
  tipo: string;
  tituloPrefix: string;
}

function getCategoria(subfolder: string): CategoriaMap | null {
  const map: Record<string, CategoriaMap> = {
    "Balanços":  { categoria: "PRESTACAO_CONTAS", tipo: "BALANCO_GERAL", tituloPrefix: "Balanço Geral" },
    "RGF":       { categoria: "PRESTACAO_CONTAS", tipo: "RGF",           tituloPrefix: "RGF" },
    "RREO":      { categoria: "PRESTACAO_CONTAS", tipo: "RREO",          tituloPrefix: "RREO" },
    "Parecer TCE": { categoria: "PRESTACAO_CONTAS", tipo: "PARECER_TCE", tituloPrefix: "Parecer Prévio TCE-PI" },
  };
  return map[subfolder] ?? null;
}

// ─── Sanitizar nome de arquivo para R2 ──────────────────────────────────────
function sanitizeName(name: string): string {
  return name
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_");
}

// ─── Extrair ano do nome da pasta ───────────────────────────────────────────
function parseYear(dirName: string): number | null {
  const n = parseInt(dirName, 10);
  return n >= 1900 && n <= 2100 ? n : null;
}

// ─── Main ───────────────────────────────────────────────────────────────────
interface ItemMigracao {
  filePath: string;
  categoria: string;
  tipo: string;
  titulo: string;
  exercicio: number;
}

async function main() {
  const itens: ItemMigracao[] = [];

  // Percorre as subpastas: Balanços, RGF, RREO, "Parecer TCE"
  const subfolders = fs.readdirSync(CONTREINA, { withFileTypes: true })
    .filter(d => d.isDirectory());

  for (const sub of subfolders) {
    const catInfo = getCategoria(sub.name);
    if (!catInfo) {
      console.log(`⚠️  Ignorando pasta desconhecida: ${sub.name}`);
      continue;
    }

    const subPath = path.join(CONTREINA, sub.name);

    // Percorre as subpastas de ano: 2023, 2024, 2025, 2026…
    const anos = fs.readdirSync(subPath, { withFileTypes: true })
      .filter(d => d.isDirectory());

    for (const anoDir of anos) {
      const exercicio = parseYear(anoDir.name);
      if (!exercicio) {
        console.log(`⚠️  Ignorando pasta (não é ano): ${anoDir.name} em ${sub.name}`);
        continue;
      }

      const anoPath = path.join(subPath, anoDir.name);
      const files = fs.readdirSync(anoPath).filter(f => f.endsWith(".pdf"));

      if (files.length === 0) {
        console.log(`📭 ${sub.name}/${anoDir.name}: sem arquivos PDF`);
        continue;
      }

      console.log(`📁 ${sub.name}/${anoDir.name}: ${files.length} arquivos`);

      for (const file of files) {
        const titulo = file.replace(/\.pdf$/i, "");
        itens.push({
          filePath: path.join(anoPath, file),
          categoria: catInfo.categoria,
          tipo: catInfo.tipo,
          titulo: `${catInfo.tituloPrefix} ${exercicio} — ${titulo}`,
          exercicio,
        });
      }
    }
  }

  if (itens.length === 0) {
    console.log("❌ Nenhum arquivo encontrado para migrar.");
    return;
  }

  console.log(`\n🚀 Iniciando migração de ${itens.length} arquivos...\n`);

  let enviados = 0;
  let cadastrados = 0;
  let erros = 0;

  for (const item of itens) {
    const fileName = path.basename(item.filePath);
    const safeName = sanitizeName(fileName);
    const r2Key = `planejamento/${item.exercicio}/${item.tipo}/${safeName}`;
    const arquivoUrl = `${PUBLIC_URL}/${r2Key}`;

    console.log(`📄 ${item.titulo}`);

    // 1. Upload para R2
    try {
      const fileBuffer = fs.readFileSync(item.filePath);
      await s3.send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: r2Key,
          Body: fileBuffer,
          ContentType: "application/pdf",
        })
      );
      console.log(`   ☁️  R2 OK (${(fileBuffer.length / 1024).toFixed(0)} KB)`);
      enviados++;
    } catch (err: any) {
      console.error(`   ❌ Erro R2: ${err.message}`);
      erros++;
      continue;
    }

    // 2. Cadastro no Supabase
    try {
      const { error } = await supabase
        .schema("transparencia")
        .from("planejamento_documentos")
        .insert({
          categoria: item.categoria,
          tipo: item.tipo,
          titulo: item.titulo,
          exercicio: item.exercicio,
          descricao: `Documento de prestação de contas do exercício ${item.exercicio} — ${item.tipo}.`,
          data_publicacao: `${item.exercicio}-01-01`,
          arquivo_url: arquivoUrl,
          arquivo_nome: safeName,
          ativo: true,
          ordem: 1,
        });

      if (error) {
        console.error(`   ❌ Supabase: ${error.message}`);
        erros++;
      } else {
        console.log(`   🗄️  Supabase OK`);
        cadastrados++;
      }
    } catch (err: any) {
      console.error(`   ❌ Erro Supabase: ${err.message}`);
      erros++;
    }
  }

  console.log("\n═══════════════════════════════════════");
  console.log("📊 RESUMO DA MIGRAÇÃO:");
  console.log(`   ☁️  Enviados p/ R2: ${enviados}`);
  console.log(`   🗄️  Cadastrados no BD: ${cadastrados}`);
  console.log(`   ❌ Erros: ${erros}`);
  console.log("═══════════════════════════════════════\n");

  // ── Limpeza: remover arquivos enviados com sucesso ──────────────────────
  if (erros === 0 && enviados > 0) {
    console.log("🧹 Limpando arquivos locais (enviados com sucesso)...\n");
    let deletados = 0;
    for (const item of itens) {
      try {
        fs.unlinkSync(item.filePath);
        deletados++;
        console.log(`   🗑️  Removido: ${path.basename(item.filePath)}`);
      } catch (err: any) {
        console.error(`   ⚠️  Erro ao remover ${item.filePath}: ${err.message}`);
      }
    }

    // Remover pastas vazias
    const pastas = new Set<string>();
    for (const item of itens) {
      pastas.add(path.dirname(item.filePath));
    }
    for (const pasta of pastas) {
      try {
        const resto = fs.readdirSync(pasta);
        if (resto.length === 0) {
          fs.rmdirSync(pasta);
          console.log(`   🗑️  Pasta vazia removida: ${pasta}`);
        }
      } catch { /* ignora */ }
    }

    // Tentar remover pastas de ano se ficaram vazias
    for (const item of itens) {
      const anoPath = path.dirname(item.filePath);
      try {
        const resto = fs.readdirSync(anoPath);
        if (resto.length === 0) {
          fs.rmdirSync(anoPath);
          console.log(`   🗑️  Pasta de ano removida: ${anoPath}`);
        }
      } catch { /* ignora */ }
    }

    console.log(`\n🧹 Limpeza concluída: ${deletados} arquivo(s) removido(s).`);
  } else if (enviados > 0) {
    console.log("⚠️  Pulando limpeza devido a erros durante o upload.");
  }
}

main().catch(console.error);
