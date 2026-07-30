async function checkApi() {
    // Mes 06 (June) ends on 30
    const url = 'https://transparencia.padremarcos.pi.gov.br/Transparencia/VersaoJson/Pessoal/?ConectarExercicio=2026&Listagem=Pessoal&DiaInicioPeriodo=01&MesInicialPeriodo=06&DiaFinalPeriodo=30&MesFinalPeriodo=06&Ano=2026&Empresa=1&MostraDadosConsolidado=False';
    console.log("Fetching Junho 2026 (end day 30)...");
    try {
        const r = await fetch(url);
        const text = await r.text();
        if (text.startsWith('<')) {
            console.log("HTML Error on June");
        } else {
            const j = JSON.parse(text);
            console.log(`Junho 2026 Pessoal: ${j.length} records`);
        }
    } catch(e: any) {
        console.log("Error Junho:", e.message);
    }
}
checkApi();
