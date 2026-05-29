// // /**
// //  * importar-pessoal.ts
// //  *
// //  * IMPORTA:
// //  * - servidores
// //  * - estagiarios
// //  * - terceirizados
// //  *
// //  * PERÍODO:
// //  * 2023 até atual
// //  * 
// //  * o qu vem na api:
// //  * 
// //  * [
// //   {
// //     "EMPRESA": "001",
// //     "REGISTRO": "010294",
// //     "REFERENCIA": "513",
// //     "REFERENCIA_NOME": "Folha Mensal - Janeiro",
// //     "ID": "848",
// //     "CONTRATO": "1",
// //     "NOME": " IVONILDO SOUSA CARDEAL",
// //     "NOME_SOCIAL": "",
// //     "DIVISAO": "SECRETARIA MUNICIPAL DE EDUCAÇÃO",
// //     "SUBDIVISAO": "FUNDO DE MANUT. E DEC.DA EDUC.BASICA-FUNDEB",
// //     "UNIDADE": "SME- DEPTOR ADM FUNDEB 30 % VI - COMISSIONADOS",
// //     "CARGO": "ASSESSOR TÉCNICO",
// //     "VINCULO": "COMISSIONADOS",
// //     "CATEGORIAFUNCIONAL": "",
// //     "DATAADMISSAO": "01/01/2026 00:00:00",
// //     "DATADESLIGAMENTO": "",
// //     "REFSALATUAL": "0003",
// //     "NOMEREFSALATUAL": "SALARIO MINIMO",
// //     "ATOADMISSAO": "",
// //     "ATODEMISSAO": "",
// //     "DATAADMISSAOCOMISSAO": "",
// //     "ATOADMISSAOCOMISSAO": "",
// //     "PROVENTOS": "1621",
// //     "DESCONTOS": "121,57",
// //     "NATUREZA": "2 - Comissão",
// //     "FORMAPROVIMENTO": "TEMPO DETERMINADO",
// //     "NUMDOCCRIACAOCARGO": "",
// //     "TIPOREGIME": "REGIME GERAL  ",
// //     "SITUACAOFUNCIONAL": "2 - Função de Confiança",
// //     "HORASEMANAL": "40",
// //     "TIPOCONTRATO": "Função de Confiança",
// //     "DTTERMINO": "",
// //     "CPF": "-",
// //     "CPFFORMATADO": "272.XXX.XXX-51",
// //     "CARGOINICIO": "ASSESSOR TÉCNICO",
// //     "ATIVIDADE": "",
// //     "NOMEATIVIDADE": "",
// //     "LOCALDETRABALHO": "",
// //     "VALOR_HE": "",
// //     "VALORINICIALCARGO": "",
// //     "LIQUIDO + (IsNull(PROVENTOS, 0)-IsNull(DESCONTOS,0))": "1499,43"
// //   },
// //  *
// //  * TABELAS:
// //  create table transparencia.servidores (
//   id uuid not null default gen_random_uuid (),
//   matricula text null,
//   nome text not null,
//   cargo text null,
//   funcao text null,
//   vinculo text null,
//   lotacao text null,
//   secretaria text null,
//   carga_horaria text null,
//   data_admissao date null,
//   data_desligamento date null,
//   situacao text null,
//   ativo boolean null default true,
//   raw_json jsonb null,
//   created_at timestamp without time zone null default now(),
//   updated_at timestamp without time zone null default now(),
//   constraint servidores_pkey primary key (id),
//   constraint servidores_matricula_key unique (matricula)
// ) TABLESPACE pg_default;

// //  * transparencia.estagiarios

