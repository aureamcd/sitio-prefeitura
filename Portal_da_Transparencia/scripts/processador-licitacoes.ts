import "dotenv/config";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";
const PDFParser = require("pdf2json");

process.on('uncaughtException', (err) => {
  console.error("⚠️ Uncaught Exception ignorada (possível PDF corrompido):", err.message);
});
process.on('unhandledRejection', (reason) => {
  console.error("⚠️ Unhandled Rejection ignorada (possível PDF corrompido):", reason);
});

// 1. Configurar R2 e Supabase
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
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Expressões Regulares (Regex) para extração de metadados
 */
const REGEX_NUMERO_LICITACAO = /(?:PREG[AÃ]O|TOMADA|CONCORR[EÊ]NCIA|CARTA|DISPENSA|INEXIGIBILIDADE|CHAMADA|PE|PP|TP|PA|CREDENCIAMENTO)[\s\S]{0,30}?(?:N[º°\.\s]*|NR|N|0)?[\s\S]{0,10}?(\d{1,4})\s*[\/\-\_]+\s*(\d{4})/i;
const REGEX_PROCESSO = /(?:PROCESSO|PA)[\s\S]{0,30}?(?:N[º°\.\s]*|NR|N)?[\s\S]{0,10}?(\d{1,4})\s*[\/\-\_]+\s*(\d{4})/i;

async function streamToBuffer(stream: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on("data", (chunk: Buffer) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks)));
  });
}

async function analisarComLLM(texto: string, nomeArquivo: string) {
  if (!process.env.OPENROUTER_API_KEY) return null;
  
  const prompt = `Extraia os metadados deste documento de licitação pública brasileira.
Nome do arquivo: ${nomeArquivo}
Texto inicial do documento:
${texto.substring(0, 3000)}

Responda APENAS com um JSON válido com a seguinte estrutura (sem markdown, sem texto extra). Se não encontrar a informação, retorne null no campo correspondente:
{
  "numero": "string ou null (ex: 015/2023, 022/2024. Deve conter o ano se possível)",
  "ano": "numero ou null (ex: 2023)",
  "processo": "string ou null (ex: 045/2023)",
  "modalidade": "string ou null (ex: Pregão Eletrônico, Tomada de Preços, Dispensa, etc)",
  "objeto": "string ou null (Descrição clara do que está sendo licitado)",
  "data_abertura": "string ou null (Data da sessão de abertura no formato YYYY-MM-DD)",
  "valor_estimado": "numero ou null (Apenas dígitos do valor estimado ou homologado, ex: 15400.50)",
  "situacao": "string ou null (Ex: Aberta, Em Andamento, Encerrada, Homologada, Revogada, Fracassada, Deserta)",
  "tipoDocumento": "string (ex: Edital, Aviso, Ata, Homologação, Termo de Referência, ou Anexo se não souber)"
}`;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      })
    });
    
    if (!response.ok) return null;
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (content) {
      const parsed = JSON.parse(content.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim());
      return parsed;
    }
  } catch (err) {
    console.error("Erro na extração com LLM:", err);
  }
  return null;
}

async function analisarTexto(texto: string, nomeArquivo: string) {
  const textoLimpo = texto.replace(/\r?\n|\r/g, ' ').replace(/\s{2,}/g, ' ');

  let numero = null;
  let ano = null;
  
  const matchNumero = textoLimpo.match(REGEX_NUMERO_LICITACAO);
  if (matchNumero) {
    numero = `${matchNumero[1]}/${matchNumero[2]}`;
    ano = parseInt(matchNumero[2], 10);
  }

  // Tenta extrair do nome do arquivo
  if (!numero) {
    const matchArquivo = nomeArquivo.match(/(\d{1,4})\s*[\/\-\_]+\s*(\d{4})/);
    if (matchArquivo) {
      numero = `${matchArquivo[1]}/${matchArquivo[2]}`;
      ano = parseInt(matchArquivo[2], 10);
    } else {
      const matchIsolado = nomeArquivo.match(/(?:^|[\s\-\_])(\d{1,4})(?:[\s\-\_\.]|$)/);
      if (matchIsolado && !nomeArquivo.toLowerCase().includes('202')) { 
        numero = `${matchIsolado[1]}/${new Date().getFullYear()}`;
        ano = new Date().getFullYear();
      }
    }
  }

  let processo = null;
  const matchProcesso = textoLimpo.match(REGEX_PROCESSO);
  if (matchProcesso) {
    processo = `${matchProcesso[1]}/${matchProcesso[2]}`;
  }

  // Classificação do tipo de documento pela extensão ou texto
  let tipoDocumento = "Anexo";
  const upperName = nomeArquivo.toUpperCase();
  
  if (upperName.includes("EDITAL")) tipoDocumento = "Edital";
  else if (upperName.includes("AVISO")) tipoDocumento = "Aviso";
  else if (upperName.includes("ATA")) tipoDocumento = "Ata";
  else if (upperName.includes("HOMOLOGAÇÃO") || upperName.includes("HOMOLOGACAO")) tipoDocumento = "Homologação";
  else if (upperName.includes("TERMO DE REFERÊNCIA") || upperName.includes("TERMO DE REFERENCIA")) tipoDocumento = "Termo de Referência";

  // Sempre tenta extrair os metadados complexos via LLM, mesmo se a regex achar o número
  console.log(`   🧠 Solicitando extração avançada ao LLM para: ${nomeArquivo}...`);
  const llmResult = await analisarComLLM(textoLimpo, nomeArquivo);
  
  if (llmResult) {
    return {
      numero: llmResult.numero || numero,
      ano: llmResult.ano || ano || new Date().getFullYear(),
      processo: llmResult.processo || processo,
      modalidade: llmResult.modalidade,
      objeto: llmResult.objeto,
      data_abertura: llmResult.data_abertura,
      valor_estimado: llmResult.valor_estimado,
      situacao: llmResult.situacao,
      tipoDocumento: llmResult.tipoDocumento || tipoDocumento
    };
  }

  return { 
    numero, ano, processo, tipoDocumento,
    modalidade: null, objeto: null, data_abertura: null, valor_estimado: null, situacao: null 
  };
}

