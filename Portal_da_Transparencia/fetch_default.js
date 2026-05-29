fetch('https://transparencia.padremarcos.pi.gov.br/Transparencia/Default.aspx')
  .then(r => r.text())
  .then(html => {
     require('fs').writeFileSync('default.html', html);
  });
