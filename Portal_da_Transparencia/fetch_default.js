fetch('https://transparencia.padremarcos.pi.gov.br/')
  .then(r => r.text())
  .then(html => {
     require('fs').writeFileSync('default.html', html);
  });
