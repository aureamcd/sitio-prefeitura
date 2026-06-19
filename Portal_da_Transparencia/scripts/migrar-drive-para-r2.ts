import "dotenv/config";
import fs from "fs";
import path from "path";
import https from "https";
import http from "http";
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

const TEMP_DIR = path.resolve(__dirname, "../temp-drive-downloads");

// ─── Documentos (2023+) ─────────────────────────────────────────────────────
interface Documento {
  fileId: string;
  tipo: string;
  titulo: string;
  descricao: string;
  exercicio: number;
  ordem: number;
  categoria: string; // PLANEJAMENTO_ORCAMENTARIO ou PRESTACAO_CONTAS
}

const documentos: Documento[] = [
  // ── PPA ──
  {
    fileId: "1wgbFjL4MTwaabKrJi0GpvZQ2ZEsapBLW",
    tipo: "PPA",
    titulo: "Plano Plurianual (PPA) 2022–2025",
    descricao: "Plano Plurianual do Município de Padre Marcos para o quadriênio 2022–2025.",
    exercicio: 2022,
    ordem: 1,
    categoria: "PLANEJAMENTO_ORCAMENTARIO",
  },
  {
    fileId: "17tZ3m_avpSIXx56tBJ8UqCZMdlqqVkNL",
    tipo: "PPA",
    titulo: "Lei de Alteração do Plano Plurianual 2022–2025",
    descricao: "Atualização do Plano Plurianual do Município de Padre Marcos para o quadriênio 2022–2025.",
    exercicio: 2022,
    ordem: 2,
    categoria: "PLANEJAMENTO_ORCAMENTARIO",
  },
  {
    fileId: "1nnPR3ILgqUdE5AAafDmrODPNd8HQc73K",
    tipo: "PPA",
    titulo: "Lei de Alteração do Plano Plurianual 2022–2025 (2024)",
    descricao: "Atualização do Plano Plurianual do Município de Padre Marcos para o quadriênio 2022–2025, exercício 2024.",
    exercicio: 2024,
    ordem: 3,
    categoria: "PLANEJAMENTO_ORCAMENTARIO",
  },
  // ── LDO ──
  {
    fileId: "1z36LXJYzAvAFV7R9_vkikAIdcRHY1S43",
    tipo: "LDO",
    titulo: "Lei de Diretrizes Orçamentárias (LDO) 2023",
    descricao: "Lei de Diretrizes Orçamentárias do Município de Padre Marcos para o exercício de 2023.",
    exercicio: 2023,
    ordem: 1,
    categoria: "PLANEJAMENTO_ORCAMENTARIO",
  },
  {
    fileId: "1J_lA2idnL3Kiufq6rBYF8S5rCic9etWE",
    tipo: "LDO",
    titulo: "Lei de Diretrizes Orçamentárias (LDO) 2024",
    descricao: "Lei de Diretrizes Orçamentárias do Município de Padre Marcos para o exercício de 2024.",
    exercicio: 2024,
    ordem: 1,
    categoria: "PLANEJAMENTO_ORCAMENTARIO",
  },
  {
    fileId: "1RT6wczyFn-DKac9hIru3sW1OsSMCtoKM",
    tipo: "LDO",
    titulo: "Lei de Diretrizes Orçamentárias (LDO) 2025",
    descricao: "Lei de Diretrizes Orçamentárias do Município de Padre Marcos para o exercício de 2025.",
    exercicio: 2025,
    ordem: 1,
    categoria: "PLANEJAMENTO_ORCAMENTARIO",
  },
  // ── LOA ──
  {
    fileId: "1qBmCbSm6Zd5w5yiWXuQ0S1112nKQ4ZGB",
    tipo: "LOA",
    titulo: "Lei Orçamentária Anual (LOA) 2023",
    descricao: "Lei Orçamentária Anual do Município de Padre Marcos para o exercício de 2023.",
    exercicio: 2023,
    ordem: 1,
    categoria: "PLANEJAMENTO_ORCAMENTARIO",
  },
  {
    fileId: "1jjIyTVLfFBwsUBf7Nm_LukIQwlvZYkOP",
    tipo: "LOA",
    titulo: "Lei Orçamentária Anual (LOA) 2024",
    descricao: "Lei Orçamentária Anual do Município de Padre Marcos para o exercício de 2024.",
    exercicio: 2024,
    ordem: 1,
    categoria: "PLANEJAMENTO_ORCAMENTARIO",
  },
  {
    fileId: "1ypbsTL9KLRERKje6hO62YM8qr_oM4ArR",
    tipo: "LOA",
    titulo: "Lei Orçamentária Anual (LOA) 2025",
    descricao: "Lei Orçamentária Anual do Município de Padre Marcos para o exercício de 2025.",
    exercicio: 2025,
    ordem: 1,
    categoria: "PLANEJAMENTO_ORCAMENTARIO",
  },
  // ── Relatórios de Gestão ──
  {
    fileId: "1gRy8-ani7akhuitxQO7hHxAYIbR4Yy1a",
    tipo: "RELATORIO_GESTAO",
    titulo: "Relatório de Gestão do Município de Padre Marcos-PI 2023",
    descricao: "Relatório de Gestão do Município de Padre Marcos - Exercício de 2023.",
    exercicio: 2023,
    ordem: 1,
    categoria: "PRESTACAO_CONTAS",
  },
  {
    fileId: "1NY-UDSeyXXrsi-DU9wiPvTQq-m5_z9sb",
    tipo: "RELATORIO_GESTAO",
    titulo: "Relatório de Gestão do RPPS 2023",
    descricao: "Relatório de Gestão do Fundo de Previdência do Município de Padre Marcos - Exercício de 2023.",
    exercicio: 2023,
    ordem: 2,
    categoria: "PRESTACAO_CONTAS",
  },
  {
    fileId: "1claJt76Y9b0jBPr0N5DiCRBuRaA0nwXQ",
    tipo: "RELATORIO_GESTAO",
    titulo: "Relatório de Gestão - Administração 2024",
    descricao: "Relatório de Gestão apresentando o desempenho dos órgãos e setores municipais de Padre Marcos no ano de 2024.",
    exercicio: 2024,
    ordem: 1,
    categoria: "PRESTACAO_CONTAS",
  },
];

