const BASE = "https://transparencia.padremarcos.pi.gov.br/Transparencia/VersaoJson/";

const paths = [
    "Pessoal",
    "Servidores",
    "Remuneracao",
    "Remuneracoes",
    "Folha",
    "FolhaPagamento",
    "Referencias",
    "Referencia",
    "ListarReferencias",
    "Tabelas",
    "Cargos",
    "Vagas"
];

async function main() {
    console.log("Probing different endpoints under VersaoJson/...");
    
    for (const p of paths) {
        const params = new URLSearchParams({
            ConectarExercicio: "2024",
            Ano: "2024",
            Empresa: "1"
        });
        const url = `${BASE}${p}/?${params}`;
        try {
            const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
            if (res.status !== 404) {
                console.log(`FOUND PATH: "${p}" -> HTTP ${res.status}`);
                if (res.ok) {
                    try {
                        const json = await res.json();
                        console.log(`  JSON response:`, typeof json === "object" ? Object.keys(json).slice(0, 10) : json);
                    } catch {
                        console.log(`  Non-JSON response`);
                    }
                }
            } else {
                console.log(`❌ Path: "${p}" -> 404`);
            }
        } catch (e: any) {
            console.log(`❌ Path: "${p}" -> Error: ${e.message}`);
        }
    }
}

main().catch(console.error);