// // create table transparencia.estagiarios (
// //   id uuid not null default gen_random_uuid (),
// //   nome text null,
// //   curso text null,
// //   instituicao text null,
// //   data_inicio date null,
// //   data_fim date null,
// //   ano integer null,
// //   raw_json jsonb null,
// //   created_at timestamp without time zone null default now(),
// //   constraint estagiarios_pkey primary key (id)
// // ) TABLESPACE pg_default;
// //  * transparencia.terceirizados
// //  * 
// //  * create table transparencia.terceirizados (
// //   id uuid not null default gen_random_uuid (),
// //   nome text null,
// //   funcao text null,
// //   empresa text null,
// //   cnpj_empresa text null,
// //   data_inicio date null,
// //   data_fim date null,
// //   ano integer null,
// //   raw_json jsonb null,
// //   created_at timestamp without time zone null default now(),
// //   constraint terceirizados_pkey primary key (id)
// // ) TABLESPACE pg_default;

// // create table transparencia.remuneracoes (
//   id uuid not null default gen_random_uuid (),
//   ano integer not null,
//   mes integer not null,
//   matricula text not null,
//   nome text null,
//   cargo text null,
//   funcao text null,
//   vinculo text null,
//   lotacao text null,
//   secretaria text null,
//   carga_horaria text null,
//   remuneracao_bruta numeric(14, 2) null,
//   descontos numeric(14, 2) null,
//   remuneracao_liquida numeric(14, 2) null,
//   raw_json jsonb null,
//   created_at timestamp without time zone null default now(),
//   constraint remuneracoes_pkey primary key (id),
//   constraint remuneracoes_unique unique (matricula, ano, mes)
// ) TABLESPACE pg_default;
// //  *
// //  * USO:
// //  * npx tsx scripts/sync-api/importar-pessoal.ts
// //  */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BASE =
    "https://transparencia.padremarcos.pi.gov.br/Transparencia/VersaoJson/Pessoal/";

const ANOS = [2023, 2024, 2025, 2026];

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

function converterNumero(valor: any): number | null {
    if (!valor) return null;

    const numero = Number(
        String(valor)
            .replace(/\./g, "")
            .replace(",", ".")
            .trim()
    );

    return isNaN(numero) ? null : numero;
}

function obterTipoFolha(referenciaNome: any): string {
    if (!referenciaNome) return "Folha Mensal";
    const texto = String(referenciaNome).trim();
    if (texto.includes(" - ")) {
        return texto.split(" - ")[0].trim();
    }
    return texto;
}

function converterData(valor: any): string | null {
    if (!valor) return null;

    try {
        const texto = String(valor).trim();

        /**
         * Ex:
         * 01/01/2026 00:00:00
         */

        if (texto.includes("/")) {
            const apenasData = texto.split(" ")[0];

            const [dia, mes, ano] =
                apenasData.split("/");

            return `${ano}-${mes.padStart(
                2,
                "0"
            )}-${dia.padStart(2, "0")}`;
        }

        return null;
    } catch {
        return null;
    }
}

function ehEstagiario(item: any) {
    const texto = JSON.stringify(item).toUpperCase();

    return texto.includes("ESTAGI");
}

function ehTerceirizado(item: any) {
    const texto = JSON.stringify(item).toUpperCase();

    return (
        texto.includes("TERCEIR") ||
        texto.includes("PRESTADOR")
    );
}

/**
 * IMPORTAÇÃO
 */

