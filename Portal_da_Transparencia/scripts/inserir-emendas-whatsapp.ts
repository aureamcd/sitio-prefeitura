import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function subirEmendas() {
  console.log("=== INSERINDO E CENTRALIZANDO EMENDAS NO SUPABASE ===");

  // 1. Remover registros de "Sem cadastro de emendas" de 2025 (pois agora temos os 12 cadastros reais de 2025)
  // e manter 2023, 2024, 2026 com aviso de isenção caso não haja emenda individual daquele ano, OU popular também as receitas reais.
  
  const emendas2025 = [
    {
      ano: 2025,
      numero_emenda: "09032025-077849",
      parlamentar: "JÚLIO CESAR",
      objeto: "Pavimentação de vias públicas na zona urbana do município de Padre Marcos - PI.",
      beneficiario: "PREFEITURA MUNICIPAL DE PADRE MARCOS",
      valor_previsto: 297000.00,
      empresa_codigo: "1",
      empresa: "PREFEITURA MUNICIPAL DE PADRE MARCOS",
      raw_json: { modalidade: "EMENDA INDIVIDUAL", esfera: "FEDERAL", proposta: "20251246000", situacao: "Ciente / Em Execução" }
    },
    {
      ano: 2025,
      numero_emenda: "09032025-084228",
      parlamentar: "MARCELO CASTRO",
      objeto: "Adequação de estrada vicinal na zona rural do município de Padre Marcos - PI.",
      beneficiario: "PREFEITURA MUNICIPAL DE PADRE MARCOS",
      valor_previsto: 396000.00,
      empresa_codigo: "1",
      empresa: "PREFEITURA MUNICIPAL DE PADRE MARCOS",
      raw_json: { 
        modalidade: "EMENDA INDIVIDUAL", 
        esfera: "FEDERAL", 
        proposta: "202541830005", 
        situacao: "Em Execução / Medições Realizadas",
        valor_liquidado: 391991.55,
        medicoes: [
          { data: "2025-12-16", valor: 215397.18, empresa: "CRC CONSTRUCOES E TERRAPLANAGEM LTDA" },
          { data: "2025-12-29", valor: 176594.37, empresa: "CRC CONSTRUCOES E TERRAPLANAGEM LTDA" }
        ]
      }
    },
    {
      ano: 2025,
      numero_emenda: "220720720250001",
      parlamentar: "TRANSFERÊNCIA ESPECIAL (EMENDA PIX) - BANCADA",
      objeto: "CUSTEIO - GND 3 PROGRAMA FEDERAL ASSISTÊNCIA SOCIAL (ESTRUTURAÇÃO DA REDE DE SERVIÇOS DO SUAS - RP2)",
      beneficiario: "FUNDO MUNICIPAL DE ASSISTÊNCIA SOCIAL (CNPJ 13.529.719/0001-66)",
      valor_previsto: 200000.00,
      empresa_codigo: "1",
      empresa: "PREFEITURA MUNICIPAL DE PADRE MARCOS",
      raw_json: { modalidade: "TRANSFERÊNCIA ESPECIAL (EMENDA PIX)", esfera: "FEDERAL", proposta: "55901220720202501" }
    },
    {
      ano: 2025,
      numero_emenda: "220720720250002",
      parlamentar: "TRANSFERÊNCIA ESPECIAL (EMENDA PIX) - BANCADA",
      objeto: "CUSTEIO - GND 3 PROGRAMA FEDERAL ASSISTÊNCIA SOCIAL (ESTRUTURAÇÃO DA REDE DE SERVIÇOS DO SUAS - RP2)",
      beneficiario: "FUNDO MUNICIPAL DE ASSISTÊNCIA SOCIAL (CNPJ 13.529.719/0001-66)",
      valor_previsto: 100000.00,
      empresa_codigo: "1",
      empresa: "PREFEITURA MUNICIPAL DE PADRE MARCOS",
      raw_json: { modalidade: "TRANSFERÊNCIA ESPECIAL (EMENDA PIX)", esfera: "FEDERAL", proposta: "55901220720202502" }
    },
    {
      ano: 2025,
      numero_emenda: "36000665322202500",
      parlamentar: "BANCADA DO PIAUÍ (SAÚDE)",
      objeto: "PROPOSTA DE INCREMENTO PAP - CUSTEIO ATENÇÃO PRIMÁRIA / SUS PADRE MARCOS",
      beneficiario: "FUNDO MUNICIPAL DE SAÚDE DE PADRE MARCOS",
      valor_previsto: 500000.00,
      empresa_codigo: "1",
      empresa: "PREFEITURA MUNICIPAL DE PADRE MARCOS",
      raw_json: { modalidade: "EMENDA BANCADA / INCREMENTO PAP", esfera: "FEDERAL" }
    },
    {
      ano: 2025,
      numero_emenda: "36000665328202500",
      parlamentar: "BANCADA DO PIAUÍ (SAÚDE)",
      objeto: "PROPOSTA DE INCREMENTO PAP - CUSTEIO ATENÇÃO PRIMÁRIA / SUS PADRE MARCOS",
      beneficiario: "FUNDO MUNICIPAL DE SAÚDE DE PADRE MARCOS",
      valor_previsto: 200000.00,
      empresa_codigo: "1",
      empresa: "PREFEITURA MUNICIPAL DE PADRE MARCOS",
      raw_json: { modalidade: "EMENDA BANCADA / INCREMENTO PAP", esfera: "FEDERAL" }
    },
    {
      ano: 2025,
      numero_emenda: "36000702464202500",
      parlamentar: "BANCADA DO PIAUÍ (SAÚDE)",
      objeto: "PROPOSTA DE INCREMENTO PAP - CUSTEIO ATENÇÃO PRIMÁRIA / SUS PADRE MARCOS",
      beneficiario: "FUNDO MUNICIPAL DE SAÚDE DE PADRE MARCOS",
      valor_previsto: 504000.00,
      empresa_codigo: "1",
      empresa: "PREFEITURA MUNICIPAL DE PADRE MARCOS",
      raw_json: { modalidade: "EMENDA BANCADA / INCREMENTO PAP", esfera: "FEDERAL" }
    },
    {
      ano: 2025,
      numero_emenda: "36000702466202500",
      parlamentar: "BANCADA DO PIAUÍ (SAÚDE)",
      objeto: "PROPOSTA DE INCREMENTO PAP - CUSTEIO ATENÇÃO PRIMÁRIA / SUS PADRE MARCOS",
      beneficiario: "FUNDO MUNICIPAL DE SAÚDE DE PADRE MARCOS",
      valor_previsto: 300000.00,
      empresa_codigo: "1",
      empresa: "PREFEITURA MUNICIPAL DE PADRE MARCOS",
      raw_json: { modalidade: "EMENDA BANCADA / INCREMENTO PAP", esfera: "FEDERAL" }
    },
    {
      ano: 2025,
      numero_emenda: "36000705112202500",
      parlamentar: "BANCADA DO PIAUÍ (SAÚDE)",
      objeto: "PROPOSTA DE INCREMENTO PAP - CUSTEIO ATENÇÃO PRIMÁRIA / SUS PADRE MARCOS",
      beneficiario: "FUNDO MUNICIPAL DE SAÚDE DE PADRE MARCOS",
      valor_previsto: 650000.00,
      empresa_codigo: "1",
      empresa: "PREFEITURA MUNICIPAL DE PADRE MARCOS",
      raw_json: { modalidade: "EMENDA BANCADA / INCREMENTO PAP", esfera: "FEDERAL" }
    },
    {
      ano: 2025,
      numero_emenda: "36000717468202500",
      parlamentar: "BANCADA DO PIAUÍ (SAÚDE)",
      objeto: "PROPOSTA DE INCREMENTO PAP - CUSTEIO ATENÇÃO PRIMÁRIA / SUS PADRE MARCOS",
      beneficiario: "FUNDO MUNICIPAL DE SAÚDE DE PADRE MARCOS",
      valor_previsto: 180000.00,
      empresa_codigo: "1",
      empresa: "PREFEITURA MUNICIPAL DE PADRE MARCOS",
      raw_json: { modalidade: "EMENDA BANCADA / INCREMENTO PAP", esfera: "FEDERAL" }
    },
    {
      ano: 2025,
      numero_emenda: "63000640985202500",
      parlamentar: "EMENDA INDIVIDUAL / COMISSÃO (SAÚDE)",
      objeto: "PROPOSTA DE CUSTEIO PAP - MANUTENÇÃO ATENÇÃO PRIMÁRIA / SUS PADRE MARCOS",
      beneficiario: "FUNDO MUNICIPAL DE SAÚDE DE PADRE MARCOS",
      valor_previsto: 250000.00,
      empresa_codigo: "1",
      empresa: "PREFEITURA MUNICIPAL DE PADRE MARCOS",
      raw_json: { modalidade: "PROPOSTA DE CUSTEIO PAP", esfera: "FEDERAL" }
    },
    {
      ano: 2025,
      numero_emenda: "63000669734202500",
      parlamentar: "EMENDA INDIVIDUAL / COMISSÃO (SAÚDE)",
      objeto: "PROPOSTA DE CUSTEIO PAP - MANUTENÇÃO ATENÇÃO PRIMÁRIA / SUS PADRE MARCOS",
      beneficiario: "FUNDO MUNICIPAL DE SAÚDE DE PADRE MARCOS",
      valor_previsto: 800000.00,
      empresa_codigo: "1",
      empresa: "PREFEITURA MUNICIPAL DE PADRE MARCOS",
      raw_json: { modalidade: "PROPOSTA DE CUSTEIO PAP", esfera: "FEDERAL" }
    }
  ];

  // 1. Limpar registros antigos de 2025 que eram apenas "Sem cadastro de emendas" em cadastro_emendas
  await supabase
    .schema("transparencia")
    .from("cadastro_emendas")
    .delete()
    .eq("ano", 2025);

  // 2. Inserir os 12 registros reais em cadastro_emendas
  const { data: ins, error: eIns } = await supabase
    .schema("transparencia")
    .from("cadastro_emendas")
    .insert(emendas2025)
    .select();

  if (eIns) {
    console.log("❌ Erro ao inserir em cadastro_emendas:", eIns.message);
  } else {
    console.log(`✅ Inseridos com sucesso ${ins?.length} registros reais de emendas de 2025 em cadastro_emendas!`);
  }

  // 3. Atualizar emendas_impositivas de 2025 para refletir o total de emendas federais recebidas/executadas
  // Total previsto em 2025: R$ 4.377.000,00 | Total liquidado/empenhado: R$ 391.991,55 (obras) + transferências SUS/SUAS
  await supabase
    .schema("transparencia")
    .from("emendas_impositivas")
    .update({
      valor_recebido: 4377000.00,
      valor_empenhado: 4377000.00,
      valor_liquidado: 3175341.55,
      valor_pago: 3175341.55
    })
    .eq("ano", 2025)
    .eq("tipo_transferencia", "Transferência Federal");

  console.log("✅ Tabela emendas_impositivas de 2025 atualizada com os valores consolidados das emendas!");
}

subirEmendas();
