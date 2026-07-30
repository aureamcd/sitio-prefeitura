import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const originSupabase = createClient(
  "https://vgkufzfuozribwzubnrn.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZna3VmemZ1b3pyaWJ3enVibnJuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODg4OTExOSwiZXhwIjoyMDk0NDY1MTE5fQ.M-2lnwrRNqG_47JHMrQYTokYJHQKICuzTyl_Ic-xfkc"
);

const destSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function normalizarModalidade(texto: string): string {
  if (!texto) return "outros";
  const t = texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (t.includes("pregao")) return "pregao";
  if (t.includes("tomada")) return "tomada";
  if (t.includes("dispensa")) return "dispensa";
  if (t.includes("inexig")) return "inexigibilidade";
  if (t.includes("concorrencia")) return "concorrencia";
  if (t.includes("leilao")) return "leilao";
  if (t.includes("chamada")) return "chamada";
  return "outros";
}

async function fetchAll(client: any, schema: string, table: string) {
  let all: any[] = [];
  let from = 0;
  const step = 1000;
  while (true) {
    const { data, error } = await client.schema(schema).from(table).select("*").range(from, from + step - 1);
    if (error || !data || data.length === 0) break;
    all = all.concat(data);
    if (data.length < step) break;
    from += step;
  }
  return all;
}

async function migrarLicitacoes() {
  console.log("\n🚀 Sincronizando Licitações do Projeto Secundário (Número + Ano + Modalidade)...");
  const origLic = await fetchAll(originSupabase, "public", "licitacoes");
  console.log(`   📦 Total lido na origem (licitacoes): ${origLic.length}`);

  const destLic = await fetchAll(destSupabase, "transparencia", "licitacoes_v2");
  const destMap = new Map<string, any>();
  destLic.forEach(l => {
    const n = (l.numero_processo || l.numero_licitacao || "").toString().replace(/^0+/, "").trim();
    const mod = normalizarModalidade(l.modalidade || l.objeto || "");
    const k = `${n}___${l.ano}___${mod}`;
    destMap.set(k, l);
  });

  const destDocs = await fetchAll(destSupabase, "transparencia", "licitacoes_documentos");
  const docSet = new Set<string>();
  destDocs.forEach(d => {
    docSet.add(`${d.licitacao_id}___url___${(d.url_arquivo || "").trim().toLowerCase()}`);
    docSet.add(`${d.licitacao_id}___nome___${(d.nome_arquivo || "").trim().toLowerCase()}`);
  });

  let inseridas = 0;
  let docsVinculados = 0;

  for (let i = 0; i < origLic.length; i++) {
    const item = origLic[i];
    if (i > 0 && i % 500 === 0) {
      console.log(`   ⏳ Progresso Licitações: [${i}/${origLic.length}] | Inseridas: ${inseridas} | Docs: ${docsVinculados}`);
    }

    if (!item.numero || !item.ano) continue;
    const nClean = item.numero.toString().replace(/^0+/, "").trim();
    const modOrigem = normalizarModalidade(item.modalidade || item.titulo || item.descricao || "");
    const k = `${nClean}___${item.ano}___${modOrigem}`;
    let alvo = destMap.get(k);

    if (!alvo) {
      const novo = {
        numero_processo: item.numero,
        numero_licitacao: item.numero,
        ano: parseInt(item.ano, 10) || 2024,
        modalidade: item.modalidade || modOrigem.toUpperCase(),
        objeto: item.descricao || item.titulo || `Licitação nº ${item.numero}/${item.ano}`,
        situacao: "Concluída",
        origem: "MIGRACAO_PROJECT_BACKUP"
      };
      const { data: resIns } = await destSupabase.schema("transparencia").from("licitacoes_v2").insert(novo).select().single();
      if (resIns) {
        alvo = resIns;
        destMap.set(k, alvo);
        inseridas++;
      }
    }

    if (!alvo) continue;

    const urls = [
      { u: item.arquivo_r2_url || item.arquivo_url, t: "Edital/Arquivo Principal" },
      { u: item.aviso_url, t: "Aviso de Licitação" },
      { u: item.edital_url, t: "Edital" },
      { u: item.propostas_url, t: "Propostas/Ata" },
      { u: item.homologacao_url, t: "Homologação/Adjudicação" }
    ];

    for (const uObj of urls) {
      if (uObj.u && typeof uObj.u === "string" && uObj.u.startsWith("http")) {
        const urlClean = uObj.u.trim().toLowerCase();
        const nomeArq = uObj.u.split("/").pop() || `${uObj.t}.pdf`;
        const nomeClean = nomeArq.trim().toLowerCase();

        const keyUrl = `${alvo.id}___url___${urlClean}`;
        const keyNome = `${alvo.id}___nome___${nomeClean}`;

        if (!docSet.has(keyUrl) && !docSet.has(keyNome)) {
          const { error: errDoc } = await destSupabase.schema("transparencia").from("licitacoes_documentos").insert({
            licitacao_id: alvo.id,
            nome_arquivo: nomeArq,
            url_arquivo: uObj.u,
            caminho_r2: uObj.u.includes("r2.dev") ? uObj.u.split("r2.dev/")[1] : uObj.u,
            tipo_documento: uObj.t,
            origem: "MIGRACAO_PROJECT_BACKUP"
          });
          if (!errDoc) {
            docSet.add(keyUrl);
            docSet.add(keyNome);
            docsVinculados++;
          }
        }
      }
    }
  }

  console.log(`✅ Licitações sincronizadas com sucesso: +${inseridas} novos processos | +${docsVinculados} novos anexos vinculados.`);
}

