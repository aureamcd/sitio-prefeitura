// o que o pntp quer: Para estruturar perfeitamente o seu card de Convênios e Transferências (Dimensão 5), a regra fundamental da cartilha do PNTP 2026 é que os dados de repasses recebidos e concedidos não fiquem misturados
// .
// Portanto, o ideal é criar 3 abas (ou submenus) dentro deste card. Abaixo detalho quais são elas, os filtros e as colunas obrigatórias para cada uma em formato de tabela:
// Aba 1: Transferências Recebidas (Critério 5.1)
// Aqui ficarão os convênios em que a Prefeitura recebeu dinheiro (do Estado ou da União, por exemplo).
// Filtros obrigatórios: No mínimo, a consulta por exercício (ano)
// .
// Colunas da tabela:
// Origem (Órgão ou Poder repassador dos recursos)
// .
// Número/ano do convênio (ou termo/ajuste)
// .
// Objeto do convênio
// .
// Vigência do convênio
// .
// Valor total previsto
// .
// Valores já recebidos
// .
// Link para o inteiro teor do instrumento (o PDF do contrato)
// .
// Aba 2: Transferências Realizadas (Critério 5.2)
// Atenção: A cartilha exige que esta aba seja gerada de forma separada e autônoma da aba de recebimentos
// . Aqui ficarão os recursos que a Prefeitura repassou para terceiros (ONGs, associações, fundações, etc.).
// Filtros obrigatórios: No mínimo, a consulta por exercício (ano)
// .
// Colunas da tabela:
// Nome do beneficiário
// .
// Número/ano do convênio (ou termo/ajuste)
// .
// Objeto do convênio/repasse
// .
// Vigência do convênio
// .
// Valor total previsto para o repasse
// .
// Valores já repassados (concedidos)
// .
// Link para o inteiro teor do instrumento (o PDF)
// .
// Aba 3: Acordos sem Transferência de Recursos (Critério 5.3)
// Aqui entram os acordos de cooperação técnica, termos de parceria ou ajustes onde não há dinheiro envolvido de nenhuma das partes.
// Filtros obrigatórios: No mínimo, a consulta por exercício (ano)
// .
// Colunas da tabela:
// Nome das partes
// .
// Número/ano do convênio (ou termo/ajuste)
// .
// Objeto do convênio
// .
// Vigência
// .
// Link para o inteiro teor do instrumento (o PDF)
// .
// Nota: As "obrigações ajustadas" também são exigidas, mas a cartilha aceita que elas fiquem dentro do PDF, desde que o acesso seja fácil
// .

