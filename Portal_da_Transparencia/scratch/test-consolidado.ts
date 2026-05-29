const BASE = "https://transparencia.padremarcos.pi.gov.br/Transparencia/VersaoJson/Pessoal/";

async function main() {
    console.log("Querying with MostraDadosConsolidado=True for December 2024...");
    const params = new URLSearchParams({
        ConectarExercicio: "2024",
        Listagem: "Servidores",
        Empresa: "1",
        Ano: "2024",
        DiaInicioPeriodo: "01",
        MesInicialPeriodo: "12",
        DiaFinalPeriodo: "31",
        MesFinalPeriodo: "12",
        MostraDadosConsolidado: "True",
    });

    const url = `${BASE}?${params}`;
    try {
        const res = await fetch(url);
        if (res.ok) {
            const json = await res.json();
            if (Array.isArray(json)) {
                console.log(`Returned ${json.length} records!`);
                const refs = new Set(json.map(r => r.REFERENCIA_NOME));
                console.log("Unique REFERENCIA_NOME:", Array.from(refs));
                console.log("Sample record:", JSON.stringify(json[0], null, 2));
            } else {
                console.log("Not an array:", json);
            }
        } else {
            console.log("HTTP Error:", res.status);
        }
    } catch (e: any) {
        console.error("Error:", e.message);
    }
}

main();
