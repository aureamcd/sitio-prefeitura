fetch('https://transparencia.padremarcos.pi.gov.br/Transparencia/Servidores.aspx')
  .then(r => r.text())
  .then(html => {
     const matches = html.match(/id=["'][^"']*Exercicio[^"']*["']/gi);
     console.log("IDs found:", matches);
  });
