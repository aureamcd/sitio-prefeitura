import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const destSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function main() {
  console.log("🧐 CONFERÊNCIA DETALHADA ANEXO POR ANEXO DOS 19 DOCUMENTOS ADICIONADOS:\n");

  const { data: cDocs, error } = await destSupabase
    .schema("transparencia")
    .from("contratos_documentos")
    .select("id, contrato_id, nome_arquivo, url_arquivo, caminho_r2, tipo_documento, contratos_v2(numero, ano, objeto)")
    .eq("origem", "MIGRACAO_PROJECT_BACKUP");

  if (error || !cDocs) {
    console.error("Erro ao buscar documentos:", error);
    return;
  }

  let inconsistencias = 0;

  for (let i = 0; i < cDocs.length; i++) {
    const doc = cDocs[i];
    const pai = (doc as any).contratos_v2 || {};
    const n = pai.numero;
    const a = pai.ano;
    const nome = doc.nome_arquivo || "";
    const url = doc.url_arquivo || "";

    // Verifica se o número e o ano aparecem no nome do arquivo ou na URL
    const nStr = n.toString().replace(/^0+/, "");
    const temNumero = nome.includes(nStr) || nome.includes(n) || url.includes(nStr) || url.includes(n);
    const temAno = nome.includes(a.toString()) || url.includes(a.toString());

    let status = "✅ CORRETO";
    if (!temNumero || !temAno) {
      status = "⚠️ VERIFICAR";
      inconsistencias++;
    }

    console.log(`[${i + 1}/19] ${status}`);
    console.log(`    Pai: Contrato nº ${n}/${a} | Objeto: ${(pai.objeto || "").substring(0, 60)}...`);
    console.log(`    Anexo: ${nome} | Tipo: ${doc.tipo_documento}`);
    console.log(`    URL/R2: ${url}\n`);
  }

  console.log(`📊 Resultado Final: ${cDocs.length - inconsistencias} perfeitamente alinhados, ${inconsistencias} para verificação manual.`);
}

main().catch(console.error);
