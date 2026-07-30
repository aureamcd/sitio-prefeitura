import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function verificarSaude() {
  console.log("🔍 === AUDITORIA COMPLETA DAS TABELAS DE LICITAÇÃO E DOCUMENTOS ===");

  // 1. Carregar licitacoes_v2
  const { data: lics, error: errLics } = await supabase
    .schema("transparencia")
    .from("licitacoes_v2")
    .select("*");

  if (errLics || !lics) {
    console.error("Erro ao ler licitacoes_v2:", errLics);
    return;
  }

  // 2. Carregar licitacoes_documentos
  const { data: docs, error: errDocs } = await supabase
    .schema("transparencia")
    .from("licitacoes_documentos")
    .select("*");

  if (errDocs || !docs) {
    console.error("Erro ao ler licitacoes_documentos:", errDocs);
    return;
  }

  console.log(`📊 Total de Licitações (licitacoes_v2): ${lics.length}`);
  console.log(`📑 Total de Documentos PDF (licitacoes_documentos): ${docs.length}`);

  // 3. Verificar duplicatas (numero + ano + modalidade)
  const chaves = new Map<string, any[]>();
  lics.forEach(l => {
    const chave = `${l.numero} / ${l.ano} [${l.modalidade}]`.trim();
    if (!chaves.has(chave)) chaves.set(chave, []);
    chaves.get(chave)!.push(l);
  });

  let qtdDuplicadas = 0;
  chaves.forEach((lista, chave) => {
    if (lista.length > 1) {
      qtdDuplicadas++;
      console.warn(`⚠️ DUPLICATA ENCONTRADA: ${chave} -> ${lista.length} vezes (Origens: ${lista.map(x => x.origem).join(", ")})`);
    }
  });

  if (qtdDuplicadas === 0) {
    console.log("✅ Nenhuma duplicata de chave (número/ano/modalidade) encontrada!");
  } else {
    console.warn(`❌ Total de combinações duplicadas: ${qtdDuplicadas}`);
  }

  // 4. Verificar licitações sem documentos e documentos órfãos
  const licIds = new Set(lics.map(l => l.id));
  const docsPorLic = new Map<string, number>();
  let docsOrfaos = 0;

  docs.forEach(d => {
    if (!licIds.has(d.licitacao_id)) {
      docsOrfaos++;
    } else {
      docsPorLic.set(d.licitacao_id, (docsPorLic.get(d.licitacao_id) || 0) + 1);
    }
  });

  const licsSemDocs = lics.filter(l => !docsPorLic.has(l.id));

  console.log(`🔗 Licitações com pelo menos 1 anexo PDF: ${lics.length - licsSemDocs.length}`);
  console.log(`📂 Licitações sem anexos no momento (aguardando upload/R2): ${licsSemDocs.length}`);
  if (docsOrfaos === 0) {
    console.log("✅ Nenhum documento órfão (todos apontam para uma licitação válida)!");
  } else {
    console.warn(`❌ Documentos apontando para IDs inexistentes: ${docsOrfaos}`);
  }

  // 5. Verificar distribuição por Ano
  const porAno = new Map<number, number>();
  lics.forEach(l => {
    porAno.set(l.ano, (porAno.get(l.ano) || 0) + 1);
  });
  console.log("\n📅 Distribuição de Licitações por Ano:");
  Array.from(porAno.entries())
    .sort((a, b) => b[0] - a[0])
    .forEach(([ano, qtd]) => {
      console.log(`   - Ano ${ano}: ${qtd} processos`);
    });

  // 6. Verificar amostra de 2026 e 2025 para verificação visual
  console.log("\n📌 Amostra de Processos Recentes (2026):");
  lics
    .filter(l => l.ano === 2026)
    .slice(0, 8)
    .forEach(l => {
      const qtdDoc = docsPorLic.get(l.id) || 0;
      console.log(`   - Nº ${l.numero} | Mod: ${l.modalidade} | Origem: ${l.origem} | Docs: ${qtdDoc} | Abertura: ${l.data_abertura || "-"}`);
    });
}

verificarSaude().catch(console.error);
