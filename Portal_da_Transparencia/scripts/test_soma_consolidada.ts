async function test() {
  const base = "https://contreina.padremarcos.pi.gov.br/transparencia/VersaoJson/Receitas/?ConectarExercicio=2026&DiaInicioPeriodo=01&MesInicialPeriodo=01&DiaFinalPeriodo=31&MesFinalPeriodo=12&Ano=2026";
  const urlConsolidado = `${base}&Listagem=ReceitaOrcamentaria&Empresa=1&MostraDadosConsolidado=True`;
  const urlNaoConsolidadoEmp1 = `${base}&Listagem=ReceitaOrcamentaria&Empresa=1&MostraDadosConsolidado=False`;
  
  try {
    const resConsolidado = await (await fetch(urlConsolidado)).json();
    let arrConsolidadoNivel1 = 0;
    let prevConsolidadoNivel1 = 0;
    console.log("=== RECEITA ORÇAMENTÁRIA CONSOLIDADA (Todas as Entidades via API) ===");
    for (const r of resConsolidado) {
      if (String(r.ORDEM) === "1") {
        const arr = parseFloat(String(r.ARRECADADO_TOTAL||"0").replace(/\./g,"").replace(",","."));
        const prev = parseFloat(String(r.PREVISAO_ATUALIZADA||"0").replace(/\./g,"").replace(",","."));
        arrConsolidadoNivel1 += arr;
        prevConsolidadoNivel1 += prev;
        console.log(` -> COD: ${r.CODIGO} | NOME: ${r.NOME} | Arrecadado: ${arr.toLocaleString("pt-BR", {minimumFractionDigits: 2})} | Previsto: ${prev.toLocaleString("pt-BR", {minimumFractionDigits: 2})}`);
      }
    }
    console.log(`TOTAL ARRECADADO (Nível 1 Consolidado API): R$ ${arrConsolidadoNivel1.toLocaleString("pt-BR", {minimumFractionDigits: 2})}`);
    console.log(`TOTAL PREVISTO (Nível 1 Consolidado API): R$ ${prevConsolidadoNivel1.toLocaleString("pt-BR", {minimumFractionDigits: 2})}`);

    // Agora somando as 9 entidades separadamente
    const empresas = ["1", "3", "4", "5", "6", "7", "8", "9", "10"];
    let somaArrecadadoNivel1Todas = 0;
    let somaPrevistoNivel1Todas = 0;
    console.log("\n=== SOMANDO AS 9 ENTIDADES SEPARADAMENTE (Nível 1) ===");
    for (const emp of empresas) {
      const u = `${base}&Listagem=ReceitaOrcamentaria&Empresa=${emp}&MostraDadosConsolidado=False`;
      const res = await (await fetch(u)).json();
      let arrEmp = 0;
      let prevEmp = 0;
      if (Array.isArray(res)) {
        for (const r of res) {
          if (String(r.ORDEM) === "1") {
            arrEmp += parseFloat(String(r.ARRECADADO_TOTAL||"0").replace(/\./g,"").replace(",","."));
            prevEmp += parseFloat(String(r.PREVISAO_ATUALIZADA||"0").replace(/\./g,"").replace(",","."));
          }
        }
      }
      somaArrecadadoNivel1Todas += arrEmp;
      somaPrevistoNivel1Todas += prevEmp;
      console.log(`Empresa ${emp}: Arrecadado = R$ ${arrEmp.toLocaleString("pt-BR", {minimumFractionDigits: 2})} | Previsto = R$ ${prevEmp.toLocaleString("pt-BR", {minimumFractionDigits: 2})}`);
    }
    console.log(`TOTAL ARRECADADO AS 9 EMPRESAS SOMADAS: R$ ${somaArrecadadoNivel1Todas.toLocaleString("pt-BR", {minimumFractionDigits: 2})}`);
    console.log(`TOTAL PREVISTO AS 9 EMPRESAS SOMADAS: R$ ${somaPrevistoNivel1Todas.toLocaleString("pt-BR", {minimumFractionDigits: 2})}`);

  } catch (e: any) {
    console.error("Erro no teste:", e.message);
  }
}

test();