async function importarMes(
    ano: number,
    mes: number,
    entidade: any
) {
    console.log(
        `\n📅 ${ano}/${String(mes).padStart(2, "0")} - ${entidade.codigo} - ${entidade.nome}`
    );

    const params = new URLSearchParams({
        ConectarExercicio: String(ano),
        Listagem: "Servidores",
        Empresa: String(entidade.codigo),
        Ano: String(ano),
        DiaInicioPeriodo: "01",
        MesInicialPeriodo: String(mes).padStart(2, "0"),
        DiaFinalPeriodo: "31",
        MesFinalPeriodo: String(mes).padStart(2, "0"),
        MostraDadosConsolidado: "False",
    });

    const url = `${BASE}?${params}`;

    console.log(`📡 ${url}`);

    try {
        const response = await fetch(url, {
            signal: AbortSignal.timeout(120000),
        });

        if (!response.ok) {
            console.log(`⚠️ HTTP ${response.status}`);
            return;
        }

        const registros = await response.json();

        if (!Array.isArray(registros)) {
            console.log("⚠️ API inválida");
            return;
        }

        console.log(`📦 ${registros.length} registros`);

        const servidoresMap = new Map<string, any>();
        const remuneracoesMap = new Map<string, any>();
        const estagiarios: any[] = [];
        const terceirizados: any[] = [];

        for (const item of registros) {
            const matricula = limparTexto(
                item.REGISTRO
            );

            const nome = limparTexto(item.NOME);

            const cargo = limparTexto(item.CARGO);

            const vinculo = limparTexto(
                item.VINCULO
            );

            const secretaria = limparTexto(
                item.DIVISAO
            );

            const lotacao = limparTexto(
                item.UNIDADE
            );

            const situacao = limparTexto(
                item.SITUACAOFUNCIONAL
            );

            const data_admissao =
                converterData(item.DATAADMISSAO);

            const data_desligamento =
                converterData(
                    item.DATADESLIGAMENTO
                );

            const carga_horaria =
                limparTexto(item.HORASEMANAL);

            /**
             * ESTAGIÁRIOS
             */

            if (ehEstagiario(item)) {
                estagiarios.push({
                    nome,

                    curso: null,
                    instituicao: null,

                    data_inicio: data_admissao,
                    data_fim: data_desligamento,

                    ano,

                    raw_json: item,
                });

                continue;
            }

            /**
             * TERCEIRIZADOS
             */

            if (ehTerceirizado(item)) {
                terceirizados.push({
                    nome,

                    funcao: cargo,

                    empresa: entidade.codigo,
                    cnpj_empresa: null,

                    data_inicio: data_admissao,
                    data_fim: data_desligamento,

                    ano,

                    raw_json: item,
                });

                continue;
            }

            /**
             * SERVIDORES (Deduplicar mantendo o último registro encontrado)
             */

            servidoresMap.set(matricula, {
                matricula,

                nome,

                cargo,
                funcao: cargo,

                lotacao,
                secretaria,

                vinculo,
                situacao,

                data_admissao,
                data_desligamento,

                carga_horaria,

                ativo:
                    !situacao
                        ?.toUpperCase()
                        ?.includes("INATIVO"),

                raw_json: item,
            });

            /**
             * REMUNERAÇÕES (Agregar valores se houver mais de um registro na mesma folha/mês)
             */

            const tipo = obterTipoFolha(item.REFERENCIA_NOME);
            const key = `${matricula}_${ano}_${mes}_${tipo}`;
            const proventosVal = converterNumero(item.PROVENTOS) || 0;
            const descontosVal = converterNumero(item.DESCONTOS) || 0;
            const liquiVal = converterNumero(
                item["LIQUIDO + (IsNull(PROVENTOS, 0)-IsNull(DESCONTOS,0))"]
            ) || 0;

            if (remuneracoesMap.has(key)) {
                const existing = remuneracoesMap.get(key);
                existing.remuneracao_bruta = Number((existing.remuneracao_bruta + proventosVal).toFixed(2));
                existing.descontos = Number((existing.descontos + descontosVal).toFixed(2));
                existing.remuneracao_liquida = Number((existing.remuneracao_liquida + liquiVal).toFixed(2));

                if (Array.isArray(existing.raw_json)) {
                    existing.raw_json.push(item);
                } else {
                    existing.raw_json = [existing.raw_json, item];
                }
            } else {
                remuneracoesMap.set(key, {
                    ano,
                    mes,

                    matricula,

                    nome,

                    cargo,
                    funcao: cargo,
                    vinculo,
                    lotacao,
                    secretaria,
                    carga_horaria,

                    remuneracao_bruta: proventosVal,
                    descontos: descontosVal,
                    remuneracao_liquida: liquiVal,
                    tipo,

                    raw_json: item,
                });
            }
        }

        const servidores = Array.from(servidoresMap.values());
        const remuneracoes = Array.from(remuneracoesMap.values());

        /**
         * SERVIDORES
         */

        if (servidores.length > 0) {
            const BATCH = 200;
            let ok = 0;
            for (let i = 0; i < servidores.length; i += BATCH) {
                const batch = servidores.slice(i, i + BATCH);
                const { error } = await supabase
                    .schema("transparencia")
                    .from("servidores")
                    .upsert(batch, {
                        onConflict:
                            "matricula",
                    });

                if (error) {
                    console.error(
                        "❌ servidores:",
                        error.message
                    );
                } else {
                    ok += batch.length;
                }
            }
            console.log(`✅ servidores: ${ok}/${servidores.length}`);
        }

        /**
         * REMUNERAÇÕES
         */

        if (remuneracoes.length > 0) {
            const BATCH = 200;
            let ok = 0;
            for (let i = 0; i < remuneracoes.length; i += BATCH) {
                const batch = remuneracoes.slice(i, i + BATCH);
                const { error } = await supabase
                    .schema("transparencia")
                    .from("remuneracoes")
                    .upsert(batch, {
                        onConflict:
                            "matricula,ano,mes,tipo",
                    });

                if (error) {
                    console.error(
                        "❌ remuneracoes:",
                        error.message
                    );
                } else {
                    ok += batch.length;
                }
            }
            console.log(`✅ remuneracoes: ${ok}/${remuneracoes.length}`);
        }

        /**
         * ESTAGIÁRIOS
         */

        if (estagiarios.length > 0) {
            const BATCH = 200;
            let ok = 0;
            for (let i = 0; i < estagiarios.length; i += BATCH) {
                const batch = estagiarios.slice(i, i + BATCH);
                const { error } = await supabase
                    .schema("transparencia")
                    .from("estagiarios")
                    .insert(batch);

                if (error) {
                    console.error(
                        "❌ estagiarios:",
                        error.message
                    );
                } else {
                    ok += batch.length;
                }
            }
            console.log(`✅ estagiarios: ${ok}/${estagiarios.length}`);
        }

        /**
         * TERCEIRIZADOS
         */

        if (terceirizados.length > 0) {
            const BATCH = 200;
            let ok = 0;
            for (let i = 0; i < terceirizados.length; i += BATCH) {
                const batch = terceirizados.slice(i, i + BATCH);
                const { error } = await supabase
                    .schema("transparencia")
                    .from("terceirizados")
                    .insert(batch);

                if (error) {
                    console.error(
                        "❌ terceirizados:",
                        error.message
                    );
                } else {
                    ok += batch.length;
                }
            }
            console.log(`✅ terceirizados: ${ok}/${terceirizados.length}`);
        }
    } catch (error) {
        console.error(
            `❌ erro ${ano}/${mes}:`,
            error
        );
    }
}

/**
 * EXECUÇÃO
 */

async function executar() {
    console.log(
        "🚀 IMPORTAÇÃO DE PESSOAL"
    );

    const agora = new Date();

    const entidades = await buscarEntidades();

    for (const entidade of entidades) {
        console.log(`\n🏢 Importando entidade: ${entidade.codigo} - ${entidade.nome}`);
        for (const ano of ANOS) {
            for (let mes = 1; mes <= 12; mes++) {
                /**
                 * evita meses futuros
                 */

                if (
                    ano === agora.getFullYear() &&
                    mes > agora.getMonth() + 1
                ) {
                    continue;
                }

                await importarMes(ano, mes, entidade);
            }
        }
    }

    console.log("\n🎉 FINALIZADO");
}

if (typeof require !== "undefined" && require.main === module) {
    executar();
}
