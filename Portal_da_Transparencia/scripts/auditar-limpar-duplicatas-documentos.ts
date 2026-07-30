import "dotenv/config";
import { S3Client, ListObjectsV2Command, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});
const BUCKET = process.env.R2_BUCKET!;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function verificarDuplicatasTabela(tabela: string, campoPai: string) {
  console.log(`\n🔍 Auditando duplicatas na tabela [${tabela}]...`);
  const { data: docs, error } = await supabase.schema("transparencia").from(tabela).select("*");
  if (error || !docs) {
    console.error("Erro ao buscar documentos:", error);
    return;
  }

  const map = new Map<string, any[]>();
  for (const d of docs) {
    const key = `${d[campoPai]}___${(d.nome_arquivo || "").trim().toLowerCase()}___${(d.caminho_r2 || "").trim().toLowerCase()}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(d);
  }

  let dupsEncontradas = 0;
  let removidas = 0;

  for (const [key, lista] of map.entries()) {
    if (lista.length > 1) {
      dupsEncontradas++;
      // Mantém o primeiro/mais completo e remove os excedentes
      const manter = lista[0];
      const excedentes = lista.slice(1);
      for (const exc of excedentes) {
        const { error: errDel } = await supabase.schema("transparencia").from(tabela).delete().eq("id", exc.id);
        if (!errDel) removidas++;
      }
    }
  }

  console.log(`   📊 Total de documentos analisados em ${tabela}: ${docs.length}`);
  console.log(`   🚨 Conjuntos duplicados encontrados: ${dupsEncontradas}`);
  console.log(`   🗑️ Registros duplicados limpos: ${removidas}`);
}

async function verificarDuplicatasR2(prefixo: string) {
  console.log(`\n☁️ Auditando duplicatas de arquivos físicos no Cloudflare R2 [prefixo: ${prefixo}]...`);
  let continuationToken: string | undefined = undefined;
  const arquivosPorETag = new Map<string, string[]>();
  let totalArquivos = 0;

  do {
    const res = await s3.send(new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: prefixo,
      ContinuationToken: continuationToken
    }));

    for (const obj of res.Contents || []) {
      if (!obj.Key) continue;
      totalArquivos++;
      // ETag representa o MD5/Hash do conteúdo do arquivo no R2
      const etag = (obj.ETag || "").replace(/"/g, "") + `_${obj.Size}`;
      if (!arquivosPorETag.has(etag)) arquivosPorETag.set(etag, []);
      arquivosPorETag.get(etag)!.push(obj.Key);
    }
    continuationToken = res.NextContinuationToken;
  } while (continuationToken);

  let arquivosDuplicadosFisicamente = 0;
  for (const [etag, keys] of arquivosPorETag.entries()) {
    if (keys.length > 1) {
      arquivosDuplicadosFisicamente++;
    }
  }

  console.log(`   📦 Total de arquivos analisados no R2 (${prefixo}): ${totalArquivos}`);
  console.log(`   👯 Arquivos com conteúdo idêntico em caminhos diferentes: ${arquivosDuplicadosFisicamente}`);
}

async function main() {
  console.log("🚀 === INICIANDO AUDITORIA E LIMPEZA DE DUPLICATAS DE DOCUMENTOS ===");
  await verificarDuplicatasTabela("licitacoes_documentos", "licitacao_id");
  await verificarDuplicatasTabela("contratos_documentos", "contrato_id");

  await verificarDuplicatasR2("backup contratos");
  await verificarDuplicatasR2("backup licitacoes");
  console.log("\n✅ Auditoria de duplicatas finalizada!");
}

main().catch(console.error);
