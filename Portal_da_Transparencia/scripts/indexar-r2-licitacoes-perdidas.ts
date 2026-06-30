import "dotenv/config";
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function detectarModalidade(path: string): string {
  const p = path.toUpperCase();
  if (p.includes("DISPENSA")) return "Dispensa";
  if (p.includes("PREG")) return "Pregão";
  if (p.includes("CONCORR")) return "Concorrência";
  if (p.includes("INEXIGIBILIDADE")) return "Inexigibilidade";
  if (p.includes("CHAMADA")) return "Chamada Pública";
  if (p.includes("LEIL")) return "Leilão";
  if (p.includes("TOMADA")) return "Tomada de Preços";
  if (p.includes("CONVITE")) return "Convite";
  if (p.includes("CREDENCIAMENTO")) return "Credenciamento";
  if (p.includes("ADES")) return "Adesão";
  return "Pregão";
}

function detectarTipoDoc(nome: string): string {
  const n = nome.toUpperCase();
  if (n.includes("EDITAL")) return "Edital";
  if (n.includes("HOMOLOGA")) return "Homologação";
  if (n.includes("ADJUDICA")) return "Adjudicação";
  if (n.includes("ATA")) return "Ata";
  if (n.includes("AVISO")) return "Aviso";
  if (n.includes("CONTRATO")) return "Contrato";
  if (n.includes("RELAT") || n.includes("DISPUTA")) return "Relatório de Disputa";
  if (n.includes("TERMO") || n.includes("REFERENCIA")) return "Termo de Referência";
  if (n.includes("PARECER")) return "Parecer";
  return "Outros";
}

function extrairNumAno(path: string): { numero: string; ano: number } | null {
  // Busca padrões como 001-2026, 001/2026, 001_2026
  let m = path.match(/(?:N[º°]?\s*|\b)(\d{1,4})\s*[\-\/\_]\s*(201\d|202\d)/i);
  if (m) {
    const num = parseInt(m[1], 10).toString().padStart(3, '0');
    const ano = parseInt(m[2], 10);
    return { numero: `${num}/${ano}`, ano };
  }

  // Tenta encontrar número isolado perto do ano na pasta ou nome
  m = path.match(/(\d{1,4})\D+(201\d|202\d)/);
  if (m) {
    const num = parseInt(m[1], 10).toString().padStart(3, '0');
    const ano = parseInt(m[2], 10);
    return { numero: `${num}/${ano}`, ano };
  }

  return null;
}

async function main() {
  console.log("🚀 Buscando arquivos perdidos/desindexados de licitações no Cloudflare R2...");

  // 1. Listar todos os arquivos do R2 no bucket
  let token: string | undefined;
  const r2Files: string[] = [];
  do {
    const res = await s3.send(new ListObjectsV2Command({ Bucket: process.env.R2_BUCKET, ContinuationToken: token }));
    for (const item of res.Contents || []) {
      if (item.Key && !item.Key.endsWith("/")) {
        r2Files.push(item.Key);
      }
    }
    token = res.NextContinuationToken;
  } while (token);

  const licFiles = r2Files.filter(f => {
    const l = f.toLowerCase();
    return l.includes("licit") || l.includes("preg") || l.includes("dispens") || l.includes("concorr") || l.includes("chamada");
  });
  console.log(`📂 Total de arquivos de licitação encontrados no R2: ${licFiles.length}`);

  // 2. Carregar documentos já registrados no banco
  const { data: dbDocs } = await supabase.schema("transparencia").from("licitacoes_documentos").select("caminho_r2");
  const dbSet = new Set((dbDocs || []).map(d => d.caminho_r2));

  const perdidos = licFiles.filter(f => !dbSet.has(f));
  console.log(`⚠️ Arquivos no R2 ainda não indexados no banco: ${perdidos.length}`);

  if (perdidos.length === 0) {
    console.log("✅ Todos os arquivos do R2 já estão indexados!");
    return;
  }

  // 3. Carregar mapa de licitações existentes no banco (por numero___ano___modalidade)
  const { data: todasLics } = await supabase.schema("transparencia").from("licitacoes_v2").select("*");
  const licMap = new Map<string, any>();
  (todasLics || []).forEach(l => {
    const k = `${(l.numero || "").trim()}___${l.ano}___${(l.modalidade || "").trim()}`.toUpperCase();
    licMap.set(k, l);
  });

  let indexados = 0;
  let novasCriadas = 0;

  for (const caminho of perdidos) {
    const partes = caminho.split("/");
    const nomeArquivo = partes[partes.length - 1];

    const mod = detectarModalidade(caminho);
    const tipo = detectarTipoDoc(nomeArquivo);
    const numAno = extrairNumAno(caminho) || { numero: "001/2026", ano: 2026 };

    const chaveLic = `${numAno.numero}___${numAno.ano}___${mod}`.toUpperCase();
    let lic = licMap.get(chaveLic);

    if (!lic) {
      // Criar a licitação se não existir
      const novaLic: any = {
        numero: numAno.numero,
        ano: numAno.ano,
        modalidade: mod,
        objeto: `${mod.toUpperCase()} Nº ${numAno.numero} - Processo Licitatório do Município de Padre Marcos - PI.`,
        situacao: "Finalizada",
        possui_edital: tipo === "Edital",
        possui_ata: tipo === "Ata",
        possui_homologacao: tipo === "Homologação"
      };

      const { data: criada } = await supabase.schema("transparencia").from("licitacoes_v2").insert([novaLic]).select().single();
      if (criada) {
        lic = criada;
        licMap.set(chaveLic, lic);
        novasCriadas++;
      }
    }

    if (lic) {
      const docData: any = {
        licitacao_id: lic.id,
        nome_arquivo: nomeArquivo,
        tipo_documento: tipo,
        url_arquivo: `${process.env.R2_PUBLIC_URL}/${caminho}`,
        caminho_r2: caminho,
        modalidade: mod,
        origem: "R2"
      };

      const { error } = await supabase.schema("transparencia").from("licitacoes_documentos").insert([docData]);
      if (!error) {
        indexados++;
        // Atualizar flags booleanas na licitação se for um documento chave
        const updateFlags: any = {};
        if (tipo === "Edital" && !lic.possui_edital) { updateFlags.possui_edital = true; lic.possui_edital = true; }
        if (tipo === "Ata" && !lic.possui_ata) { updateFlags.possui_ata = true; lic.possui_ata = true; }
        if (tipo === "Homologação" && !lic.possui_homologacao) { updateFlags.possui_homologacao = true; lic.possui_homologacao = true; }

        if (Object.keys(updateFlags).length > 0) {
          await supabase.schema("transparencia").from("licitacoes_v2").update(updateFlags).eq("id", lic.id);
        }
      }
    }
  }

  console.log(`🎉 Resgate concluído! Arquivos do R2 indexados no banco: ${indexados} | Novas licitações criadas para abrigar arquivos: ${novasCriadas}`);
}

main().catch(console.error);
