import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BASE = "https://transparencia.padremarcos.pi.gov.br/Transparencia/VersaoJson/Pessoal/";

async function main() {
    const { data: empresas, error } = await supabase
        .schema("transparencia")
        .from("empresas")
        .select("*");

    if (error) {
        console.error("Error fetching empresas:", error.message);
        return;
    }

    const codigosEmpresas = (empresas || []).map(e => e.codigo);
    console.log("Empresas:", codigosEmpresas);

    const refs = new Set<string>();
    let duplicatesCount = 0;
    const tasks: Promise<void>[] = [];

    for (const ano of [2023, 2024, 2025, 2026]) {
        for (const emp of codigosEmpresas) {
            for (let mes = 1; mes <= 12; mes++) {
                const fetchTask = (async () => {
                    const params = new URLSearchParams({
                        ConectarExercicio: String(ano),
                        Listagem: "Servidores",
                        Empresa: String(emp),
                        Ano: String(ano),
                        DiaInicioPeriodo: "01",
                        MesInicialPeriodo: String(mes).padStart(2, "0"),
                        DiaFinalPeriodo: "31",
                        MesFinalPeriodo: String(mes).padStart(2, "0"),
                        MostraDadosConsolidado: "False",
                    });

                    const url = `${BASE}?${params}`;
                    try {
                        const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
                        if (!response.ok) return;

                        const registros = await response.json();
                        if (Array.isArray(registros)) {
                            const registryMap = new Map();
                            for (const reg of registros) {
                                const regNum = reg.REGISTRO;
                                if (reg.REFERENCIA_NOME) {
                                    refs.add(reg.REFERENCIA_NOME);
                                }
                                if (!regNum) continue;

                                if (registryMap.has(regNum)) {
                                    duplicatesCount++;
                                    if (duplicatesCount <= 10) {
                                        console.log(`\n[DUP] Duplicate REGISTRO ${regNum} in ${ano}/${mes} for Empresa ${emp}:`);
                                        console.log(`  Record 1 (Ref: ${registryMap.get(regNum).REFERENCIA_NOME}) Proventos: ${registryMap.get(regNum).PROVENTOS}`);
                                        console.log(`  Record 2 (Ref: ${reg.REFERENCIA_NOME}) Proventos: ${reg.PROVENTOS}`);
                                    }
                                } else {
                                    registryMap.set(regNum, reg);
                                }
                            }
                        }
                    } catch (e) {
                        // Ignore errors
                    }
                })();
                tasks.push(fetchTask);
            }
        }
    }

    await Promise.all(tasks);
    console.log("\nUnique REFERENCIA_NOME values found in API:");
    console.log(Array.from(refs).sort());
    console.log(`Total duplicate registry occurrences found: ${duplicatesCount}`);
}

main().catch(console.error);
