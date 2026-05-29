const BASE = "https://transparencia.padremarcos.pi.gov.br/Transparencia/VersaoJson/Pessoal/";

const listagemValues = [
    "Servidores",
    "Servidores13",
    "ServidoresComplementar",
    "ServidoresRescisao",
    "ServidoresInativos",
    "Folha",
    "Folha13",
    "FolhaComplementar",
    "FolhaRescisao",
    "Complementar",
    "Adiantamento13",
    "DecimoTerceiro",
    "Fechamento13",
    "Inativos",
    "Pensionistas",
    "Estagiarios",
    "Terceirizados",
    "Rescisao",
    "Rescisoes"
];

async function main() {
    console.log("Probing different Listagem parameter values for December 2024...");
    
    for (const val of listagemValues) {
        const params = new URLSearchParams({
            ConectarExercicio: "2024",
            Listagem: val,
            Empresa: "1",
            Ano: "2024",
            DiaInicioPeriodo: "01",
            MesInicialPeriodo: "12",
            DiaFinalPeriodo: "31",
            MesFinalPeriodo: "12",
            MostraDadosConsolidado: "False",
        });

        const url = `${BASE}?${params}`;
        try {
            const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
            if (res.ok) {
                const json = await res.json();
                if (Array.isArray(json) && json.length > 0) {
                    console.log(`✅ Listagem: "${val}" -> Returned ${json.length} records! Sample keys:`, Object.keys(json[0]));
                } else if (typeof json === "object" && json !== null) {
                    console.log(`🟡 Listagem: "${val}" -> Returned object (not array). Keys:`, Object.keys(json));
                } else {
                    console.log(`❌ Listagem: "${val}" -> Empty array or primitive`);
                }
            } else {
                console.log(`❌ Listagem: "${val}" -> HTTP ${res.status}`);
            }
        } catch (e: any) {
            console.log(`❌ Listagem: "${val}" -> Error: ${e.message}`);
        }
    }
}

main().catch(console.error);
