const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Roteamento
    content = content.replace(/\/admin\/publicacoes/g, '/admin/prestacao-contas');
    content = content.replace(/\/api\/admin\/publicacoes/g, '/api/admin/prestacao-contas');
    
    // Textos de UI
    content = content.replace(/Publicações/g, 'Prestação de Contas');
    content = content.replace(/AdminPublicacoesPage/g, 'AdminPrestacaoContasPage');
    content = content.replace(/Nenhuma publicação/g, 'Nenhum arquivo');
    content = content.replace(/Nova Publicação/g, 'Nova Prestação de Contas');
    content = content.replace(/Editar Publicação/g, 'Editar Prestação de Contas');
    content = content.replace(/Publicação salva/g, 'Prestação de Contas salva');
    content = content.replace(/Publicação excluída/g, 'Prestação de Contas excluída');
    
    // Tabela publicacoes -> planejamento_documentos apenas na API
    if (filePath.includes('api')) {
        content = content.replace(/\.from\("publicacoes"\)/g, '.schema("transparencia").from("planejamento_documentos")');
        content = content.replace(/\.from\('publicacoes'\)/g, '.schema("transparencia").from("planejamento_documentos")');
    }

    fs.writeFileSync(filePath, content, 'utf8');
}

function walk(dir) {
    const files = fs.readdirSync(dir);
    for (const f of files) {
        const p = path.join(dir, f);
        if (fs.statSync(p).isDirectory()) {
            walk(p);
        } else if (p.endsWith('.tsx') || p.endsWith('.ts')) {
            replaceInFile(p);
        }
    }
}

walk('Portal_Institucional/app/admin/prestacao-contas');
walk('Portal_Institucional/app/api/admin/prestacao-contas');
console.log("Done");
