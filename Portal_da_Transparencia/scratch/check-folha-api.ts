async function checkApi() {
    const url = 'https://contreina.padremarcos.pi.gov.br/Transparencia/VersaoJson/Pessoal/?ConectarExercicio=2026&Listagem=Pessoal&DiaInicioPeriodo=01&MesInicialPeriodo=06&DiaFinalPeriodo=31&MesFinalPeriodo=06&Ano=2026&Empresa=1&MostraDadosConsolidado=False';
    console.log("Fetching Junho 2026...");
    try {
        const r = await fetch(url);
        const j = await r.json();
        console.log(`Junho 2026 Pessoal: ${j.length} records`);
    } catch(e: any) {
        console.log("Error Junho:", e.message);
    }
    
    const url2 = 'https://contreina.padremarcos.pi.gov.br/Transparencia/VersaoJson/Pessoal/?ConectarExercicio=2026&Listagem=Pessoal&DiaInicioPeriodo=01&MesInicialPeriodo=07&DiaFinalPeriodo=31&MesFinalPeriodo=07&Ano=2026&Empresa=1&MostraDadosConsolidado=False';
    console.log("Fetching Julho 2026...");
    try {
        const r2 = await fetch(url2);
        const j2 = await r2.json();
        console.log(`Julho 2026 Pessoal: ${j2.length} records`);
    } catch(e: any) {
        console.log("Error Julho:", e.message);
    }
}

checkApi();
