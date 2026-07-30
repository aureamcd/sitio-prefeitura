async function checkApi() {
    const fetchAndLog = async (url: string, name: string) => {
        console.log(`Fetching ${name}...`);
        try {
            const r = await fetch(url);
            const text = await r.text();
            if (text.startsWith('<')) {
                console.log(`HTML Error on ${name}:`, text.substring(0, 100));
            } else {
                const j = JSON.parse(text);
                console.log(`${name} OK: ${j.length} records`);
            }
        } catch(e: any) {
            console.log(`Error ${name}:`, e.message);
        }
    };

    // 1. Contreina - Jan (31)
    await fetchAndLog('https://contreina.padremarcos.pi.gov.br/transparencia/VersaoJson/Pessoal/?ConectarExercicio=2026&Listagem=Pessoal&DiaInicioPeriodo=01&MesInicialPeriodo=01&DiaFinalPeriodo=31&MesFinalPeriodo=01&Ano=2026&Empresa=1&MostraDadosConsolidado=False', 'Jan/31 Contreina');

    // 2. Contreina - Jun (31) - the original script format
    await fetchAndLog('https://contreina.padremarcos.pi.gov.br/transparencia/VersaoJson/Pessoal/?ConectarExercicio=2026&Listagem=Pessoal&DiaInicioPeriodo=01&MesInicialPeriodo=06&DiaFinalPeriodo=31&MesFinalPeriodo=06&Ano=2026&Empresa=1&MostraDadosConsolidado=False', 'Jun/31 Contreina');

    // 3. Contreina - Jun (30)
    await fetchAndLog('https://contreina.padremarcos.pi.gov.br/transparencia/VersaoJson/Pessoal/?ConectarExercicio=2026&Listagem=Pessoal&DiaInicioPeriodo=01&MesInicialPeriodo=06&DiaFinalPeriodo=30&MesFinalPeriodo=06&Ano=2026&Empresa=1&MostraDadosConsolidado=False', 'Jun/30 Contreina');
}
checkApi();