// TABELAS SUPABASE:
//
// create table transparencia.transferencias_resumo (
//   id uuid not null default gen_random_uuid (),
//   ano integer not null,
//   empresa_codigo text null,
//   empresa text null,
//   mes integer null,
//   entidade_pagadora text null,
//   entidade_recebedora text null,
//   cnpj_pagadora text null,
//   cnpj_recebedora text null,
//   valor_previsto numeric(14, 2) null,
//   valor_repasse numeric(14, 2) null,
//   valor_devolucao numeric(14, 2) null,
//   raw_json jsonb null,
//   created_at timestamp without time zone null default now(),
//   constraint transferencias_resumo_pkey primary key (id)
// ) TABLESPACE pg_default;
//
// create table transparencia.emendas_impositivas (
//   id uuid not null default gen_random_uuid (),
//   ano integer not null,
//   empresa_codigo text null,
//   empresa text null,
//   tipo_transferencia text null,
//   valor_recebido numeric(14, 2) null,
//   valor_aplicacao_financeira numeric(14, 2) null,
//   valor_empenhado numeric(14, 2) null,
//   valor_liquidado numeric(14, 2) null,
//   valor_pago numeric(14, 2) null,
//   raw_json jsonb null,
//   created_at timestamp without time zone null default now(),
//   constraint emendas_impositivas_pkey primary key (id)
// ) TABLESPACE pg_default;
//
// create table transparencia.cadastro_emendas (
//   id uuid not null default gen_random_uuid (),
//   ano integer not null,
//   empresa_codigo text null,
//   empresa text null,
//   numero_emenda text null,
//   parlamentar text null,
//   objeto text null,
//   beneficiario text null,
//   valor_previsto numeric(14, 2) null,
//   pdf_url text null,
//   raw_json jsonb null,
//   created_at timestamp without time zone null default now(),
//   constraint cadastro_emendas_pkey primary key (id)
// ) TABLESPACE pg_default;
// 
// apis: Transferências
// Transferências entre Entidades
// GET
// /VersaoJson/Transferencias/?ConectarExercicio={ConectarExercicio}&Listagem=Transf&Empresa={Entidade}&MostraDadosConsolidado={MostrarDadosTodasEntidades}
// Ex: http://siteDaEntidade.uf.gov.br/Transparencia/VersaoJson/Transferencias/?ConectarExercicio=2026&Listagem=Transf&Empresa=1&MostraDadosConsolidado=False
// Emendas Impositivas (art. 166-A da CF) - Buscando dos Empenhos e das Receitas com base no código STN
// GET
// /VersaoJson/Transferencias/?ConectarExercicio={ConectarExercicio}&Listagem=EmendasImpositivasArt166A&Empresa={Entidade}&MostraDadosConsolidado={MostrarDadosTodasEntidades}
// Ex: http://siteDaEntidade.uf.gov.br/Transparencia/VersaoJson/Transferencias/?ConectarExercicio=2026&Listagem=EmendasImpositivasArt166A&Empresa=1&MostraDadosConsolidado=False
// Emendas Impositivas (art. 166-A da CF) - Buscando do Cadastro das Emendas
// GET
// /VersaoJson/Transferencias/?ConectarExercicio={ConectarExercicio}&Listagem=CadEmendasImpositivas&Empresa={Entidade}&MostraDadosConsolidado={MostrarDadosTodasEntidades}
// Ex: http://siteDaEntidade.uf.gov.br/Transparencia/VersaoJson/Transferencias/?ConectarExercicio=2026&Listagem=CadEmendasImpositivas&Empresa=1&MostraDadosConsolidado=False

// exemplo de json de cada:
// [
//   {
//     "MES": "1",
//     "ENTIDADE_PAGADORA": "PREFEITURA MUNICIPAL DE PADRE MARCOS",
//     "ENTIDADE_RECEBEDORA": "CAMARA MUNICIPAL DE PADRE MARCOS",
//     "CNPJPAGADORA": "06.553.788/0001-40",
//     "CNPJRECEBEDORA": "35.127.463/0001-01",
//     "REPASSE": "110000",
//     "DEVOLUCAO": "0",
//     "ENTIDADEDESTINO": "2",
//     "PREVISTO": "139245,83"
//   },[
//   {
//     "TIPOTRANSF": "Transferência Estadual",
//     "RECTRANSF": "0",
//     "RECAPLICACAOFINAN": "0",
//     "EMPENHADO": "0",
//     "LIQUIDADO": "0",
//     "PAGO": "0"
//   },
//   {
//     "TIPOTRANSF": "Transferência Federal ",
//     "RECTRANSF": "0",
//     "RECAPLICACAOFINAN": "759,93",
//     "EMPENHADO": "0",
//     "LIQUIDADO": "0",
//     "PAGO": "0"
//   }
// ]

// terceiro: []

// lembre-se das regrinhas das empresas, precisar ter de cada uma, mesmo que seja zero, para mostrar na tabela. de 2023 pra caches

/**
 * importar-transferencias.ts
 *
 * IMPORTA:
 * - transferencias_resumo
 * - emendas_impositivas
 * - cadastro_emendas
 *
 * PERÍODO:
 * 2023 até atual
 *
 * ENTIDADES:
 * busca automaticamente da tabela:
 * transparencia.entidades
 *
 * USO:
 * npx tsx scripts/transferencias/importar-transferencias.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * SUPABASE
 */

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * CONFIG
 */

const BASE =
  "https://transparencia.padremarcos.pi.gov.br/Transparencia/VersaoJson/Transferencias/";

const ANOS = [2023, 2024, 2025, 2026];

/**
 * HELPERS
 */

function limparTexto(valor: any): string | null {
  if (
    valor === undefined ||
    valor === null ||
    valor === ""
  ) {
    return null;
  }

  return String(valor)
    .normalize("NFC")
    .replace(/\s+/g, " ")
    .trim();
}

function converterNumero(valor: any): number {
  if (!valor) return 0;

  const numero = Number(
    String(valor)
      .replace(/\./g, "")
      .replace(",", ".")
      .trim()
  );

  return isNaN(numero) ? 0 : numero;
}