// ─── Download do Google Drive ────────────────────────────────────────────────
function downloadFromDrive(fileId: string, destPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const url = `https://docs.google.com/uc?export=download&id=${fileId}`;
    const file = fs.createWriteStream(destPath);

    https.get(url, (res) => {
      // Se o Google redirecionar para confirmação de virus
      if (res.statusCode === 302 || res.statusCode === 301) {
        const redirectUrl = res.headers.location;
        if (!redirectUrl) {
          reject(new Error("Redirect sem location"));
          return;
        }
        https.get(redirectUrl, (res2) => {
          res2.pipe(file);
          file.on("finish", () => {
            file.close();
            // Verifica se o arquivo é HTML (página de confirmação)
            const content = fs.readFileSync(destPath, "utf-8").trim();
            if (content.startsWith("<") && content.includes("confirm")) {
              // Extrai o token de confirmação
              const match = content.match(/confirm=([^"&]+)/);
              if (match) {
                const confirmUrl = `https://docs.google.com/uc?export=download&id=${fileId}&confirm=${match[1]}`;
                https.get(confirmUrl, (res3) => {
                  const file3 = fs.createWriteStream(destPath);
                  res3.pipe(file3);
                  file3.on("finish", () => file3.close(resolve));
                });
              } else {
                reject(new Error("Não foi possível baixar - página de confirmação"));
              }
            } else {
              resolve();
            }
          });
        });
        return;
      }

      res.pipe(file);
      file.on("finish", () => {
        file.close();
        // Verifica se é HTML
        try {
          const stat = fs.statSync(destPath);
          if (stat.size < 1000) {
            const content = fs.readFileSync(destPath, "utf-8");
            if (content.includes("Google Drive")) {
              // Tenta com cookie
              const cookieUrl = `https://docs.google.com/uc?export=download&id=${fileId}&confirm=t`;
              https.get(cookieUrl, (res2) => {
                const file2 = fs.createWriteStream(destPath);
                res2.pipe(file2);
                file2.on("finish", () => file2.close(resolve));
              });
              return;
            }
          }
        } catch {}
        resolve();
      });
    }).on("error", reject);
  });
}

// ─── Upload para R2 ─────────────────────────────────────────────────────────
async function uploadParaR2(localPath: string, r2Key: string): Promise<void> {
  const fileBuffer = fs.readFileSync(localPath);
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: r2Key,
      Body: fileBuffer,
      ContentType: "application/pdf",
    })
  );
}