async function migrarContratos() {
  console.log("\n🚀 Sincronizando Contratos do Projeto Secundário (Número + Ano)...");
  const origCont = await fetchAll(originSupabase, "public", "contratos");
  console.log(`   📦 Total lido na origem (contratos): ${origCont.length}`);

  const destCont = await fetchAll(destSupabase, "transparencia", "contratos_v2");
  const destMap = new Map<string, any>();
  destCont.forEach(c => {
    const n = (c.numero || "").toString().replace(/^0+/, "").trim();
    const k = `${n}___${c.ano}`;
    destMap.set(k, c);
  });

  const destDocs = await fetchAll(destSupabase, "transparencia", "contratos_documentos");
  const docSet = new Set<string>();
  destDocs.forEach(d => {
    docSet.add(`${d.contrato_id}___url___${(d.url_arquivo || "").trim().toLowerCase()}`);
    docSet.add(`${d.contrato_id}___nome___${(d.nome_arquivo || "").trim().toLowerCase()}`);
  });

  let inseridos = 0;
  let docsVinculados = 0;

  for (let i = 0; i < origCont.length; i++) {
    const item = origCont[i];
    if (i > 0 && i % 500 === 0) {
      console.log(`   ⏳ Progresso Contratos: [${i}/${origCont.length}] | Inseridos: ${inseridos} | Docs: ${docsVinculados}`);
    }

    if (!item.numero || !item.ano) continue;
    const nClean = item.numero.toString().replace(/^0+/, "").trim();
    const k = `${nClean}___${item.ano}`;
    let alvo = destMap.get(k);

    if (!alvo) {
      const novo = {
        numero: item.numero,
        ano: parseInt(item.ano, 10) || 2024,
        objeto: item.descricao || item.titulo || `Contrato nº ${item.numero}/${item.ano}`,
        valor: item.valor ? parseFloat(item.valor.replace(/[^\d.,]/g, "").replace(".", "").replace(",", ".")) || null : null,
        situacao: parseInt(item.ano, 10) >= 2025 ? "Vigente" : "Concluído",
        origem: "MIGRACAO_PROJECT_BACKUP"
      };
      const { data: resIns } = await destSupabase.schema("transparencia").from("contratos_v2").insert(novo).select().single();
      if (resIns) {
        alvo = resIns;
        destMap.set(k, alvo);
        inseridos++;
      }
    }

    if (!alvo) continue;

    const url = item.arquivo_r2_url || item.arquivo_url;
    if (url && typeof url === "string" && url.startsWith("http")) {
      const urlClean = url.trim().toLowerCase();
      const nomeArq = url.split("/").pop() || `${item.titulo || "Contrato"}.pdf`;
      const nomeClean = nomeArq.trim().toLowerCase();

      const keyUrl = `${alvo.id}___url___${urlClean}`;
      const keyNome = `${alvo.id}___nome___${nomeClean}`;

      if (!docSet.has(keyUrl) && !docSet.has(keyNome)) {
        const tipoDoc = (item.titulo || "").toUpperCase().includes("ADITIVO") ? "Termo Aditivo" : "Contrato Original";
        const { error: errDoc } = await destSupabase.schema("transparencia").from("contratos_documentos").insert({
          contrato_id: alvo.id,
          nome_arquivo: nomeArq,
          url_arquivo: url,
          caminho_r2: url.includes("r2.dev") ? url.split("r2.dev/")[1] : url,
          tipo_documento: tipoDoc,
          origem: "MIGRACAO_PROJECT_BACKUP"
        });
        if (!errDoc) {
          docSet.add(keyUrl);
          docSet.add(keyNome);
          docsVinculados++;
        }
      }
    }
  }

  console.log(`✅ Contratos sincronizados com sucesso: +${inseridos} novos contratos | +${docsVinculados} novos anexos vinculados.`);
}

async function main() {
  console.log("🌟 INICIANDO MIGRAÇÃO COM VERIFICAÇÃO DUPLA ANTI-REPETIÇÃO E MODALIDADE...");
  await migrarLicitacoes();
  await migrarContratos();
  console.log("\n🏁 MIGRAÇÃO FINALIZADA COM SUCESSO!");
}

main().catch(console.error);
