async function test() {
  const base = "https://contreina.padremarcos.pi.gov.br/transparencia/VersaoJson/Receitas/?ConectarExercicio=2026&Listagem=ReceitaOrcamentaria&DiaInicioPeriodo=01&MesInicialPeriodo=01&DiaFinalPeriodo=31&MesFinalPeriodo=12&Ano=2026&Empresa=1&MostraDadosConsolidado=True";
  console.log("Buscando API Consolidada...");
  const res = await (await fetch(base)).json();
  let somaPrev = 0;
  let somaArr = 0;
  if (Array.isArray(res)) {
    for (const r of res) {
      const cod = String(r.CODIGO || "").trim();
      if (["1000.00.0.0.00", "2000.00.0.0.00", "7000.00.0.0.00", "9000.00.0.0.00"].includes(cod)) {
        const prev = parseFloat(String(r.PREVISAO_ATUALIZADA || 0).replace(/\./g, "").replace(",", "."));
        const arr = parseFloat(String(r.ARRECADADO_TOTAL || 0).replace(/\./g, "").replace(",", "."));
        const prevIni = parseFloat(String(r.PREVISAO_INICIAL || 0).replace(/\./g, "").replace(",", "."));
        console.log(`-> ${cod} ${r.DESCRICAO} | Prev Inicial: R$ ${prevIni.toLocaleString("pt-BR", {minimumFractionDigits: 2})} | Prev Atualizada: R$ ${prev.toLocaleString("pt-BR", {minimumFractionDigits: 2})} | Arrecadado: R$ ${arr.toLocaleString("pt-BR", {minimumFractionDigits: 2})}`);
        if (cod.startsWith("9")) {
          somaPrev -= Math.abs(prev);
          somaArr -= Math.abs(arr);
        } else {
          somaPrev += prev;
          somaArr += arr;
        }
      }
    }
  }
  console.log("\n=======================================================");
  console.log("🎯 SOMA API CONSOLIDADA PREVISTO: R$", somaPrev.toLocaleString("pt-BR", {minimumFractionDigits: 2}));
  console.log("💵 SOMA API CONSOLIDADA ARRECADADO: R$", somaArr.toLocaleString("pt-BR", {minimumFractionDigits: 2}));
  console.log("=======================================================\n");
}
test();
