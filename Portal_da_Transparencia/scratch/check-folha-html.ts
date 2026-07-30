async function checkApiHtml() {
    const url = 'https://contreina.padremarcos.pi.gov.br/Transparencia/VersaoJson/Pessoal/?ConectarExercicio=2026&Listagem=Pessoal&DiaInicioPeriodo=01&MesInicialPeriodo=06&DiaFinalPeriodo=31&MesFinalPeriodo=06&Ano=2026&Empresa=1&MostraDadosConsolidado=False';
    const r = await fetch(url);
    const text = await r.text();
    console.log("HTML response for June:", text.substring(0, 500));
}

checkApiHtml();
