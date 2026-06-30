import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Credenciais do Supabase não encontradas no .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function extrairModalidade(caminho: string, nome: string, modalidadeAtual?: string | null): string {
  const texto = `${caminho || ''} ${nome || ''}`.toUpperCase();
  if (texto.includes("CONCORR")) return "Concorrência";
  if (texto.includes("DISPENSA")) return "Dispensa";
  if (texto.includes("INEXIGIBILIDADE")) return "Inexigibilidade";
  if (texto.includes("LEIL")) return "Leilão";
  if (texto.includes("ADES")) return "Adesão";
  if (texto.includes("CREDENCIAMENTO")) return "Credenciamento";
  if (texto.includes("CONVITE")) return "Convite";
  if (texto.includes("CHAMADA")) return "Chamada Pública";
  if (texto.includes("TOMADA")) return "Tomada de Preços";
  if (texto.includes("PREG")) return "Pregão";
  
  if (modalidadeAtual && modalidadeAtual.trim() !== '') {
    return modalidadeAtual;
  }
  return "Pregão";
}

function extrairNumeroAno(caminho: string, nome: string): { numero: string; ano: number } | null {
  const texto = `${caminho || ''} ${nome || ''}`;
  // Busca NNN/AAAA ou NNN-AAAA ou NNN.AAAA ou NNN_AAAA
  let match = texto.match(/(\d{1,4})\s*[\-\/\_\.]\s*(201\d|202\d)/);
  if (!match) {
    match = texto.match(/(?:N[º°]?\s*|\b)(\d{1,4})\b.*?(201\d|202\d)/i);
  }
  if (match) {
    const num = parseInt(match[1], 10).toString().padStart(3, '0');
    const ano = parseInt(match[2], 10);
    return { numero: `${num}/${ano}`, ano };
  }
  return null;
}

function extrairTipoDocumento(nome: string, tipoAtual?: string | null): string {
  const upper = nome.toUpperCase();
  if (upper.includes("EDITAL")) return "Edital";
  if (upper.includes("HOMOLOGA")) return "Homologação";
  if (upper.includes("ATA")) return "Ata";
  if (upper.includes("AVISO")) return "Aviso";
  if (upper.includes("TERMO DE REFER")) return "Termo de Referência";
  if (upper.includes("RELATÓRIO DE DISPUTA") || upper.includes("RELATORIO DE DISPUTA")) return "Relatório de Disputa";
  if (upper.includes("JUSTIFICATIVA")) return "Justificativa";
  if (upper.includes("CONTRATO")) return "Contrato";
  
  if (tipoAtual && tipoAtual !== "A CLASSIFICAR") return tipoAtual;
  return "Anexo";
}

