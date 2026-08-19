import "dotenv/config";
import fs from "fs";
import path from "path";
import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";

// ─── Config R2 ───
const r2 = new S3Client({
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

const DIR_ORIGEM = "c:/Users/Áurea Letícia/Documents/sitio-prefeitura/scratch_leis1/LEIS";

interface DocumentoDef {
  arquivoLocal: string;
  r2Path: string;
  exercicio: number;
  tipo: "LDO" | "LOA" | "PPA";
  titulo: string;
  descricao: string;
  data_publicacao: string;
}

const DOCUMENTOS: DocumentoDef[] = [
  // LDOs (2018 a 2022)
  {
    arquivoLocal: "LEI DE DIRETRIZES ORÇANAMENTARIA - LDO 2018.pdf",
    r2Path: "planejamento/2018/LDO/lei-de-diretrizes-orcamentarias-ldo-2018.pdf",
    exercicio: 2018,
    tipo: "LDO",
    titulo: "Lei de Diretrizes Orçamentárias (LDO 2018)",
    descricao: "Dispõe sobre as diretrizes para a elaboração e execução da Lei Orçamentária do Município de Padre Marcos para o exercício de 2018.",
    data_publicacao: "2017-12-15",
  },
  {
    arquivoLocal: "LEI DE DIRETRIZES ORÇAMENTÁRIA LDO - 2019.pdf",
    r2Path: "planejamento/2019/LDO/lei-de-diretrizes-orcamentarias-ldo-2019.pdf",
    exercicio: 2019,
    tipo: "LDO",
    titulo: "Lei de Diretrizes Orçamentárias (LDO 2019)",
    descricao: "Dispõe sobre as diretrizes para a elaboração e execução da Lei Orçamentária do Município de Padre Marcos para o exercício de 2019.",
    data_publicacao: "2018-12-15",
  },
  {
    arquivoLocal: "LEI DIRETRIZES ORÇAMENTÁRIA - LDO 2020.pdf",
    r2Path: "planejamento/2020/LDO/lei-de-diretrizes-orcamentarias-ldo-2020.pdf",
    exercicio: 2020,
    tipo: "LDO",
    titulo: "Lei de Diretrizes Orçamentárias (LDO 2020)",
    descricao: "Dispõe sobre as diretrizes para a elaboração e execução da Lei Orçamentária do Município de Padre Marcos para o exercício de 2020.",
    data_publicacao: "2019-12-15",
  },
  {
    arquivoLocal: "LEI DE DIRETRIZES ORÇAMENTÁRIA - LDO 2021.pdf",
    r2Path: "planejamento/2021/LDO/lei-de-diretrizes-orcamentarias-ldo-2021.pdf",
    exercicio: 2021,
    tipo: "LDO",
    titulo: "Lei de Diretrizes Orçamentárias (LDO 2021)",
    descricao: "Dispõe sobre as diretrizes para a elaboração e execução da Lei Orçamentária do Município de Padre Marcos para o exercício de 2021.",
    data_publicacao: "2020-12-15",
  },
  {
    arquivoLocal: "LEI DE DIRETRIZES ORÇANAMENTARIA 2022.pdf",
    r2Path: "planejamento/2022/LDO/lei-de-diretrizes-orcamentarias-ldo-2022.pdf",
    exercicio: 2022,
    tipo: "LDO",
    titulo: "Lei de Diretrizes Orçamentárias (LDO 2022)",
    descricao: "Dispõe sobre as diretrizes para a elaboração e execução da Lei Orçamentária do Município de Padre Marcos para o exercício de 2022.",
    data_publicacao: "2021-12-15",
  },
  // LOAs (2018 a 2022)
  {
    arquivoLocal: "LEI ORÇAMENTARIA ANUAL- LOA 2018 (1).pdf",
    r2Path: "planejamento/2018/LOA/lei-orcamentaria-anual-loa-2018.pdf",
    exercicio: 2018,
    tipo: "LOA",
    titulo: "Lei Orçamentária Anual (LOA 2018)",
    descricao: "Estima a receita e fixa a despesa do Município de Padre Marcos para o exercício financeiro de 2018.",
    data_publicacao: "2017-12-30",
  },
  {
    arquivoLocal: "LEI ORÇAMENTÁRIA ANUAL LOA 2019.pdf",
    r2Path: "planejamento/2019/LOA/lei-orcamentaria-anual-loa-2019.pdf",
    exercicio: 2019,
    tipo: "LOA",
    titulo: "Lei Orçamentária Anual (LOA 2019)",
    descricao: "Estima a receita e fixa a despesa do Município de Padre Marcos para o exercício financeiro de 2019.",
    data_publicacao: "2018-12-30",
  },
  {
    arquivoLocal: "LEI ORÇAMENTÁRIA ANUAL -  LOA 2020.pdf",
    r2Path: "planejamento/2020/LOA/lei-orcamentaria-anual-loa-2020.pdf",
    exercicio: 2020,
    tipo: "LOA",
    titulo: "Lei Orçamentária Anual (LOA 2020)",
    descricao: "Estima a receita e fixa a despesa do Município de Padre Marcos para o exercício financeiro de 2020.",
    data_publicacao: "2019-12-30",
  },
  {
    arquivoLocal: "LOA 2021 (2).pdf",
    r2Path: "planejamento/2021/LOA/lei-orcamentaria-anual-loa-2021.pdf",
    exercicio: 2021,
    tipo: "LOA",
    titulo: "Lei Orçamentária Anual (LOA 2021)",
    descricao: "Estima a receita e fixa a despesa do Município de Padre Marcos para o exercício financeiro de 2021.",
    data_publicacao: "2020-12-30",
  },
  {
    arquivoLocal: "LOA 2022 (2).pdf",
    r2Path: "planejamento/2022/LOA/lei-orcamentaria-anual-loa-2022.pdf",
    exercicio: 2022,
    tipo: "LOA",
    titulo: "Lei Orçamentária Anual (LOA 2022)",
    descricao: "Estima a receita e fixa a despesa do Município de Padre Marcos para o exercício financeiro de 2022.",
    data_publicacao: "2021-12-30",
  },
  // PPA (Alterações 2020)
  {
    arquivoLocal: "LEI ALTERACOES DO PLANO PLURIANUAL - PPA 2018-2021 - 2020.pdf",
    r2Path: "planejamento/2020/PPA/lei-de-alteracoes-do-plano-plurianual-2018-2021-2020.pdf",
    exercicio: 2020,
    tipo: "PPA",
    titulo: "Lei de Alterações do Plano Plurianual 2018–2021 (Exercício 2020)",
    descricao: "Alterações do Plano Plurianual do Município de Padre Marcos para o exercício de 2020 (quadriênio 2018–2021).",
    data_publicacao: "2020-01-01",
  },
];

async function uploadFile(fullPath: string, r2Path: string): Promise<string> {
  const fileStream = fs.createReadStream(fullPath);
  const stat = fs.statSync(fullPath);
  console.log(`  🚀 Enviando ${path.basename(fullPath)} (${(stat.size / 1024 / 1024).toFixed(2)} MB) → R2: ${r2Path}`);

  await r2.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: r2Path,
      Body: fileStream,
      ContentType: "application/pdf",
      ContentLength: stat.size,
    })
  );

  const finalUrl = `${PUBLIC_URL}/${r2Path}`;
  console.log(`  ✅ Upload concluído: ${finalUrl}`);
  return finalUrl;
}