/**
 * BUSCAR ENTIDADES
 */

async function buscarEntidades() {
  const { data, error } = await supabase
    .schema("transparencia")
    .from("empresas")
    .select("*")
    .order("codigo");

  if (error) {
    throw error;
  }

  return data || [];
}

/**
 * IMPORTAR TRANSFERÊNCIAS
 */

async function importarTransferencias(
  ano: number,
  entidade: any
) {
  console.log(
    `\n📦 TRANSFERÊNCIAS ${ano}`
  );

  const params = new URLSearchParams({
    ConectarExercicio: String(ano),
    Listagem: "Transf",
    Empresa: String(entidade.codigo),
    MostraDadosConsolidado: "False",
  });

  const url = `${BASE}?${params}`;

  console.log(`📡 ${url}`);

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(120000)
    });

    if (!response.ok) {
      console.log(`⚠️ HTTP ${response.status}`);
      return;
    }

    const json = await response.json();

    if (!Array.isArray(json)) {
      console.log("⚠️ retorno inválido");
      return;
    }

    console.log(`📦 ${json.length} registros`);

    const registros: any[] = json.map((item: any) => ({
      ano,
      empresa_codigo: entidade.codigo,
      empresa: entidade.nome,
      mes: Number(item.MES || 0),
      entidade_pagadora: limparTexto(item.ENTIDADE_PAGADORA),
      entidade_recebedora: limparTexto(item.ENTIDADE_RECEBEDORA),
      cnpj_pagadora: limparTexto(item.CNPJPAGADORA),
      cnpj_recebedora: limparTexto(item.CNPJRECEBEDORA),
      valor_previsto: converterNumero(item.PREVISTO),
      valor_repasse: converterNumero(item.REPASSE),
      valor_devolucao: converterNumero(item.DEVOLUCAO),
      raw_json: item,
    }));

    if (registros.length === 0) {
      registros.push({
        ano,
        empresa_codigo: entidade.codigo,
        empresa: entidade.nome,
        mes: null,
        entidade_pagadora: null,
        entidade_recebedora: null,
        cnpj_pagadora: null,
        cnpj_recebedora: null,
        valor_previsto: 0,
        valor_repasse: 0,
        valor_devolucao: 0,
        raw_json: { aviso: "Sem transferências no período" },
      });
    }

    // batch insert de 200 em 200
    const BATCH_SIZE = 200;
    for (let i = 0; i < registros.length; i += BATCH_SIZE) {
      const batch = registros.slice(i, i + BATCH_SIZE);
      const { error: err } = await supabase
        .schema("transparencia")
        .from("transferencias_resumo")
        .insert(batch);
      if (err) {
        console.error(`❌ transferencias_resumo [lote ${i / BATCH_SIZE + 1}]:`, err.message);
        return;
      }
    }
    console.log(`✅ transferencias_resumo: ${registros.length} registros`);
  } catch (error) {
    console.error(
      `❌ erro transferencias ${ano}:`,
      error
    );
  }
}

/**
 * IMPORTAR EMENDAS
 */

