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
const REGEX_NUMERO_CONTRATO = /(?:CONTRATO|CT)[\s\S]{0,30}?(?:N[º°\.\s]*|NR|N)?[\s\S]{0,10}?(\d{1,4})\s*[\/\-\_]+\s*(\d{4})/i;
const REGEX_PROCESSO = /(?:PROCESSO|PA)[\s\S]{0,30}?(?:N[º°\.\s]*|NR|N)?[\s\S]{0,10}?(\d{1,4})\s*[\/\-\_]+\s*(\d{4})/i;
const REGEX_CNPJ = /(?:\bCNPJ[\s\S]{0,15}?|)(\d{2}[\.\s]*\d{3}[\.\s]*\d{3}[\/\s]*\d{4}[\-\s]*\d{2})\b/i;
const REGEX_VALOR = /(?:R\$|VALOR[\s\S]{0,15}?)[\s\S]{0,10}?([\d\.]+(?:,\d{2}))/i;

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
  
  const prompt = `Extraia os metadados deste documento de contrato público brasileiro.
Nome do arquivo: ${nomeArquivo}
Texto inicial do documento:
${texto.substring(0, 3000)}

Responda APENAS com um JSON válido com a seguinte estrutura (sem markdown, sem texto extra). Se não encontrar a informação, retorne null no campo correspondente:
{
  "numero": "string ou null (ex: 015/2023, 022/2024. Deve conter o ano se possível)",
  "ano": "numero ou null (ex: 2023)",
  "processo": "string ou null (ex: 045/2023)",
  "contratado": "string ou null (Nome da empresa ou pessoa física fornecedora)",
  "cnpj": "string ou null (CNPJ ou CPF do contratado formatado)",
  "objeto": "string ou null (Descrição clara do que foi contratado)",
  "valor": "numero ou null (Apenas os dígitos, ex: 15400.50)",
  "data_inicio": "string ou null (Data de início da vigência ou assinatura no formato YYYY-MM-DD)",
  "data_fim": "string ou null (Data de fim da vigência no formato YYYY-MM-DD)",
  "tipoDocumento": "string (ex: Contrato, Extrato, Aditivo, Apostilamento, Publicação, ou Anexo se não souber)"
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

function limparCnpj(cnpjBruto: string) {
  const numeros = cnpjBruto.replace(/[^\d]/g, '');
  if (numeros.length === 14) {
    return numeros.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  }
  return cnpjBruto;
}

async function analisarTexto(texto: string, nomeArquivo: string) {
  // Limpa o texto para evitar quebras de linha quebrando regex
  const textoLimpo = texto.replace(/\r?\n|\r/g, ' ').replace(/\s{2,}/g, ' ');

  let numero = null;
  let ano = null;

  // 1. Tenta extrair do texto
  const matchNumero = textoLimpo.match(REGEX_NUMERO_CONTRATO);
  if (matchNumero) {
    numero = `${matchNumero[1]}/${matchNumero[2]}`;
    ano = parseInt(matchNumero[2], 10);
  }

  // 2. Se não achou, tenta do nome do arquivo
  if (!numero) {
    const matchArquivo = nomeArquivo.match(/(\d{1,4})\s*[\/\-\_]+\s*(\d{4})/);
    if (matchArquivo) {
      numero = `${matchArquivo[1]}/${matchArquivo[2]}`;
      ano = parseInt(matchArquivo[2], 10);
    } else {
      // Tenta achar pelo menos um número isolado no nome do arquivo (ex: "016_Aviso.pdf")
      const matchIsolado = nomeArquivo.match(/(?:^|[\s\-\_])(\d{1,4})(?:[\s\-\_\.]|$)/);
      if (matchIsolado && !nomeArquivo.toLowerCase().includes('202')) { 
        // Evita confundir com ano se o único numero for 2023
        numero = `${matchIsolado[1]}/${new Date().getFullYear()}`;
        ano = new Date().getFullYear();
      }
    }
  }

  // 3. Processo
  let processo = null;
  const matchProcesso = textoLimpo.match(REGEX_PROCESSO);
  if (matchProcesso) {
    processo = `${matchProcesso[1]}/${matchProcesso[2]}`;
  }

  // 4. CNPJ
  let cnpj = null;
  const matchCnpj = textoLimpo.match(REGEX_CNPJ);
  if (matchCnpj) {
    cnpj = limparCnpj(matchCnpj[1]);
  }

  // 5. Valor
  let valor = null;
  const matchValor = textoLimpo.match(REGEX_VALOR);
  if (matchValor) {
    const valorStr = matchValor[1].replace(/\./g, '').replace(',', '.');
    valor = parseFloat(valorStr);
  }

  let tipoDocumento = "Anexo";
  const upperName = nomeArquivo.toUpperCase();
  const upperTexto = textoLimpo.substring(0, 1000).toUpperCase(); 
  
  if (upperName.includes("EXTRATO") || upperTexto.includes("EXTRATO")) tipoDocumento = "Extrato";
  else if (upperName.includes("ADITIVO") || upperTexto.includes("ADITIVO")) tipoDocumento = "Aditivo";
  else if (upperName.includes("APOSTILAMENTO") || upperTexto.includes("APOSTILAMENTO")) tipoDocumento = "Apostilamento";
  else if (upperName.includes("PUBLICAÇÃO") || upperName.includes("PUBLICACAO") || upperTexto.includes("PUBLICAÇÃO")) tipoDocumento = "Publicação";
  else if (upperName.includes("CONTRATO") || upperTexto.includes("CONTRATO")) tipoDocumento = "Contrato";

  // Sempre tenta extrair os metadados complexos via LLM, mesmo se a regex achar o número
  console.log(`   🧠 Solicitando extração avançada ao LLM para: ${nomeArquivo}...`);
  const llmResult = await analisarComLLM(textoLimpo, nomeArquivo);
  
  if (llmResult) {
    return {
      numero: llmResult.numero || numero,
      ano: llmResult.ano || ano || new Date().getFullYear(),
      processo: llmResult.processo || processo,
      cnpj: llmResult.cnpj || cnpj,
      valor: llmResult.valor || valor,
      contratado: llmResult.contratado,
      objeto: llmResult.objeto,
      data_inicio: llmResult.data_inicio,
      data_fim: llmResult.data_fim,
      tipoDocumento: llmResult.tipoDocumento || tipoDocumento
    };
  }

  return { 
    numero, ano, processo, cnpj, valor, tipoDocumento,
    contratado: null, objeto: null, data_inicio: null, data_fim: null
  };
}

async function main() {
  console.log("🚀 Iniciando Processador de PDFs de Contratos...");

  // Busca documentos que ainda precisam ser classificados
  const { data: documentos, error } = await supabase
    .schema("transparencia")
    .from("contratos_documentos")
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
      // 1. Baixar o arquivo do R2
      const command = new GetObjectCommand({
        Bucket: BUCKET,
        Key: doc.caminho_r2,
      });
      const response = await s3.send(command);
      const buffer = await streamToBuffer(response.Body);

      // 2. Extrair texto do PDF via pdf2json (com timeout de 15 segundos)
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

      // 3. Analisar com Regex
      const analise = await analisarTexto(texto, doc.nome_arquivo);
      console.log("   ✅ Extração concluída:", analise);

      if (!analise.numero) {
        console.log("   ⚠️ Número do contrato não encontrado. Pulando criação.");
        // Você pode decidir atualizar o tipo do documento mesmo assim, ou ignorar
        continue;
      }

      // 4. Criar ou Atualizar Contrato Principal (contratos_v2)
      const contratoData = {
        numero: analise.numero,
        ano: analise.ano || new Date().getFullYear(),
        processo: analise.processo,
        cpf_cnpj: analise.cnpj, 
        valor: analise.valor,   
        contratado: analise.contratado,
        objeto: analise.objeto,
        data_inicio: analise.data_inicio,
        data_fim: analise.data_fim,
      };

      // Remove undefined/nulls do objeto de update para não sobrescrever dados existentes com null
      const updateData = Object.fromEntries(Object.entries(contratoData).filter(([_, v]) => v != null));

      let contratoMain;
      
      const { data: existente } = await supabase
        .schema("transparencia")
        .from("contratos_v2")
        .select("*")
        .eq("numero", contratoData.numero)
        .eq("ano", contratoData.ano)
        .maybeSingle();

      if (existente) {
        const { data, error } = await supabase
          .schema("transparencia")
          .from("contratos_v2")
          .update(updateData)
          .eq("id", existente.id)
          .select()
          .single();
        if (error) throw error;
        contratoMain = data;
      } else {
        const { data, error } = await supabase
          .schema("transparencia")
          .from("contratos_v2")
          .insert([contratoData])
          .select()
          .single();
        if (error) throw error;
        contratoMain = data;
      }

      // 5. Vincular Documento ao Contrato e atualizar tipo
      const { error: erroVincular } = await supabase
        .schema("transparencia")
        .from("contratos_documentos")
        .update({
          contrato_id: contratoMain.id,
          tipo_documento: analise.tipoDocumento
        })
        .eq("id", doc.id);

      if (erroVincular) {
        console.error("   ❌ Erro ao vincular documento:", erroVincular.message);
      } else {
        console.log(`   🔗 Documento vinculado ao contrato ID: ${contratoMain.id}`);
      }

    } catch (err: any) {
      console.error(`   ❌ Erro no processamento do arquivo ${doc.nome_arquivo}:`, err.message);
    }
  }
}

main().catch(console.error);
