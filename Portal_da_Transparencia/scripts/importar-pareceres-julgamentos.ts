import "dotenv/config";
import fs from "fs";
import path from "path";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";

const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID || process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || "",
  },
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const BUCKET = process.env.R2_BUCKET_NAME || "transparencia";

interface DocToUpload {
  filePath: string;
  exercicio: number;
  tipo: "PARECER_TCE" | "RELATORIO_GESTAO";
  titulo: string;
  descricao: string;
  categoria: string;
}

const docs: DocToUpload[] = [
  {
    filePath: "C:/Users/Áurea Letícia/Downloads/WhatsApp_20260715_Extracted/Projeto de Decreto Legislativo 02-2024- Julgamento de contas 2020.pdf",
    exercicio: 2020,
    tipo: "PARECER_TCE",
    titulo: "Decreto Legislativo nº 02/2024 — Julgamento das Contas de Governo (Exercício 2020)",
    descricao: "Decreto Legislativo da Câmara Municipal de Padre Marcos que aprova o julgamento das Contas Anuais de Governo referentes ao exercício de 2020.",
    categoria: "PRESTACAO_CONTAS"
  },
  {
    filePath: "C:/Users/Áurea Letícia/Downloads/WhatsApp_20260715_Extracted/Projeto de Decreto Legislativo 03-2024- Julgamento de contas 2021.pdf",
    exercicio: 2021,
    tipo: "PARECER_TCE",
    titulo: "Decreto Legislativo nº 03/2024 — Julgamento das Contas de Governo (Exercício 2021)",
    descricao: "Decreto Legislativo da Câmara Municipal de Padre Marcos que aprova o julgamento das Contas Anuais de Governo referentes ao exercício de 2021.",
    categoria: "PRESTACAO_CONTAS"
  },
  {
    filePath: "C:/Users/Áurea Letícia/Downloads/WhatsApp_20260715_Extracted/RELATRIO CONTAS DE GOVERNO 2019.pdf",
    exercicio: 2019,
    tipo: "PARECER_TCE",
    titulo: "Parecer Prévio TCE-PI: Relatório das Contas de Governo — Exercício 2019",
    descricao: "Relatório de fiscalização e Parecer Prévio emitido pelo Tribunal de Contas do Estado do Piauí (TCE-PI) sobre as Contas Anuais de Governo de 2019.",
    categoria: "PRESTACAO_CONTAS"
  },
  {
    filePath: "C:/Users/Áurea Letícia/Downloads/WhatsApp_20260715_Extracted/RELATRIO CONTAS DE GOVERNO 2020.pdf",
    exercicio: 2020,
    tipo: "PARECER_TCE",
    titulo: "Parecer Prévio TCE-PI: Relatório das Contas de Governo — Exercício 2020",
    descricao: "Relatório de fiscalização e Parecer Prévio emitido pelo Tribunal de Contas do Estado do Piauí (TCE-PI) sobre as Contas Anuais de Governo de 2020.",
    categoria: "PRESTACAO_CONTAS"
  },
  {
    filePath: "C:/Users/Áurea Letícia/Downloads/WhatsApp_20260715_Extracted/RELATRIO CONTAS DE GOVERNO 2021.pdf",
    exercicio: 2021,
    tipo: "PARECER_TCE",
    titulo: "Parecer Prévio TCE-PI: Relatório das Contas de Governo — Exercício 2021",
    descricao: "Relatório de fiscalização e Parecer Prévio emitido pelo Tribunal de Contas do Estado do Piauí (TCE-PI) sobre as Contas Anuais de Governo de 2021.",
    categoria: "PRESTACAO_CONTAS"
  },
  {
    filePath: "C:/Users/Áurea Letícia/Downloads/WhatsApp_20260715_Extracted/RELATRIO CONTAS DE GOVERNO 2022.pdf",
    exercicio: 2022,
    tipo: "PARECER_TCE",
    titulo: "Parecer Prévio TCE-PI: Relatório das Contas de Governo — Exercício 2022",
    descricao: "Relatório de fiscalização e Parecer Prévio emitido pelo Tribunal de Contas do Estado do Piauí (TCE-PI) sobre as Contas Anuais de Governo de 2022.",
    categoria: "PRESTACAO_CONTAS"
  },
  {
    filePath: "C:/Users/Áurea Letícia/Downloads/WhatsApp_20260715_Extracted/RELATRIO DAS CONTAS DE GOVERNO - 2023.pdf",
    exercicio: 2023,
    tipo: "PARECER_TCE",
    titulo: "Parecer Prévio TCE-PI: Relatório das Contas de Governo — Exercício 2023",
    descricao: "Relatório de fiscalização e Parecer Prévio emitido pelo Tribunal de Contas do Estado do Piauí (TCE-PI) sobre as Contas Anuais de Governo de 2023.",
    categoria: "PRESTACAO_CONTAS"
  },
  {
    filePath: "C:/Users/Áurea Letícia/Downloads/WhatsApp_20260715_Extracted/RELATRIO DE CONTAS DE GOVERNO - 2024.pdf",
    exercicio: 2024,
    tipo: "PARECER_TCE",
    titulo: "Parecer Prévio TCE-PI: Relatório das Contas de Governo — Exercício 2024",
    descricao: "Relatório de fiscalização e Parecer Prévio emitido pelo Tribunal de Contas do Estado do Piauí (TCE-PI) sobre as Contas Anuais de Governo de 2024.",
    categoria: "PRESTACAO_CONTAS"
  },
  {
    filePath: "C:/Users/Áurea Letícia/Downloads/WhatsApp_20260715_Extracted/RELATRIO DE FISCALIZAO 2017.pdf",
    exercicio: 2017,
    tipo: "PARECER_TCE",
    titulo: "Parecer Prévio TCE-PI: Relatório das Contas de Governo — Exercício 2017",
    descricao: "Relatório de fiscalização e Parecer Prévio emitido pelo Tribunal de Contas do Estado do Piauí (TCE-PI) sobre as Contas Anuais de Governo de 2017.",
    categoria: "PRESTACAO_CONTAS"
  },
  {
    filePath: "C:/Users/Áurea Letícia/Downloads/WhatsApp_20260715_Extracted/RELATRIO DE FISCALIZAO 2018.pdf",
    exercicio: 2018,
    tipo: "PARECER_TCE",
    titulo: "Parecer Prévio TCE-PI: Relatório das Contas de Governo — Exercício 2018",
    descricao: "Relatório de fiscalização e Parecer Prévio emitido pelo Tribunal de Contas do Estado do Piauí (TCE-PI) sobre as Contas Anuais de Governo de 2018.",
    categoria: "PRESTACAO_CONTAS"
  },
  {
    filePath: "C:/Users/Áurea Letícia/Downloads/Relatório de Gestão (IN TCE-PI 01_2022) (2).pdf",
    exercicio: 2024,
    tipo: "RELATORIO_GESTAO",
    titulo: "Relatório de Gestão Anual (IN TCE-PI nº 01/2022) — Exercício 2024",
    descricao: "Relatório de Gestão da Administração Municipal de Padre Marcos referente ao exercício de 2024, em cumprimento à IN TCE-PI nº 01/2022.",
    categoria: "PRESTACAO_CONTAS"
  },
  {
    filePath: "C:/Users/Áurea Letícia/Downloads/RELATORIO DE GESTÂO PM (2) (1).pdf",
    exercicio: 2025,
    tipo: "RELATORIO_GESTAO",
    titulo: "Relatório de Gestão Anual Consolidado — Exercício 2025",
    descricao: "Relatório de Gestão Consolidado da Prefeitura Municipal de Padre Marcos referente ao exercício de 2025.",
    categoria: "PRESTACAO_CONTAS"
  }
];

