fetch('https://transparencia.padremarcos.pi.gov.br/transparencia/recursos-humanos')
  .then(r => r.text())
  .then(html => {
     require('fs').writeFileSync('servidores.html', html);
  });
