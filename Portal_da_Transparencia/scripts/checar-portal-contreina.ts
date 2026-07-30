import https from "https";

const url = "https://picontreina2.dcfiorilli.com.br:876/transparencia/";

async function checar() {
  console.log(`=== TESTANDO CONEXÃO COM ${url} ===`);
  const agent = new https.Agent({ rejectUnauthorized: false });
  
  return new Promise<void>((resolve) => {
    https.get(url, { agent }, (res) => {
      console.log("Status HTTP:", res.statusCode);
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        console.log("Tamanho do HTML recebido:", data.length);
        const titleMatch = data.match(/<title>(.*?)<\/title>/i);
        if (titleMatch) console.log("Título da página:", titleMatch[1]);

        // Procurar links ou menus no HTML
        const matches = data.match(/<a[^>]+>(.*?)<\/a>/gi) || [];
        console.log(`\nEncontrados ${matches.length} links no portal. Principais menus/módulos encontrados:`);
        const vistos = new Set<string>();
        matches.forEach(m => {
          const txt = m.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
          if (txt && !vistos.has(txt) && txt.length > 2) {
            vistos.add(txt);
            if (/balan|rreo|rgf|lrf|contas|parecer|relat|fiscal|gestão|planej/i.test(txt)) {
              console.log("  📌 [MENU]", txt);
            }
          }
        });
        resolve();
      });
    }).on("error", (err) => {
      console.error("Erro ao conectar no portal Fiorilli/Contreina:", err.message);
      resolve();
    });
  });
}

checar();