async function importarPareceres() {
  console.log("=====================================================================");
  console.log("🚀 IMPORTANDO PARECERES TCE, DECRETOS DA CÂMARA E RELATÓRIOS DE GESTÃO");
  console.log("=====================================================================\n");

  let processados = 0;

  for (const doc of docs) {
    if (!fs.existsSync(doc.filePath)) {
      console.log(`❌ Arquivo não encontrado: ${doc.filePath}`);
      continue;
    }

    const stat = fs.statSync(doc.filePath);
    const fileNameSafe = path.basename(doc.filePath).replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const r2Key = `planejamento/${doc.exercicio}/${doc.tipo.toLowerCase()}/${fileNameSafe}`;

    console.log(`📤 Enviando ao R2 [${doc.exercicio}] ${doc.titulo}...`);
    const fileBuf = fs.readFileSync(doc.filePath);

    await r2Client.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: r2Key,
        Body: fileBuf,
        ContentType: "application/pdf",
      })
    );

    const publicUrl = `https://transparencia.padremarcos.pi.gov.br/${r2Key}`;

    // Upsert no Supabase por titulo + exercicio para não duplicar se rodar mais de uma vez
    const { data: exist } = await supabase
      .schema("transparencia")
      .from("planejamento_documentos")
      .select("id")
      .eq("titulo", doc.titulo)
      .eq("exercicio", doc.exercicio)
      .maybeSingle();

      if (exist) {
      console.log(`🔄 Atualizando registro existente no banco (ID: ${exist.id})...`);
      const { error } = await supabase
        .schema("transparencia")
        .from("planejamento_documentos")
        .update({
          arquivo_url: publicUrl,
          arquivo_nome: path.basename(doc.filePath),
          descricao: doc.descricao,
          tipo: doc.tipo,
          categoria: doc.categoria,
          data_publicacao: `${doc.exercicio}-12-31`,
          ativo: true,
          updated_at: new Date().toISOString()
        })
        .eq("id", exist.id);

      if (error) console.log(`   ❌ Erro ao atualizar: ${error.message}`);
      else console.log(`   ✅ Atualizado com sucesso!`);
    } else {
      console.log(`➕ Inserindo novo registro no banco...`);
      const { error } = await supabase
        .schema("transparencia")
        .from("planejamento_documentos")
        .insert({
          titulo: doc.titulo,
          exercicio: doc.exercicio,
          tipo: doc.tipo,
          categoria: doc.categoria,
          descricao: doc.descricao,
          arquivo_url: publicUrl,
          arquivo_nome: path.basename(doc.filePath),
          data_publicacao: `${doc.exercicio}-12-31`,
          ativo: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) console.log(`   ❌ Erro ao inserir: ${error.message}`);
      else console.log(`   ✅ Inserido com sucesso!`);
    }

    processados++;
  }

  console.log(`\n🎉 Concluído! ${processados} documentos foram enviados ao R2 e catalogados no banco!`);
}

importarPareceres();
