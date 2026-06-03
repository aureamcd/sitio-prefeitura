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
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Usa Service Role para ignorar RLS e ter permissão de escrita
);

// NOME DA TABELA ONDE VAMOS INSERIR OS ARQUIVOS
const TABELA_DESTINO = "licitacoes_documentos";

async function main() {
  console.log("🚀 Iniciando a catalogação dos arquivos do R2...");

  let isTruncated = true;
  let continuationToken: string | undefined = undefined;
  let totalProcessados = 0;

  // Paginação para ler todos os arquivos caso sejam mais de 1000
  while (isTruncated) {
    const command = new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: "licitacoes/", // Só pega da pasta licitacoes
      ContinuationToken: continuationToken,
    });

    const response = await s3.send(command);
    
    if (!response.Contents || response.Contents.length === 0) {
      console.log("Nenhum arquivo encontrado no prefixo licitacoes/");
      break;
    }

    // Prepara o array com os registros para inserir no banco de dados
    const registros = response.Contents.map((file) => {
      // url pública do arquivo
      const arquivoUrl = `${PUBLIC_URL}/${file.Key}`;
      
      // o nome do arquivo final (ex: EDITAL.pdf)
      const fileName = file.Key!.split("/").pop();

      // Tenta extrair a modalidade a partir da pasta logo depois de "licitacoes/"
      const parts = file.Key!.split("/");
      let modalidadeStr = null;
      if (parts.length > 2) {
        // Ex: licitacoes/Pregao Presencial/Arquivo.pdf -> parts[1] é "Pregao Presencial"
        modalidadeStr = parts[1];
      }

      return {
        caminho_r2: file.Key,
        nome_arquivo: fileName,
        url_arquivo: arquivoUrl,
        tamanho: file.Size,
        tipo_documento: 'A CLASSIFICAR', // Obrigatório (NOT NULL), o script de regex pode alterar depois
        modalidade: modalidadeStr,
        origem: 'R2',
      };
    });

    // Filtra pastas vazias (onde o nome é vazio, ex: terminam em /)
    const registrosValidos = registros.filter(r => r.nome_arquivo !== "");

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
        console.log(`✅ Inseridos/Atualizados ${registrosValidos.length} arquivos no lote atual.`);
      }
    }

    // Controle de paginação
    isTruncated = response.IsTruncated ?? false;
    continuationToken = response.NextContinuationToken;
  }

  console.log(`\n🎉 Catalogação concluída! Total de arquivos no BD: ${totalProcessados}`);
}

main().catch(console.error);
