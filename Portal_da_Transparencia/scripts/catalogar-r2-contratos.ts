import "dotenv/config";
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";

// 1. Configurar o Cliente R2 (Cloudflare)
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

// 2. Configurar o Cliente Supabase
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TABELA_DESTINO = "contratos_documentos";

async function main() {
  console.log("🚀 Iniciando a catalogação dos CONTRATOS do R2...");

  let isTruncated = true;
  let continuationToken: string | undefined = undefined;
  let totalProcessados = 0;

  while (isTruncated) {
    const command = new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: "contratos/", // Só pega da pasta contratos
      ContinuationToken: continuationToken,
    });

    const response = await s3.send(command);
    
    if (!response.Contents || response.Contents.length === 0) {
      console.log("Nenhum arquivo encontrado no prefixo contratos/");
      break;
    }

    const registros = response.Contents.map((file) => {
      const arquivoUrl = `${PUBLIC_URL}/${file.Key}`;
      const fileName = file.Key!.split("/").pop();

      // Extrair o ano da pasta (ex: contratos/2023/...)
      const parts = file.Key!.split("/");
      let ano = 0;
      if (parts.length > 1) {
        ano = parseInt(parts[1], 10);
      }

      return {
        _ano: ano, // usado apenas para o filtro abaixo
        caminho_r2: file.Key,
        nome_arquivo: fileName,
        url_arquivo: arquivoUrl,
        tipo_documento: 'A CLASSIFICAR', // Obrigatório (NOT NULL)
        // contrato_id: uuid, // ATENÇÃO: Na sua tabela está NOT NULL! Precisará permitir nulo ou preencher depois
      };
    });

    // Filtra pastas vazias e apenas anos de 2023 em diante
    const registrosValidos = registros
      .filter(r => r.nome_arquivo !== "")
      .filter(r => !isNaN(r._ano) && r._ano >= 2023)
      .map(r => {
        const { _ano, ...resto } = r; // remove a propriedade auxiliar _ano
        return resto;
      });

    if (registrosValidos.length > 0) {
      // Insere no banco de dados
      const { error } = await supabase
        .schema("transparencia")
        .from(TABELA_DESTINO)
        .upsert(registrosValidos, { onConflict: "caminho_r2" });

      if (error) {
        console.error("❌ Erro ao inserir no banco:", error.message);
      } else {
        totalProcessados += registrosValidos.length;
        console.log(`✅ Inseridos/Atualizados ${registrosValidos.length} contratos no lote atual.`);
      }
    }

    isTruncated = response.IsTruncated ?? false;
    continuationToken = response.NextContinuationToken;
  }

  console.log(`\n🎉 Catalogação de contratos concluída! Total de arquivos no BD: ${totalProcessados}`);
}

main().catch(console.error);