async function main() {
  console.log("=================================================");
  console.log("SUBINDO LDO, LOA E PPA (2018-2022) PARA R2 & BANCO");
  console.log("=================================================\n");

  for (const doc of DOCUMENTOS) {
    const fullPath = path.join(DIR_ORIGEM, doc.arquivoLocal);
    if (!fs.existsSync(fullPath)) {
      console.error(`  ❌ Arquivo local não encontrado: ${doc.arquivoLocal}`);
      continue;
    }

    try {
      // 1. Upload para R2
      const urlR2 = await uploadFile(fullPath, doc.r2Path);

      // 2. Verificar se já existe registro no banco Supabase
      const { data: existente } = await supabase
        .schema("transparencia")
        .from("planejamento_documentos")
        .select("id, titulo")
        .eq("tipo", doc.tipo)
        .eq("exercicio", doc.exercicio)
        .ilike("titulo", `%${doc.tipo}%`);

      if (existente && existente.length > 0) {
        console.log(`  ℹ️  Atualizando registro existente no banco (${existente[0].id})...`);
        const { error: updateErr } = await supabase
          .schema("transparencia")
          .from("planejamento_documentos")
          .update({
            arquivo_url: urlR2,
            arquivo_nome: path.basename(doc.r2Path),
            titulo: doc.titulo,
            descricao: doc.descricao,
            ativo: true,
          })
          .eq("id", existente[0].id);

        if (updateErr) {
          console.error(`  ❌ Erro ao atualizar banco: ${updateErr.message}`);
        } else {
          console.log(`  ✅ Banco atualizado com sucesso!`);
        }
      } else {
        console.log(`  ➕ Inserindo novo registro no banco...`);
        const { data: inserted, error: insertErr } = await supabase
          .schema("transparencia")
          .from("planejamento_documentos")
          .insert({
            titulo: doc.titulo,
            descricao: doc.descricao,
            tipo: doc.tipo,
            categoria: "PLANEJAMENTO_ORCAMENTARIO",
            exercicio: doc.exercicio,
            ordem: 1,
            ativo: true,
            data_publicacao: doc.data_publicacao,
            arquivo_url: urlR2,
            arquivo_nome: path.basename(doc.r2Path),
          })
          .select("id");

        if (insertErr) {
          console.error(`  ❌ Erro ao inserir no banco: ${insertErr.message}`);
        } else {
          console.log(`  ✅ Registro inserido com ID: ${inserted?.[0]?.id}`);
        }
      }

      console.log("-------------------------------------------------");
    } catch (err: any) {
      console.error(`  ❌ Erro ao processar ${doc.arquivoLocal}:`, err.message || err);
    }
  }

  console.log("\n🎉 Processo concluído com sucesso!");
}

main();
