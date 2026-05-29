fetch('https://transparencia.padremarcos.pi.gov.br/transparencia/recursos-humanos')
  .then(r => r.text())
  .then(html => {
     const matches = html.match(/id=["'][^"']*Exercicio[^"']*["']/gi);
     console.log("IDs found:", matches);
  });
