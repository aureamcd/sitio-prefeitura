async function checkApiUrls() {
    const fetchLog = async (url: string, name: string) => {
        try {
            console.log(`\nTesting: ${name}`);
            const r = await fetch(url);
            if (!r.ok) {
                console.log(`Status: ${r.status}`);
                return;
            }
            const text = await r.text();
            if (text.startsWith('<')) console.log("Result: HTML Error Page");
            else console.log(`Result: JSON with ${JSON.parse(text).length} records`);
        } catch (e: any) {
            console.log(`Fetch Error: ${e.message}`);
        }
    }

    const q = '?ConectarExercicio=2026&Listagem=Pessoal&DiaInicioPeriodo=01&MesInicialPeriodo=06&DiaFinalPeriodo=30&MesFinalPeriodo=06&Ano=2026&Empresa=1&MostraDadosConsolidado=False';
    
    await fetchLog('https://transparencia.padremarcos.pi.gov.br/Transparencia/VersaoJson/Pessoal' + q, 'Prod, Transp(U), Pessoal(no slash)');
    await fetchLog('https://transparencia.padremarcos.pi.gov.br/transparencia/VersaoJson/Pessoal' + q, 'Prod, transp(L), Pessoal(no slash)');
    await fetchLog('https://contreina.padremarcos.pi.gov.br/transparencia/VersaoJson/Pessoal' + q, 'Contreina, transp(L), Pessoal(no slash)');
    await fetchLog('https://transparencia.padremarcos.pi.gov.br/transparencia/VersaoJson/FolhaPagamento' + q, 'Prod, FolhaPagamento');
    await fetchLog('https://transparencia.padremarcos.pi.gov.br/transparencia/VersaoJson/Servidores' + q, 'Prod, Servidores');
    await fetchLog('https://contreina.padremarcos.pi.gov.br/transparencia/VersaoJson/FolhaPagamento' + q, 'Contreina, FolhaPagamento');
}
checkApiUrls();
