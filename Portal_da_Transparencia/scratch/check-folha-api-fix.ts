async function checkApi() {
    // Mes 06 (June) ends on 30
    const url = 'https://contreina.padremarcos.pi.gov.br/Transparencia/VersaoJson/Pessoal/?ConectarExercicio=2026&Listagem=Pessoal&DiaInicioPeriodo=01&MesInicialPeriodo=06&DiaFinalPeriodo=30&MesFinalPeriodo=06&Ano=2026&Empresa=1&MostraDadosConsolidado=False';
    console.log("Fetching Junho 2026 (end day 30)...");
    try {
        const r = await fetch(url);
        const text = await r.text();
        if (text.startsWith('<')) {
            console.log("HTML Error");
        } else {
            const j = JSON.parse(text);
            console.log(`Junho 2026 Pessoal: ${j.length} records`);
        }
    } catch(e: any) {
        console.log("Error Junho:", e.message);
    }
    
    // Mes 07 (July) ends on 31
    const url2 = 'https://contreina.padremarcos.pi.gov.br/Transparencia/VersaoJson/Pessoal/?ConectarExercicio=2026&Listagem=Pessoal&DiaInicioPeriodo=01&MesInicialPeriodo=07&DiaFinalPeriodo=31&MesFinalPeriodo=07&Ano=2026&Empresa=1&MostraDadosConsolidado=False';
    console.log("Fetching Julho 2026 (end day 31)...");
    try {
        const r2 = await fetch(url2);
        const text2 = await r2.text();
        if (text2.startsWith('<')) {
            console.log("HTML Error");
        } else {
            const j2 = JSON.parse(text2);
            console.log(`Julho 2026 Pessoal: ${j2.length} records`);
        }
    } catch(e: any) {
        console.log("Error Julho:", e.message);
    }
}

checkApi();
