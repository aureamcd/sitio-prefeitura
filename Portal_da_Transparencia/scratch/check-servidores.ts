async function checkApiServidores() {
    const url = 'https://contreina.padremarcos.pi.gov.br/transparencia/VersaoJson/Pessoal/?ConectarExercicio=2026&Listagem=Servidores&DiaInicioPeriodo=01&MesInicialPeriodo=06&DiaFinalPeriodo=30&MesFinalPeriodo=06&Ano=2026&Empresa=1&MostraDadosConsolidado=False';
    console.log("Fetching Junho 2026 (Listagem=Servidores)...");
    try {
        const r = await fetch(url);
        const text = await r.text();
        if (text.startsWith('<')) {
            console.log("HTML Error");
        } else {
            const j = JSON.parse(text);
            console.log(`Junho 2026 Servidores: ${j.length} records`);
        }
    } catch(e: any) {
        console.log("Error:", e.message);
    }
}
checkApiServidores();