async function main() {
  console.log("🚀 Iniciando Processador de PDFs de Licitações...");

  // Busca documentos que ainda precisam ser classificados
  const { data: documentos, error } = await supabase
    .schema("transparencia")
    .from("licitacoes_documentos")
    .select("*")
    .eq("tipo_documento", "A CLASSIFICAR");

  if (error || !documentos) {
    console.error("Erro ao buscar documentos:", error);
    return;
  }

  console.log(`Encontrados ${documentos.length} documentos para processar.`);

  for (const doc of documentos) {
    console.log(`\n📄 Processando: ${doc.nome_arquivo} (ID: ${doc.id})`);
    
    try {
      const command = new GetObjectCommand({ Bucket: BUCKET, Key: doc.caminho_r2 });
      const response = await s3.send(command);
      const buffer = await streamToBuffer(response.Body);

      const texto = await new Promise<string>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("Timeout ao ler PDF (corrompido ou muito grande)")), 15000);
        try {
          const pdfParser = new PDFParser(this, 1);
          pdfParser.on("pdfParser_dataError", (errData: any) => {
            clearTimeout(timeout);
            reject(errData.parserError);
          });
          pdfParser.on("pdfParser_dataReady", () => {
            clearTimeout(timeout);
            resolve(pdfParser.getRawTextContent());
          });
          pdfParser.parseBuffer(buffer);
        } catch (e) {
          clearTimeout(timeout);
          reject(e);
        }
      });

      const analise = await analisarTexto(texto, doc.nome_arquivo);
      console.log("   ✅ Extração concluída:", analise);

      if (!analise.numero) {
        console.log("   ⚠️ Número da licitação não encontrado. Pulando criação principal.");
        continue;
      }

      // 4. Criar ou Atualizar Licitação Principal (licitacoes_v2)
      const licitacaoData = {
        numero: analise.numero,
        ano: analise.ano || new Date().getFullYear(),
        processo: analise.processo,
        modalidade: analise.modalidade || doc.modalidade, // Preferir o que o LLM extraiu, fallback para o que veio do R2
        objeto: analise.objeto,
        data_abertura: analise.data_abertura,
        valor_estimado: analise.valor_estimado,
        situacao: analise.situacao,
      };

      // Remove nulls para não sobrescrever dados existentes com null
      const updateData = Object.fromEntries(Object.entries(licitacaoData).filter(([_, v]) => v != null));

      let licitacaoMain;
      const { data: existente } = await supabase
        .schema("transparencia")
        .from("licitacoes_v2")
        .select("*")
        .eq("numero", licitacaoData.numero)
        .eq("ano", licitacaoData.ano)
        .maybeSingle();

      if (existente) {
        const { data, error } = await supabase
          .schema("transparencia")
          .from("licitacoes_v2")
          .update(updateData)
          .eq("id", existente.id)
          .select()
          .single();
        if (error) throw error;
        licitacaoMain = data;
      } else {
        const { data, error } = await supabase
          .schema("transparencia")
          .from("licitacoes_v2")
          .insert([licitacaoData])
          .select()
          .single();
        if (error) throw error;
        licitacaoMain = data;
      }

      // 5. Vincular Documento à Licitação e atualizar tipo
      const { error: erroVincular } = await supabase
        .schema("transparencia")
        .from("licitacoes_documentos")
        .update({
          licitacao_id: licitacaoMain.id,
          tipo_documento: analise.tipoDocumento
        })
        .eq("id", doc.id);

      if (erroVincular) {
        console.error("   ❌ Erro ao vincular documento:", erroVincular.message);
      } else {
        console.log(`   🔗 Documento vinculado à licitação ID: ${licitacaoMain.id}`);
      }

    } catch (err: any) {
      console.error(`   ❌ Erro no processamento do arquivo ${doc.nome_arquivo}:`, err.message);
    }
  }
}

main().catch(console.error);