// ─── Main ───────────────────────────────────────────────────────────────────
async function main() {
  // Cria pasta temporária
  if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

  console.log("🚀 Iniciando migração do Google Drive → R2 → Supabase\n");
  console.log(`📄 Total de documentos: ${documentos.length}\n`);

  let baixados = 0;
  let enviados = 0;
  let cadastrados = 0;
  let erros = 0;

  for (const doc of documentos) {
    const slug = doc.titulo
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
    const fileName = `${slug}.pdf`;
    const localPath = path.join(TEMP_DIR, fileName);
    const r2Key = `planejamento/${doc.exercicio}/${doc.tipo}/${fileName}`;
    const arquivoUrl = `${PUBLIC_URL}/${r2Key}`;

    console.log(`\n📄 ${doc.titulo}`);

    // 1. Download do Google Drive
    try {
      console.log(`   ⬇️  Baixando do Google Drive...`);
      await downloadFromDrive(doc.fileId, localPath);
      const stats = fs.statSync(localPath);
      console.log(`   ✅ Download concluído (${(stats.size / 1024).toFixed(0)} KB)`);
      baixados++;
    } catch (err: any) {
      console.error(`   ❌ Erro no download: ${err.message}`);
      erros++;
      continue;
    }

    // 2. Upload para R2
    try {
      console.log(`   ☁️  Enviando para R2...`);
      await uploadParaR2(localPath, r2Key);
      console.log(`   ✅ R2: ${r2Key}`);
      enviados++;
    } catch (err: any) {
      console.error(`   ❌ Erro no upload R2: ${err.message}`);
      erros++;
      continue;
    }

    // 3. Cadastro no Supabase
    try {
      const { error } = await supabase
        .schema("transparencia")
        .from("planejamento_documentos")
        .insert({
          categoria: doc.categoria,
          tipo: doc.tipo,
          titulo: doc.titulo,
          exercicio: doc.exercicio,
          descricao: doc.descricao,
          data_publicacao: `${doc.exercicio}-01-01`,
          arquivo_url: arquivoUrl,
          arquivo_nome: fileName,
          ativo: true,
          ordem: doc.ordem,
        });

      if (error) {
        console.error(`   ❌ Supabase: ${error.message}`);
        erros++;
      } else {
        console.log(`   ✅ Supabase: ${doc.titulo}`);
        cadastrados++;
      }
    } catch (err: any) {
      console.error(`   ❌ Erro no Supabase: ${err.message}`);
      erros++;
    }

    // Remove arquivo temporário
    try { fs.unlinkSync(localPath); } catch {}
  }

  // Limpa pasta temporária
  try { fs.rmdirSync(TEMP_DIR); } catch {}

  console.log("\n═══════════════════════════════════════");
  console.log("📊 RESUMO:");
  console.log(`   ⬇️  Baixados: ${baixados}`);
  console.log(`   ☁️  Enviados p/ R2: ${enviados}`);
  console.log(`   🗄️  Cadastrados no BD: ${cadastrados}`);
  console.log(`   ❌ Erros: ${erros}`);
  console.log("═══════════════════════════════════════");
}

main().catch(console.error);