async function importarEmendas(
  ano: number,
  entidade: any
) {
  console.log(
    `\n📦 EMENDAS ${ano}`
  );

  const params = new URLSearchParams({
    ConectarExercicio: String(ano),
    Listagem:
      "EmendasImpositivasArt166A",
    Empresa: String(entidade.codigo),
    MostraDadosConsolidado: "False",
  });

  const url = `${BASE}?${params}`;

  console.log(`📡 ${url}`);

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(120000)
    });

    if (!response.ok) {
      console.log(`⚠️ HTTP ${response.status}`);
      return;
    }

    const json = await response.json();

    if (!Array.isArray(json)) {
      console.log("⚠️ retorno inválido");
      return;
    }

    console.log(`📦 ${json.length} registros`);

    const registros = json.map((item: any) => ({
      ano,
      empresa_codigo: entidade.codigo,
      empresa: entidade.nome,
      tipo_transferencia: limparTexto(item.TIPOTRANSF),
      valor_recebido: converterNumero(item.RECTRANSF),
      valor_aplicacao_financeira: converterNumero(item.RECAPLICACAOFINAN),
      valor_empenhado: converterNumero(item.EMPENHADO),
      valor_liquidado: converterNumero(item.LIQUIDADO),
      valor_pago: converterNumero(item.PAGO),
      raw_json: item,
    }));

    if (registros.length === 0) {
      registros.push({
        ano,
        empresa_codigo: entidade.codigo,
        empresa: entidade.nome,
        tipo_transferencia: "SEM MOVIMENTAÇÃO",
        valor_recebido: 0,
        valor_aplicacao_financeira: 0,
        valor_empenhado: 0,
        valor_liquidado: 0,
        valor_pago: 0,
        raw_json: { aviso: "Sem emendas no período" },
      });
    }

    // batch insert de 200 em 200
    const BATCH_SIZE = 200;
    for (let i = 0; i < registros.length; i += BATCH_SIZE) {
      const batch = registros.slice(i, i + BATCH_SIZE);
      const { error: err } = await supabase
        .schema("transparencia")
        .from("emendas_impositivas")
        .insert(batch);
      if (err) {
        console.error(`❌ emendas_impositivas [lote ${i / BATCH_SIZE + 1}]:`, err.message);
        return;
      }
    }
    console.log(`✅ emendas_impositivas: ${registros.length} registros`);
  } catch (error) {
    console.error(
      `❌ erro emendas ${ano}:`,
      error
    );
  }
}

/**
 * IMPORTAR CADASTRO EMENDAS
 */

async function importarCadastroEmendas(
  ano: number,
  entidade: any
) {
  console.log(
    `\n📦 CADASTRO EMENDAS ${ano}`
  );

  const params = new URLSearchParams({
    ConectarExercicio: String(ano),
    Listagem:
      "CadEmendasImpositivas",
    Empresa: String(entidade.codigo),
    MostraDadosConsolidado: "False",
  });

  const url = `${BASE}?${params}`;

  console.log(`📡 ${url}`);

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(120000)
    });

    if (!response.ok) {
      console.log(`⚠️ HTTP ${response.status}`);
      return;
    }

    const json = await response.json();

    if (!Array.isArray(json)) {
      console.log("⚠️ retorno inválido");
      return;
    }

    console.log(`📦 ${json.length} registros`);

    const registros = json.map((item: any) => ({
      ano,
      empresa_codigo: entidade.codigo,
      empresa: entidade.nome,
      numero_emenda: limparTexto(item.NUMEROEMENDA),
      parlamentar: limparTexto(item.PARLAMENTAR),
      objeto: limparTexto(item.OBJETO),
      beneficiario: limparTexto(item.BENEFICIARIO),
      valor_previsto: converterNumero(item.VALOR),
      pdf_url: limparTexto(item.PDF),
      raw_json: item,
    }));

    if (registros.length === 0) {
      registros.push({
        ano,
        empresa_codigo: entidade.codigo,
        empresa: entidade.nome,
        numero_emenda: null,
        parlamentar: null,
        objeto: null,
        beneficiario: null,
        valor_previsto: 0,
        pdf_url: null,
        raw_json: { aviso: "Sem cadastro de emendas" },
      });
    }

    // batch insert de 200 em 200
    const BATCH_SIZE = 200;
    for (let i = 0; i < registros.length; i += BATCH_SIZE) {
      const batch = registros.slice(i, i + BATCH_SIZE);
      const { error: err } = await supabase
        .schema("transparencia")
        .from("cadastro_emendas")
        .insert(batch);
      if (err) {
        console.error(`❌ cadastro_emendas [lote ${i / BATCH_SIZE + 1}]:`, err.message);
        return;
      }
    }
    console.log(`✅ cadastro_emendas: ${registros.length} registros`);
  } catch (error) {
    console.error(
      `❌ erro cadastro emendas ${ano}:`,
      error
    );
  }
}

/**
 * EXECUÇÃO
 */

async function executar() {
  console.log(
    "🚀 IMPORTAÇÃO TRANSFERÊNCIAS"
  );

  const entidades =
    await buscarEntidades();

  for (const entidade of entidades) {
    console.log(
      `\n🏛️ ${entidade.codigo} - ${entidade.nome}`
    );

    for (const ano of ANOS) {
      await importarTransferencias(
        ano,
        entidade
      );

      await importarEmendas(
        ano,
        entidade
      );

      await importarCadastroEmendas(
        ano,
        entidade
      );
    }
  }

  console.log("\n🎉 FINALIZADO");
}

executar();