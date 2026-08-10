const fs = require('fs');

const files = [
  'transparencia/transferencias/page.tsx',
  'transparencia/obras/page.tsx',
  'transparencia/recursos-humanos/servidores/page.tsx',
  'transparencia/concursos/page.tsx',
  'transparencia/diarias/page.tsx',
  'transparencia/relatorios/page.tsx',
  'transparencia/emendas/page.tsx'
];

files.forEach(f => {
  const p = 'C:/Users/Áurea Letícia/Documents/sitio-prefeitura/Portal_da_Transparencia/app/(paginas)/' + f;
  if (fs.existsSync(p)) {
    let content = fs.readFileSync(p, 'utf-8');
    
    // Skip if already processed
    if (content.includes('lastUpdate={dbUpdateDate}')) {
      console.log('Skipping ' + f + ' (already updated)');
      return;
    }

    const varName = f.includes('relatorios') ? 'docs' : 'data';

    const dateLogic = `
  const dbUpdateDate = useMemo(() => {
    if (!${varName} || !Array.isArray(${varName}) || ${varName}.length === 0) return "";
    return ${varName}.reduce((max, r) => (r.updated_at && r.updated_at > max) ? r.updated_at : max, "");
  }, [${varName}]);
`;

    // 1. Inject useMemo
    if (!content.includes('import {') || (!content.includes('useMemo') && !content.includes('useMemo,'))) {
        content = content.replace(/import \{([\s\S]*?)\} from 'react';/, "import { useMemo, $1 } from 'react';");
    }

    // Insert dateLogic before the first `return (` of the main component
    // To be safe, let's find `return (` and insert it before the first one inside the component.
    // Let's use a simpler marker: find `<ContentPage`
    let parts = content.split('<ContentPage');
    if (parts.length > 1) {
      // Find the last `return (` before `<ContentPage`
      const beforeContentPage = parts[0];
      const returnIndex = beforeContentPage.lastIndexOf('return (');
      
      if (returnIndex !== -1) {
         content = beforeContentPage.slice(0, returnIndex) + dateLogic + '\n  ' + beforeContentPage.slice(returnIndex) + '<ContentPage lastUpdate={dbUpdateDate}' + parts[1];
      }
    }

    fs.writeFileSync(p, content, 'utf-8');
    console.log('Updated ' + f);
  }
});
