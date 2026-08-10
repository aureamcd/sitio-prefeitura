const fs = require('fs');
const files = [
  'transparencia/transferencias/page.tsx',
  'transparencia/obras/page.tsx',
  'transparencia/recursos-humanos/servidores/page.tsx',
  'transparencia/concursos/page.tsx',
  'transparencia/diarias/page.tsx',
  'transparencia/relatorios/page.tsx',
  'transparencia/emendas/page.tsx',
  'S1-Gestao_e_Estrategia/contas_publicas/page.tsx'
];
files.forEach(f => {
  const p = 'C:/Users/Áurea Letícia/Documents/sitio-prefeitura/Portal_da_Transparencia/app/(paginas)/' + f;
  if (fs.existsSync(p)) {
    const c = fs.readFileSync(p, 'utf-8');
    const hasData = c.includes('const { data');
    const hasDataState = c.includes('const [data');
    const contentPageStart = c.indexOf('<ContentPage');
    const preview = contentPageStart > -1 ? c.slice(contentPageStart, contentPageStart + 200) : '';
    console.log('\n\n--- ' + f + ' ---');
    console.log('hasDataHook: ' + hasData + ', hasDataState: ' + hasDataState);
    console.log(preview);
  }
});