async function main() {
  console.log("🚀 Iniciando reorganização e higienização das licitações no Supabase (Sem alterar R2)...");

  // 1. Remover arquivos de sistema inúteis (.ini)
  const { data: arqsInuteis } = await supabase
    .schema("transparencia")
    .from("licitacoes_documentos")
    .select("id, nome_arquivo")
    .ilike("nome_arquivo", "%.ini%");

  if (arqsInuteis && arqsInuteis.length > 0) {
    console.log(`🗑️ Removendo ${arqsInuteis.length} arquivos inúteis de sistema (.ini)...`);
    const ids = arqsInuteis.map(a => a.id);
    await supabase.schema("transparencia").from("licitacoes_documentos").delete().in("id", ids);
  }

  // 2. Carregar todos os documentos restantes
  const { data: documentos, error: errDocs } = await supabase
    .schema("transparencia")
    .from("licitacoes_documentos")
    .select("*");

  if (errDocs || !documentos) {
    console.error("❌ Erro ao buscar documentos:", errDocs);
    return;
  }

  // Carregar licitações existentes
  const { data: licitacoes } = await supabase
    .schema("transparencia")
    .from("licitacoes_v2")
    .select("*");

  const licitacoesMap = new Map<string, any>();
  (licitacoes || []).forEach(lic => {
    const chave = `${lic.numero}_${lic.ano}_${lic.modalidade}`.toUpperCase();
    licitacoesMap.set(chave, lic);
  });

  let corrigidos = 0;
  let criados = 0;

  for (const doc of documentos) {
    const mod = extrairModalidade(doc.caminho_r2 || '', doc.nome_arquivo || '', doc.modalidade);
    const numAno = extrairNumeroAno(doc.caminho_r2 || '', doc.nome_arquivo || '');
    const tipo = extrairTipoDocumento(doc.nome_arquivo || '', doc.tipo_documento);

    let targetLicId = doc.licitacao_id;

    if (numAno) {
      const chave = `${numAno.numero}_${numAno.ano}_${mod}`.toUpperCase();
      let lic = licitacoesMap.get(chave);

      if (!lic) {
        // Verificar se existe com número sem zero à esquerda
        const numSemZero = parseInt(numAno.numero.split('/')[0], 10) + '/' + numAno.ano;
        const chaveSemZero = `${numSemZero}_${numAno.ano}_${mod}`.toUpperCase();
        lic = licitacoesMap.get(chaveSemZero);
      }

      if (!lic) {
        // Criar licitação correta com essa modalidade
        const novaLic = {
          numero: numAno.numero,
          ano: numAno.ano,
          modalidade: mod,
          objeto: `${mod.toUpperCase()} Nº ${numAno.numero} - Processo Licitatório do Município de Padre Marcos - PI.`,
          situacao: "Finalizada",
          possui_edital: tipo === "Edital",
          possui_ata: tipo === "Ata",
          possui_homologacao: tipo === "Homologação"
        };

        const { data: licCriada, error: errCriar } = await supabase
          .schema("transparencia")
          .from("licitacoes_v2")
          .insert([novaLic])
          .select()
          .single();

        if (errCriar) {
          console.error(`❌ Erro ao criar licitação ${chave}:`, errCriar.message);
        } else if (licCriada) {
          lic = licCriada;
          const novaChave = `${licCriada.numero}_${licCriada.ano}_${licCriada.modalidade}`.toUpperCase();
          licitacoesMap.set(novaChave, lic);
          criados++;
        }
      }

      if (lic) {
        targetLicId = lic.id;
        // Atualizar flags booleanas na licitação se encontrarmos documentos importantes
        const updateFlags: any = {};
        if (tipo === "Edital" && lic.possui_edital !== true) updateFlags.possui_edital = true;
        if (tipo === "Ata" && lic.possui_ata !== true) updateFlags.possui_ata = true;
        if (tipo === "Homologação" && lic.possui_homologacao !== true) updateFlags.possui_homologacao = true;

        if (Object.keys(updateFlags).length > 0) {
          await supabase.schema("transparencia").from("licitacoes_v2").update(updateFlags).eq("id", lic.id);
        }
      }
    }

    // Atualizar documento no banco se algo mudou
    if (targetLicId !== doc.licitacao_id || mod !== doc.modalidade || tipo !== doc.tipo_documento) {
      const updateData: any = {
        licitacao_id: targetLicId,
        modalidade: mod,
        tipo_documento: tipo
      };

      await supabase
        .schema("transparencia")
        .from("licitacoes_documentos")
        .update(updateData)
        .eq("id", doc.id);

      corrigidos++;
    }
  }

  console.log(`✅ Concluído! Novas licitações criadas: ${criados} | Documentos realocados/corrigidos: ${corrigidos}`);

  // 3. Unificar duplicatas: quando houver número repetido, manter a que tem objeto/informações completas e transferir todos os documentos para ela
  console.log("🔗 Unificando licitações repetidas (mantendo a mais completa)...");
  const { data: todasLicsFull } = await supabase.schema("transparencia").from("licitacoes_v2").select("*");
  const grupos = new Map<string, any[]>();
  (todasLicsFull || []).forEach(l => {
    const k = `${(l.numero || '').trim()}___${l.ano}___${(l.modalidade || 'Pregão').trim()}`.toUpperCase();
    if (!grupos.has(k)) grupos.set(k, []);
    grupos.get(k)!.push(l);
  });

  let unificadas = 0;
  for (const [k, list] of grupos.entries()) {
    if (list.length > 1) {
      // Ordena colocando em primeiro a que tem o maior/melhor objeto ou valor estimado
      list.sort((a, b) => {
        const scoreA = (a.objeto?.length || 0) + (a.valor_estimado ? 50 : 0);
        const scoreB = (b.objeto?.length || 0) + (b.valor_estimado ? 50 : 0);
        return scoreB - scoreA;
      });

      const principal = list[0];
      const duplicadas = list.slice(1);
      const dupIds = duplicadas.map(d => d.id);

      // Transfere todos os documentos das duplicadas para a principal
      await supabase.schema("transparencia").from("licitacoes_documentos").update({ licitacao_id: principal.id }).in("licitacao_id", dupIds);

      // Preserva flags de edital/ata/homologacao se alguma tiver
      const possuiEdital = list.some(l => l.possui_edital === true);
      const possuiAta = list.some(l => l.possui_ata === true);
      const possuiHom = list.some(l => l.possui_homologacao === true);
      await supabase.schema("transparencia").from("licitacoes_v2").update({
        possui_edital: possuiEdital,
        possui_ata: possuiAta,
        possui_homologacao: possuiHom
      }).eq("id", principal.id);

      // Exclui as duplicadas que ficaram vazias
      await supabase.schema("transparencia").from("licitacoes_v2").delete().in("id", dupIds);
      unificadas += duplicadas.length;
    }
  }
  console.log(`✨ Duplicatas unificadas e removidas: ${unificadas}`);

  // 4. Limpar licitações órfãs/vazias que NÃO sejam oficiais do TCE (criadas por erro sem documento)
  console.log("🧹 Verificando licitações vazias não-oficiais...");
  const { data: todasLics } = await supabase.schema("transparencia").from("licitacoes_v2").select("id, origem");
  const { data: todosDocs } = await supabase.schema("transparencia").from("licitacoes_documentos").select("licitacao_id");

  const docsPorLic = new Set((todosDocs || []).map(d => d.licitacao_id));
  const licsVazias = (todasLics || []).filter(l => !docsPorLic.has(l.id) && l.origem !== "TCE-PI");

  if (licsVazias.length > 0) {
    console.log(`🗑️ Removendo ${licsVazias.length} licitações não-oficiais sem nenhum documento vinculado...`);
    const vaziasIds = licsVazias.map(l => l.id);
    await supabase.schema("transparencia").from("licitacoes_v2").delete().in("id", vaziasIds);
  }

  console.log("🎉 Reorganização e unificação finalizadas com sucesso!");
}

main().catch(console.error);
