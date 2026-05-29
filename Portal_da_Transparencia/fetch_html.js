fetch('https://transparencia.padremarcos.pi.gov.br/Transparencia/Servidores.aspx')
  .then(r => r.text())
  .then(html => {
     require('fs').writeFileSync('servidores.html', html);
  });
